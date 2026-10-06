-- Event documents replace the organization-wide document without deleting its backup.
create table public.platform_events (
 id text primary key, organization_id uuid not null references public.organizations(id),
 founder_id uuid not null references auth.users(id),
 code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
 code_enabled boolean not null default true, document jsonb not null,
 revision bigint not null default 1, created_at timestamptz not null default now()
);
create table public.event_members (
 id uuid primary key default gen_random_uuid(), event_id text not null references public.platform_events(id),
 user_id uuid not null references auth.users(id), role text not null check(role in ('founder','director','staff')),
 joined_at timestamptz not null default now(), removed_at timestamptz,
 unique(event_id,user_id)
);
create index event_members_user on public.event_members(user_id,event_id) where removed_at is null;
create table public.event_invitations (
 id uuid primary key default gen_random_uuid(), event_id text not null references public.platform_events(id),
 role text not null check(role in ('director','staff')), created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), revoked_at timestamptz
);
create table public.event_join_log (
 id uuid primary key default gen_random_uuid(), event_id text not null references public.platform_events(id),
 user_id uuid not null references auth.users(id), invitation_id uuid references public.event_invitations(id),
 role text not null, joined_at timestamptz not null default now(), entry_kind text not null check(entry_kind in ('code','link'))
);
-- Legacy records have no authenticated creator field. Approved fallback: oldest org owner.
do $$ begin
 if exists(select 1 from public.platform_workspaces w where jsonb_array_length(w.events)>0 and not exists(select 1 from public.memberships m where m.organization_id=w.organization_id and m.role='owner')) then
  raise exception 'Migração interrompida: organização com eventos sem proprietário. Identifique o fundador antes de continuar.';
 end if;
end $$;
insert into public.platform_events(id,organization_id,founder_id,document)
select e->>'id',w.organization_id,m.user_id,e from public.platform_workspaces w
cross join lateral jsonb_array_elements(w.events) e
cross join lateral (select user_id from public.memberships where organization_id=w.organization_id and role='owner' order by created_at,id limit 1) m;
insert into public.event_members(event_id,user_id,role)
select e.id,m.user_id,case when m.user_id=e.founder_id then 'founder' when m.role in ('owner','admin') then 'director' else 'staff' end
from public.platform_events e join public.memberships m on m.organization_id=e.organization_id;

create function private.event_role(p_event text) returns text
language sql stable security definer set search_path='' as $$
 select role from public.event_members where event_id=p_event and user_id=(select auth.uid()) and removed_at is null;
$$;
revoke all on function private.event_role(text) from public,anon;
grant execute on function private.event_role(text) to authenticated;
alter table public.platform_events enable row level security;
alter table public.event_members enable row level security;
alter table public.event_invitations enable row level security;
alter table public.event_join_log enable row level security;
grant select on public.platform_events,public.event_members,public.event_invitations,public.event_join_log to authenticated;
create policy event_read on public.platform_events for select to authenticated using(private.event_role(id) is not null);
create policy member_read on public.event_members for select to authenticated using(private.event_role(event_id) is not null);
create policy invite_read on public.event_invitations for select to authenticated using(private.event_role(event_id)='founder');
create policy join_read on public.event_join_log for select to authenticated using(private.event_role(event_id)='founder' or user_id=(select auth.uid()));

create function public.event_list() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('document',e.document,'revision',e.revision,'code',e.code,'codeEnabled',e.code_enabled,'role',m.role,'organizationId',e.organization_id,'memberId',m.id) order by e.created_at,e.id),'[]'::jsonb)
 from public.platform_events e join public.event_members m on m.event_id=e.id where m.user_id=(select auth.uid()) and m.removed_at is null;
$$;
create function public.event_create(p_org uuid,p_document jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.platform_events; doc jsonb;
begin
 if auth.uid() is null or not public.is_org_member(p_org) then raise exception using errcode='42501',message='Sem acesso à organização'; end if;
 if jsonb_typeof(p_document) <> 'object' or nullif(trim(p_document->>'name'),'') is null then raise exception 'Informe o nome do evento'; end if;
 doc := p_document || jsonb_build_object('id',coalesce(nullif(p_document->>'id',''),gen_random_uuid()::text));
 insert into public.platform_events(id,organization_id,founder_id,document) values(doc->>'id',p_org,auth.uid(),doc) returning * into ev;
 insert into public.event_members(event_id,user_id,role) values(ev.id,auth.uid(),'founder');
 return jsonb_build_object('document',ev.document,'revision',ev.revision,'code',ev.code,'codeEnabled',true,'role','founder','organizationId',p_org);
end $$;
create function public.event_save(p_event text,p_revision bigint,p_document jsonb) returns bigint language plpgsql security definer set search_path='' as $$
declare rev bigint;
begin
 if private.event_role(p_event) is null then raise exception using errcode='42501',message='Sem acesso ao evento'; end if;
 if p_document->>'id' is distinct from p_event then raise exception 'O ID do evento não pode mudar'; end if;
 update public.platform_events set document=p_document,revision=revision+1 where id=p_event and revision=p_revision returning revision into rev;
 if rev is null then raise exception using errcode='40001',message='Outra pessoa atualizou o evento. Exporte suas alterações antes de recarregar.'; end if;
 return rev;
end $$;
create function public.event_invite(p_event text,p_role text) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation uuid;
begin
 if private.event_role(p_event) <> 'founder' or private.event_role(p_event) is null then raise exception using errcode='42501',message='Somente o fundador pode gerar convites'; end if;
 insert into public.event_invitations(event_id,role,created_by) values(p_event,p_role,auth.uid()) returning id into invitation;
 return invitation;
end $$;
create function public.event_revoke_invite(p_invitation uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.event_invitations where id=p_invitation and private.event_role(event_id)='founder') then raise exception using errcode='42501',message='Sem permissão para revogar convite'; end if;
 update public.event_invitations set revoked_at=now() where id=p_invitation;
end $$;
create function public.event_code_enabled(p_event text,p_enabled boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if private.event_role(p_event) is distinct from 'founder' then raise exception using errcode='42501',message='Somente o fundador pode alterar o código'; end if;
 update public.platform_events set code_enabled=p_enabled where id=p_event;
end $$;
create function public.event_join(p_code text,p_invitation uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.platform_events; invitation public.event_invitations; selected_role text := 'staff'; existing public.event_members;
begin
 if auth.uid() is null then raise exception using errcode='42501',message='Entre na sua conta para aceitar o convite'; end if;
 select * into ev from public.platform_events where code=upper(trim(p_code));
 if ev.id is null then raise exception 'Código inválido'; end if;
 if p_invitation is null then
  if not ev.code_enabled then raise exception 'Código revogado'; end if;
 else
  select * into invitation from public.event_invitations where id=p_invitation and event_id=ev.id and revoked_at is null;
  if invitation.id is null then raise exception 'Convite inválido ou revogado'; end if;
  selected_role := invitation.role;
 end if;
 select * into existing from public.event_members where event_id=ev.id and user_id=auth.uid();
 if existing.removed_at is not null and (p_invitation is null or invitation.created_at <= existing.removed_at) then raise exception 'Acesso removido. Solicite um novo convite ao fundador'; end if;
 insert into public.event_members(event_id,user_id,role) values(ev.id,auth.uid(),selected_role)
 on conflict(event_id,user_id) do update set role=case when event_members.removed_at is null then event_members.role else excluded.role end, removed_at=null;
 selected_role := private.event_role(ev.id);
 insert into public.event_join_log(event_id,user_id,invitation_id,role,entry_kind) values(ev.id,auth.uid(),p_invitation,selected_role,case when p_invitation is null then 'code' else 'link' end);
 return jsonb_build_object('id',ev.id,'role',selected_role);
end $$;
-- No public/anonymous execution; mutations only through checked RPCs, never direct table writes.
revoke all on function public.event_list(),public.event_create(uuid,jsonb),public.event_save(text,bigint,jsonb),public.event_invite(text,text),public.event_revoke_invite(uuid),public.event_code_enabled(text,boolean),public.event_join(text,uuid) from public,anon;
grant execute on function public.event_list(),public.event_create(uuid,jsonb),public.event_save(text,bigint,jsonb),public.event_invite(text,text),public.event_revoke_invite(uuid),public.event_code_enabled(text,boolean),public.event_join(text,uuid) to authenticated;

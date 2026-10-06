create table public.user_event_permissions (
 user_id uuid primary key references auth.users(id),multi_event boolean not null default false,updated_at timestamptz not null default now()
);
alter table public.user_event_permissions enable row level security;
grant select on public.user_event_permissions to authenticated;
create policy own_event_permission on public.user_event_permissions for select to authenticated using(user_id=(select auth.uid()));
insert into public.user_event_permissions(user_id,multi_event)
select id,coalesce(lower(email)='renannascimento0304@gmail.com',false) from auth.users;
create function private.seed_event_permission() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.user_event_permissions(user_id,multi_event) values(new.id,coalesce(lower(new.email)='renannascimento0304@gmail.com',false));
 return new;
end $$;
revoke all on function private.seed_event_permission() from public,anon,authenticated;
create trigger seed_event_permission after insert on auth.users for each row execute function private.seed_event_permission();
create function public.event_creation_permission() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare enabled boolean; events bigint;
begin
 if auth.uid() is null then raise exception using errcode='42501',message='Entre na sua conta'; end if;
 select multi_event into enabled from public.user_event_permissions where user_id=auth.uid();
 select count(*) into events from public.event_members where user_id=auth.uid() and removed_at is null;
 return jsonb_build_object('multiEvent',coalesce(enabled,false),'eventCount',events,'canCreate',coalesce(enabled,false) or events=0);
end $$;
revoke all on function public.event_creation_permission() from public,anon;
grant execute on function public.event_creation_permission() to authenticated;
-- All creation paths (including backup import) pass through this serialized transaction.
create or replace function public.event_create(p_org uuid,p_document jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.platform_events; doc jsonb;
begin
 if auth.uid() is null or not public.is_org_member(p_org) then raise exception using errcode='42501',message='Sem acesso à organização'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,46));
 if not coalesce((select multi_event from public.user_event_permissions where user_id=auth.uid()),false)
  and exists(select 1 from public.event_members where user_id=auth.uid() and removed_at is null) then
  raise exception using errcode='42501',message='Sua conta tem limite de um evento. Solicite a liberação de múltiplos eventos.';
 end if;
 if jsonb_typeof(p_document) <> 'object' or nullif(trim(p_document->>'name'),'') is null then raise exception 'Informe o nome do evento'; end if;
 doc := p_document || jsonb_build_object('id',coalesce(nullif(p_document->>'id',''),gen_random_uuid()::text));
 insert into public.platform_events(id,organization_id,founder_id,document) values(doc->>'id',p_org,auth.uid(),doc) returning * into ev;
 insert into public.event_members(event_id,user_id,role) values(ev.id,auth.uid(),'founder');
 return jsonb_build_object('document',ev.document || jsonb_build_object('staffMembers',private.event_team_document(ev.id)),'revision',ev.revision,'code',ev.code,'codeEnabled',true,'role','founder','organizationId',p_org,'creationPermission',public.event_creation_permission());
end $$;

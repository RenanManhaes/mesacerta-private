-- Incremental bridge for the current React event document. Domain tables are retained.
-- One document per organization; optimistic revisions prevent silent concurrent overwrites.
create table public.platform_workspaces (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 events jsonb not null check (jsonb_typeof(events) = 'array'),
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.platform_workspaces enable row level security;
grant select, insert, update on public.platform_workspaces to authenticated;
create policy workspace_read on public.platform_workspaces for select to authenticated using (public.is_org_member(organization_id));
create policy workspace_insert on public.platform_workspaces for insert to authenticated with check (public.is_org_member(organization_id));
create policy workspace_update on public.platform_workspaces for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create function public.platform_workspace_revision() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if new.organization_id <> old.organization_id then raise exception 'Organization cannot change'; end if;
 new.revision := old.revision + 1; new.updated_at := now(); return new;
end $$;
create trigger workspace_revision before update on public.platform_workspaces for each row execute function public.platform_workspace_revision();
revoke execute on function public.platform_workspace_revision() from public, anon, authenticated;

create schema if not exists private;
grant usage on schema private to authenticated;

-- Team display uses actual membership rows; metadata is display-only, never authorization.
create function private.platform_team(p_org uuid)
returns table (id uuid, user_id uuid, role text, name text, email text)
language sql stable security definer set search_path = '' as $$
 select m.id,m.user_id,m.role,coalesce(u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1)),u.email::text
 from public.memberships m join auth.users u on u.id=m.user_id
 where m.organization_id=p_org and public.is_org_member(p_org);
$$;
revoke execute on function private.platform_team(uuid) from public, anon;
grant execute on function private.platform_team(uuid) to authenticated;

-- Adding already registered teammates does not send email or create fictitious users.
create function private.platform_add_member(p_org uuid,p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
 if auth.uid() is null or not public.is_org_admin(p_org) then raise exception 'Somente administradores podem convidar'; end if;
 select id into target_id from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null limit 1;
 if target_id is null then raise exception 'A pessoa precisa criar e confirmar sua conta primeiro'; end if;
 insert into public.memberships(organization_id,user_id,role) values(p_org,target_id,'member') on conflict(organization_id,user_id) do nothing;
end $$;
revoke execute on function private.platform_add_member(uuid,text) from public, anon;
grant execute on function private.platform_add_member(uuid,text) to authenticated;

create function public.platform_team(p_org uuid)
returns table(id uuid,user_id uuid,role text,name text,email text)
language sql stable security invoker set search_path = '' as $$ select * from private.platform_team(p_org); $$;
revoke execute on function public.platform_team(uuid) from public, anon;
grant execute on function public.platform_team(uuid) to authenticated;
create function public.platform_add_member(p_org uuid,p_email text)
returns void language sql security invoker set search_path = '' as $$ select private.platform_add_member(p_org,p_email); $$;
revoke execute on function public.platform_add_member(uuid,text) from public, anon;
grant execute on function public.platform_add_member(uuid,text) to authenticated;

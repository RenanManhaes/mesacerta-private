create table public.team_catalog (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 kind text not null check(kind in ('function','area','title')),name text not null check(length(trim(name)) between 1 and 80 and name=trim(name)),
 archived_at timestamptz,created_at timestamptz not null default now()
);
create unique index team_catalog_name on public.team_catalog(organization_id,kind,lower(name));
alter table public.team_catalog enable row level security;
grant select on public.team_catalog to authenticated;
create policy team_catalog_read on public.team_catalog for select to authenticated using(private.event_org_role(organization_id,true));
create function private.seed_team_catalog(p_org uuid) returns void language sql security definer set search_path='' as $$
 insert into public.team_catalog(organization_id,kind,name)
 select p_org,kind,name from (values ('function','Produção'),('function','Credenciamento'),('function','Audiovisual'),('function','Comercial'),('function','Recepção'),('function','Financeiro'),('function','Limpeza'),('function','Segurança'),
 ('area','Produção'),('area','Credenciamento'),('area','Audiovisual'),('area','Comercial'),('area','Recepção'),('area','Financeiro'),('area','Limpeza'),('area','Segurança'),('title','Fundador'),('title','Coordenador'),('title','Assistente')) as initial(kind,name) on conflict do nothing;
$$;
create function private.organizations_seed_team_catalog() returns trigger language plpgsql security definer set search_path='' as $$ begin perform private.seed_team_catalog(new.id);return new;end $$;
revoke all on function private.seed_team_catalog(uuid),private.organizations_seed_team_catalog() from public,anon,authenticated;
create trigger organizations_seed_team_catalog after insert on public.organizations for each row execute function private.organizations_seed_team_catalog();
select private.seed_team_catalog(id) from public.organizations;
-- Existing authenticated profiles become reusable suggestions, without importing team members.
insert into public.team_catalog(organization_id,kind,name)
select distinct e.organization_id,values.kind,trim(values.name) from public.event_members m join public.platform_events e on e.id=m.event_id
cross join lateral (values ('function',m.function),('area',m.area),('title',case when m.role='founder' then 'Fundador' else m.job_title end)) as values(kind,name)
where nullif(trim(values.name),'') is not null on conflict do nothing;
create function private.catalog_usage(p_catalog uuid) returns bigint language sql stable security definer set search_path='' as $$
 select count(distinct m.user_id) from public.team_catalog c join public.platform_events e on e.organization_id=c.organization_id join public.event_members m on m.event_id=e.id and m.removed_at is null
 where c.id=p_catalog and lower(case c.kind when 'function' then m.function when 'area' then m.area else case when m.role='founder' then 'Fundador' else m.job_title end end)=lower(c.name);
$$;
revoke all on function private.catalog_usage(uuid) from public,anon,authenticated;
create function public.team_catalog_list(p_org uuid) returns table(id uuid,kind text,name text,people_count bigint) language sql stable security definer set search_path='' as $$
 select c.id,c.kind,c.name,private.catalog_usage(c.id) from public.team_catalog c where c.organization_id=p_org and c.archived_at is null and private.event_org_role(p_org,true) order by lower(c.name);
$$;
create function public.team_catalog_create(p_org uuid,p_kind text,p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare record_id uuid;
begin
 if not private.event_org_role(p_org,true) then raise exception using errcode='42501',message='Sem permissão para gerenciar o catálogo'; end if;
 insert into public.team_catalog(organization_id,kind,name) values(p_org,p_kind,trim(p_name))
 on conflict(organization_id,kind,lower(name)) do update set archived_at=null returning id into record_id;
 return record_id;
end $$;
create function public.team_catalog_remove(p_catalog uuid,p_confirm_count bigint default null) returns void language plpgsql security definer set search_path='' as $$
declare item public.team_catalog; people bigint;
begin
 select * into item from public.team_catalog where id=p_catalog and archived_at is null for update;
 if item.id is null or not private.event_org_role(item.organization_id,true) then raise exception using errcode='42501',message='Sem permissão para gerenciar o catálogo'; end if;
 people := private.catalog_usage(p_catalog);
 if p_confirm_count is distinct from people then raise exception using errcode='P0001',message=format('%s pessoas usam este valor. Confirme a exclusão com a contagem atual.',people); end if;
 update public.team_catalog set archived_at=now() where id=p_catalog;
end $$;
revoke all on function public.team_catalog_list(uuid),public.team_catalog_create(uuid,text,text),public.team_catalog_remove(uuid,bigint) from public,anon;
grant execute on function public.team_catalog_list(uuid),public.team_catalog_create(uuid,text,text),public.team_catalog_remove(uuid,bigint) to authenticated;
-- No free-text profile bypass: new values require explicit creation in the catalog first.
alter function public.event_edit_person(uuid,text,text,text,text,text,text) set schema private;
revoke all on function private.event_edit_person(uuid,text,text,text,text,text,text) from public,anon,authenticated;
create function public.event_edit_person(p_member uuid,p_name text,p_email text,p_phone text,p_function text,p_area text default '',p_job_title text default '') returns void language plpgsql security definer set search_path='' as $$
declare person public.event_members; org uuid; item record;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) not in ('founder','director') or private.event_role(person.event_id) is null then raise exception using errcode='42501',message='Sem permissão para editar a equipe'; end if;
 select organization_id into org from public.platform_events where id=person.event_id;
 for item in select * from (values ('function',p_function),('area',p_area),('title',case when person.role='founder' then '' else p_job_title end)) as values(kind,name) loop
  if nullif(trim(item.name),'') is not null and not exists(select 1 from public.team_catalog c where c.organization_id=org and c.kind=item.kind and lower(c.name)=lower(trim(item.name)) and c.archived_at is null) then raise exception 'Confirme a criação do novo valor no catálogo antes de salvar'; end if;
 end loop;
 perform private.event_edit_person(p_member,p_name,p_email,p_phone,p_function,p_area,p_job_title);
end $$;
revoke all on function public.event_edit_person(uuid,text,text,text,text,text,text) from public,anon;
grant execute on function public.event_edit_person(uuid,text,text,text,text,text,text) to authenticated;

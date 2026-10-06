-- Preserved profile values remain editable after suggestion archival. Serialize usage checks per organization.
create or replace function public.team_catalog_create(p_org uuid,p_kind text,p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare record_id uuid;
begin
 if not private.event_org_role(p_org,true) then raise exception using errcode='42501',message='Sem permissão para gerenciar o catálogo'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_org::text,59));
 insert into public.team_catalog(organization_id,kind,name) values(p_org,p_kind,trim(p_name))
 on conflict(organization_id,kind,lower(name)) do update set archived_at=null returning id into record_id;
 return record_id;
end $$;
create or replace function public.team_catalog_remove(p_catalog uuid,p_confirm_count bigint default null) returns void language plpgsql security definer set search_path='' as $$
declare item public.team_catalog; people bigint;
begin
 select * into item from public.team_catalog where id=p_catalog and archived_at is null for update;
 if item.id is null or not private.event_org_role(item.organization_id,true) then raise exception using errcode='42501',message='Sem permissão para gerenciar o catálogo'; end if;
 perform pg_advisory_xact_lock(hashtextextended(item.organization_id::text,59));
 people := private.catalog_usage(p_catalog);
 if p_confirm_count is distinct from people then raise exception using errcode='P0001',message=format('%s pessoas usam este valor. Confirme a exclusão com a contagem atual.',people); end if;
 update public.team_catalog set archived_at=now() where id=p_catalog;
end $$;
create or replace function public.event_edit_person(p_member uuid,p_name text,p_email text,p_phone text,p_function text,p_area text default '',p_job_title text default '') returns void language plpgsql security definer set search_path='' as $$
declare person public.event_members; org uuid; item record;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) not in ('founder','director') or private.event_role(person.event_id) is null then raise exception using errcode='42501',message='Sem permissão para editar a equipe'; end if;
 select organization_id into org from public.platform_events where id=person.event_id;
 perform pg_advisory_xact_lock(hashtextextended(org::text,59));
 for item in select * from (values ('function',p_function),('area',p_area),('title',case when person.role='founder' then '' else p_job_title end)) as values(kind,name) loop
  if nullif(trim(item.name),'') is not null and lower(trim(item.name)) is distinct from lower(case item.kind when 'function' then person.function when 'area' then person.area else person.job_title end) and not exists(select 1 from public.team_catalog c where c.organization_id=org and c.kind=item.kind and lower(c.name)=lower(trim(item.name)) and c.archived_at is null) then raise exception 'Confirme a criação do novo valor no catálogo antes de salvar'; end if;
 end loop;
 perform private.event_edit_person(p_member,p_name,p_email,p_phone,p_function,p_area,p_job_title);
end $$;

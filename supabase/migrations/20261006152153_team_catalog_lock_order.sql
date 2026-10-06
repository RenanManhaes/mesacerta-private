-- Organization lock precedes catalog row/membership locks.
create or replace function public.team_catalog_remove(p_catalog uuid,p_confirm_count bigint default null) returns void language plpgsql security definer set search_path='' as $$
declare item public.team_catalog; people bigint;
begin
 select * into item from public.team_catalog where id=p_catalog and archived_at is null;
 if item.id is null or not private.event_org_role(item.organization_id,true) then raise exception using errcode='42501',message='Sem permissão para gerenciar o catálogo'; end if;
 perform pg_advisory_xact_lock(hashtextextended(item.organization_id::text,59));
 select * into item from public.team_catalog where id=p_catalog and archived_at is null for update;
 if item.id is null then raise exception 'Valor ja excluido; atualize o catalogo'; end if;
 people := private.catalog_usage(p_catalog);
 if p_confirm_count is distinct from people then raise exception using errcode='P0001',message=format('%s pessoas usam este valor. Confirme a exclusão com a contagem atual.',people); end if;
 update public.team_catalog set archived_at=now() where id=p_catalog;
end $$;
create or replace function public.event_remove_person(p_member uuid) returns void language plpgsql security definer set search_path='' as $$
declare person public.event_members;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) is distinct from 'founder' or person.role='founder' then raise exception using errcode='42501',message='Somente o fundador remove pessoas; o fundador não pode ser removido'; end if;
 perform pg_advisory_xact_lock(hashtextextended((select organization_id::text from public.platform_events where id=person.event_id),59));
 update public.event_members set removed_at=now() where id=p_member;
 -- Preserve assignments and names as history. Existing codes/links cannot restore a removed account.
 update public.platform_events set revision=revision+1 where id=person.event_id;
end $$;

-- Compatibility for environments that already applied the original MCT-57
-- bootstrap. Only event IDs present in the retained legacy workspace are
-- eligible; events created with event_create keep their authenticated creator.
-- No documents, historical contacts, invitations or audit entries are deleted.
do $$
declare confirmed_user uuid;
begin
 if not exists(select 1 from public.platform_workspaces where jsonb_array_length(events)>0) then
  return;
 end if;
 if (select count(*) from auth.users where lower(email)='renannascimento0304@gmail.com') <> 1
 or not exists(select 1 from auth.users where lower(email)='renannascimento0304@gmail.com' and email_confirmed_at is not null) then
  raise exception 'Migração interrompida: confirme a conta única e verificada de Renan antes de corrigir o fundador do legado.';
 end if;
 select id into confirmed_user from auth.users where lower(email)='renannascimento0304@gmail.com' and email_confirmed_at is not null;
 -- Keep current documents intact, including edits made since the bootstrap.
 update public.platform_events p set founder_id=confirmed_user
 where exists(select 1 from public.platform_workspaces w cross join lateral jsonb_array_elements(w.events) e
  where w.organization_id=p.organization_id and e->>'id'=p.id);
 update public.event_members m set role='director'
 where m.role='founder' and m.user_id<>confirmed_user
 and exists(select 1 from public.platform_events p join public.platform_workspaces w on w.organization_id=p.organization_id
  cross join lateral jsonb_array_elements(w.events) e where p.id=m.event_id and e->>'id'=p.id);
 insert into public.event_members(event_id,user_id,role)
 select p.id,confirmed_user,'founder' from public.platform_events p
 where exists(select 1 from public.platform_workspaces w cross join lateral jsonb_array_elements(w.events) e
  where w.organization_id=p.organization_id and e->>'id'=p.id)
 on conflict(event_id,user_id) do update set role='founder',removed_at=null;
end $$;

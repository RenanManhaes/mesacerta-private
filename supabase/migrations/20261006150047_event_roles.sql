-- Close legacy document and organization invitation paths; retain all original data.
revoke all on public.platform_workspaces from authenticated;
revoke execute on function public.platform_add_member(uuid,text),private.platform_add_member(uuid,text) from authenticated;
drop policy event_read on public.platform_events;
create policy event_read on public.platform_events for select to authenticated using(private.event_role(id) in ('founder','director'));
drop policy member_read on public.event_members;
create policy member_read on public.event_members for select to authenticated using(private.event_role(event_id) in ('founder','director') or user_id=(select auth.uid()));

create function private.staff_document(p_event text,p_document jsonb) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'id',p_document->'id','name',p_document->'name','date',p_document->'date','city',p_document->'city','location',p_document->'location','status',p_document->'status',
 'modules',jsonb_build_object('schedule',true),'participants',coalesce(p_document->'participants','[]'::jsonb),'schedule',coalesce(p_document->'schedule','[]'::jsonb),
 'tasks',coalesce((select jsonb_agg(t) from jsonb_array_elements(coalesce(p_document->'tasks','[]'::jsonb)) t where t->>'ownerId' in (m.id::text,m.user_id::text)),'[]'::jsonb),
 'uiState',jsonb_build_object(m.user_id::text,coalesce((select jsonb_object_agg(key,value) from jsonb_each(coalesce(p_document->'uiState'->m.user_id::text,'{}'::jsonb)) where key ~ '^(tasks|participants|schedule)\.'),'{}'::jsonb))
 ) from public.event_members m where m.event_id=p_event and m.user_id=(select auth.uid()) and m.removed_at is null;
$$;
revoke all on function private.staff_document(text,jsonb) from public,anon,authenticated;
create or replace function public.event_list() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('document',case when m.role='staff' then private.staff_document(e.id,e.document) else e.document end,'revision',e.revision,'code',e.code,'codeEnabled',e.code_enabled,'role',m.role,'organizationId',e.organization_id,'memberId',m.id) order by e.created_at,e.id),'[]'::jsonb)
 from public.platform_events e join public.event_members m on m.event_id=e.id where m.user_id=(select auth.uid()) and m.removed_at is null;
$$;
create or replace function public.event_save(p_event text,p_revision bigint,p_document jsonb) returns bigint language plpgsql security definer set search_path='' as $$
declare rev bigint; existing jsonb; selected_role text; permitted jsonb; task jsonb; original jsonb;
begin
 selected_role := private.event_role(p_event);
 if selected_role is null then raise exception using errcode='42501',message='Sem acesso ao evento'; end if;
 select document into existing from public.platform_events where id=p_event for update;
 if p_document->>'id' is distinct from p_event then raise exception 'O ID do evento não pode mudar'; end if;
 if selected_role='staff' then
  permitted := private.staff_document(p_event,existing);
  if (p_document - array['participants','schedule','tasks','uiState']) is distinct from (permitted - array['participants','schedule','tasks','uiState'])
   or jsonb_typeof(p_document->'participants') is distinct from 'array'
   or jsonb_typeof(p_document->'schedule') is distinct from 'array'
   or jsonb_typeof(p_document->'tasks') is distinct from 'array'
   or jsonb_typeof(p_document->'uiState') is distinct from 'object'
   or exists(select 1 from jsonb_object_keys(p_document->'uiState') k where k <> auth.uid()::text)
   or exists(select 1 from jsonb_each(coalesce(p_document->'uiState'->auth.uid()::text,'{}'::jsonb)) where key !~ '^(tasks|participants|schedule)\.') then
   raise exception using errcode='42501',message='Staff só pode acessar participantes, programação e suas tarefas';
  end if;
  if jsonb_array_length(p_document->'tasks') <> jsonb_array_length(permitted->'tasks') then raise exception using errcode='42501',message='Staff não pode criar ou remover tarefas'; end if;
  for task in select value from jsonb_array_elements(p_document->'tasks') loop
   select value into original from jsonb_array_elements(permitted->'tasks') where value->>'id'=task->>'id';
   if original is null or (task - 'status') is distinct from (original - 'status') or task->>'status' not in ('A fazer','Em andamento','Concluído') then raise exception using errcode='42501',message='Staff só pode mudar o status de tarefas atribuídas'; end if;
  end loop;
  if (select count(distinct t->>'id') from jsonb_array_elements(p_document->'tasks') t) <> jsonb_array_length(p_document->'tasks') then raise exception using errcode='42501',message='IDs de tarefas repetidos'; end if;
  p_document := existing || jsonb_build_object('participants',p_document->'participants','schedule',p_document->'schedule',
   'tasks',(select coalesce(jsonb_agg(coalesce((select t from jsonb_array_elements(p_document->'tasks') t where t->>'id'=oldtask->>'id'),oldtask)),'[]'::jsonb) from jsonb_array_elements(coalesce(existing->'tasks','[]'::jsonb)) oldtask),
   'uiState',coalesce(existing->'uiState','{}'::jsonb) || p_document->'uiState');
 end if;
 update public.platform_events set document=p_document,revision=revision+1 where id=p_event and revision=p_revision returning revision into rev;
 if rev is null then raise exception using errcode='40001',message='Outra pessoa atualizou o evento. Exporte suas alterações antes de recarregar.'; end if;
 return rev;
end $$;
create function public.event_change_role(p_member uuid,p_role text) returns void language plpgsql security definer set search_path='' as $$
declare target public.event_members;
begin
 select * into target from public.event_members where id=p_member and removed_at is null;
 if target.id is null or private.event_role(target.event_id) is distinct from 'founder' then raise exception using errcode='42501',message='Somente o fundador pode mudar papéis'; end if;
 if target.role='founder' or p_role not in ('staff','director') or p_role is null then raise exception using errcode='42501',message='O fundador não pode ser alterado'; end if;
 update public.event_members set role=p_role where id=p_member;
end $$;
create function public.event_team(p_event text) returns table(id uuid,user_id uuid,role text,name text,email text) language sql stable security definer set search_path='' as $$
 select m.id,m.user_id,m.role,coalesce(u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1)),u.email::text
 from public.event_members m join auth.users u on u.id=m.user_id where m.event_id=p_event and m.removed_at is null and private.event_role(p_event) in ('founder','director');
$$;
revoke all on function public.event_change_role(uuid,text),public.event_team(text) from public,anon;
grant execute on function public.event_change_role(uuid,text),public.event_team(text) to authenticated;

-- Every normalized event-domain table uses the event role too. Organization membership
-- never substitutes for an event role. Tasks gain a trusted account assignment field.
alter table public.tasks add column assigned_user_id uuid references auth.users(id);
create index tasks_assigned_user on public.tasks(assigned_user_id,event_id);
do $$ declare item record; policy record; condition text;
begin
 for item in select table_name from information_schema.columns where table_schema='public' and column_name='event_id' and table_name not in ('event_members','event_invitations','event_join_log','notification_reads') loop
  for policy in select policyname from pg_policies where schemaname='public' and tablename=item.table_name loop
   execute format('drop policy %I on public.%I',policy.policyname,item.table_name);
  end loop;
  condition := 'private.event_role(event_id::text) in (''founder'',''director'')';
  if item.table_name in ('participants','schedule_items') then condition := 'private.event_role(event_id::text) is not null'; end if;
  if item.table_name='tasks' then condition := condition || ' or (private.event_role(event_id::text)=''staff'' and assigned_user_id=(select auth.uid()))'; end if;
  execute format('create policy event_access on public.%I for all to authenticated using (%s) with check (%s)',item.table_name,condition,condition);
 end loop;
 for policy in select policyname from pg_policies where schemaname='public' and tablename='events' loop execute format('drop policy %I on public.events',policy.policyname); end loop;
end $$;
create policy event_select on public.events for select to authenticated using(private.event_role(id::text) is not null);
create policy event_update on public.events for update to authenticated using(private.event_role(id::text) in ('founder','director')) with check(private.event_role(id::text) in ('founder','director'));
create policy event_delete on public.events for delete to authenticated using(private.event_role(id::text)='founder');
-- No INSERT policy: creation is exclusively the authenticated event_create transaction.

drop policy notification_reads_select on public.notification_reads;
drop policy notification_reads_insert on public.notification_reads;
drop policy notification_reads_update on public.notification_reads;
create policy notification_read on public.notification_reads for select to authenticated using(user_id=(select auth.uid()) and private.event_role(event_id) is not null);
create policy notification_insert on public.notification_reads for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.platform_events e where e.id=event_id and e.organization_id=notification_reads.organization_id and private.event_role(e.id) is not null));
-- Staff does not read full platform_events: use a narrow definer lookup for notification tenancy.
create function private.event_org(p_event text) returns uuid language sql stable security definer set search_path='' as $$ select organization_id from public.platform_events where id=p_event and private.event_role(id) is not null; $$;
revoke all on function private.event_org(text) from public,anon;
grant execute on function private.event_org(text) to authenticated;
drop policy notification_insert on public.notification_reads;
create policy notification_insert on public.notification_reads for insert to authenticated with check(user_id=(select auth.uid()) and organization_id=private.event_org(event_id));
create policy notification_update on public.notification_reads for update to authenticated using(user_id=(select auth.uid()) and private.event_role(event_id) is not null) with check(user_id=(select auth.uid()) and organization_id=private.event_org(event_id));
-- Existing MCT-63 UI remains: catalog read by event teammates, writes by directors/founders.
create function private.event_org_role(p_org uuid,p_manage boolean) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_events e join public.event_members m on m.event_id=e.id where e.organization_id=p_org and m.user_id=(select auth.uid()) and m.removed_at is null and (not p_manage or m.role in ('founder','director')));
$$;
revoke all on function private.event_org_role(uuid,boolean) from public,anon;
grant execute on function private.event_org_role(uuid,boolean) to authenticated;
drop policy activity_types_select on public.activity_types;
drop policy activity_types_insert on public.activity_types;
drop policy activity_types_update on public.activity_types;
drop policy activity_types_delete on public.activity_types;
create policy activity_read on public.activity_types for select to authenticated using(private.event_org_role(organization_id,false));
create policy activity_create on public.activity_types for insert to authenticated with check(private.event_org_role(organization_id,true));
create policy activity_update on public.activity_types for update to authenticated using(private.event_org_role(organization_id,true)) with check(private.event_org_role(organization_id,true));
create policy activity_delete on public.activity_types for delete to authenticated using(private.event_org_role(organization_id,true));

-- Normalized metadata also contains capacity; staff must use the narrow projection.
drop policy event_select on public.events;
create policy event_select on public.events for select to authenticated using(private.event_role(id::text) in ('founder','director'));
-- The FK-filling trigger can resolve the parent without revealing its fields to staff.
alter function public.set_organization_id_from_event() security definer;
alter function public.set_organization_id_from_event() set search_path='';
create or replace function public.set_organization_id_from_event() returns trigger language plpgsql security definer set search_path='' as $$
declare org uuid; begin select organization_id into org from public.events where id=new.event_id; if org is null then raise exception 'Event not found'; end if; new.organization_id:=org; return new; end $$;
revoke all on function public.set_organization_id_from_event() from public,anon,authenticated;
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
   if original is null or (task - 'status') is distinct from (original - 'status') or task->>'status' is null or task->>'status' not in ('A fazer','Em andamento','Concluído') then raise exception using errcode='42501',message='Staff só pode mudar o status de tarefas atribuídas'; end if;
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

-- MCT-86: uma tarefa pode ter vários responsáveis (document.tasks[].ownerIds, IDs de vínculo).
-- O staff continua vendo só as tarefas atribuídas a ele: agora também quando ele é um dos
-- responsáveis em ownerIds. Só esta projeção muda; event_save e as regras de escrita do staff
-- (apenas status) seguem como estão e continuam valendo para todos os campos novos.
create or replace function private.staff_document(p_event text,p_document jsonb) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'id',p_document->'id','name',p_document->'name','date',p_document->'date','city',p_document->'city','location',p_document->'location','status',p_document->'status',
 'modules',jsonb_build_object('schedule',true),'participants',coalesce(p_document->'participants','[]'::jsonb),'schedule',coalesce(p_document->'schedule','[]'::jsonb),
 'tasks',coalesce((select jsonb_agg(t) from jsonb_array_elements(coalesce(p_document->'tasks','[]'::jsonb)) t where t->>'ownerId' in (m.id::text,m.user_id::text)
   or (jsonb_typeof(t->'ownerIds')='array' and t->'ownerIds' ?| array[m.id::text,m.user_id::text])),'[]'::jsonb),
 'uiState',jsonb_build_object(m.user_id::text,coalesce((select jsonb_object_agg(key,value) from jsonb_each(coalesce(p_document->'uiState'->m.user_id::text,'{}'::jsonb)) where key ~ '^(tasks|participants|schedule)\.'),'{}'::jsonb))
 ) from public.event_members m where m.event_id=p_event and m.user_id=(select auth.uid()) and m.removed_at is null;
$$;
revoke all on function private.staff_document(text,jsonb) from public,anon,authenticated;

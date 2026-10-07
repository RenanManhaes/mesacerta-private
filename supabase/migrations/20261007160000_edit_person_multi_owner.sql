-- MCT-86: renomear um membro não pode apagar os outros responsáveis do texto "owner" das tarefas.
-- Antes: só casava tarefas por ownerId e sobrescrevia "owner" inteiro com o novo nome. Numa tarefa com
-- [João, Marina], renomear o João deixava "owner" = "João P." e a Marina sumia do texto (que é o que o
-- staff vê, pois a projeção dele não traz a equipe).
-- Agora: para cada tarefa em que o membro é responsável (ownerIds, ou ownerId legado), "owner" é recomposto
-- a partir dos nomes atuais de TODOS os responsáveis, na ordem de ownerIds. O nome vem da mesma regra de
-- private.event_team_document (display_name, senão nome do cadastro, senão a parte local do e-mail).
-- Só o corpo da função muda; assinatura, permissões e o restante da edição são os mesmos.
create or replace function private.event_edit_person(p_member uuid, p_name text, p_email text, p_phone text, p_function text, p_area text default ''::text, p_job_title text default ''::text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare person public.event_members;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) not in ('founder','director') or private.event_role(person.event_id) is null then raise exception using errcode='42501',message='Sem permissão para editar a equipe'; end if;
 if nullif(trim(p_name),'') is null then raise exception 'Informe o nome da pessoa'; end if;
 update public.event_members set display_name=trim(p_name),contact_email=trim(p_email),phone=trim(p_phone),function=trim(p_function),area=trim(p_area),job_title=case when role='founder' then 'Fundador' else trim(p_job_title) end where id=p_member;
 update public.platform_events e set revision=e.revision+1,document=e.document || jsonb_build_object('tasks',(
  select coalesce(jsonb_agg(
   case when o.ids ?| array[person.id::text,person.user_id::text]
    then t.task || jsonb_build_object('owner',coalesce((
     select nullif(string_agg(n.name,', ' order by x.ord),'')
     from jsonb_array_elements_text(o.ids) with ordinality x(id,ord)
     join lateral (select coalesce(m.display_name,u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1)) as name
                   from public.event_members m join auth.users u on u.id=m.user_id
                   where m.event_id=person.event_id and x.id in (m.id::text,m.user_id::text) limit 1) n on true),trim(p_name)))
    else t.task end order by t.pos),'[]'::jsonb)
  from jsonb_array_elements(coalesce(e.document->'tasks','[]'::jsonb)) with ordinality t(task,pos)
  cross join lateral (select case
    when jsonb_typeof(t.task->'ownerIds')='array' and jsonb_array_length(t.task->'ownerIds')>0 then t.task->'ownerIds'
    when nullif(t.task->>'ownerId','') is not null then jsonb_build_array(t.task->>'ownerId')
    else '[]'::jsonb end as ids) o
 )) where e.id=person.event_id;
end $function$;

-- Cargo definido no card de qualquer pessoa da equipe, inclusive o fundador.
-- Antes: o cargo do fundador era sempre "Fundador" (event_team, event_team_document, catalog_usage e as duas
-- event_edit_person o forçavam). Agora o fundador e o diretor definem o cargo de qualquer membro, inclusive
-- o do fundador. Se o cargo do fundador estiver vazio, continua aparecendo "Fundador" (valor padrão).
-- Cargo é só um rótulo: nenhuma destas funções mexe em event_members.role (papel de acesso).
-- Quem pode editar continua igual: só fundador e diretor; staff segue negado (42501).

create or replace function public.event_team(p_event text) returns table(id uuid, user_id uuid, role text, name text, email text, phone text, function text, area text, job_title text)
 language sql stable security definer set search_path to ''
as $function$
 select m.id,m.user_id,m.role,coalesce(m.display_name,u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1)),coalesce(m.contact_email,u.email)::text,m.phone,m.function,m.area,case when m.role='founder' then coalesce(nullif(m.job_title,''),'Fundador') else m.job_title end
 from public.event_members m join auth.users u on u.id=m.user_id where m.event_id=p_event and m.removed_at is null and private.event_role(p_event) in ('founder','director');
$function$;

create or replace function private.event_team_document(p_event text) returns jsonb
 language sql stable security definer set search_path to ''
as $function$
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'userId',m.user_id,'name',coalesce(m.display_name,u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1)),
 'email',coalesce(m.contact_email,u.email),'phone',m.phone,'function',m.function,'area',m.area,'jobTitle',case when m.role='founder' then coalesce(nullif(m.job_title,''),'Fundador') else m.job_title end,
 'accessRole',m.role,'role',case when m.role='staff' then 'Staff' else 'Diretor' end,'active',true,'inviteStatus','accepted') order by m.joined_at,m.id),'[]'::jsonb)
 from public.event_members m join auth.users u on u.id=m.user_id where m.event_id=p_event and m.removed_at is null;
$function$;

create or replace function private.catalog_usage(p_catalog uuid) returns bigint
 language sql stable security definer set search_path to ''
as $function$
 select count(distinct m.user_id) from public.team_catalog c join public.platform_events e on e.organization_id=c.organization_id join public.event_members m on m.event_id=e.id and m.removed_at is null
 where c.id=p_catalog and lower(case c.kind when 'function' then m.function when 'area' then m.area else case when m.role='founder' then coalesce(nullif(m.job_title,''),'Fundador') else m.job_title end end)=lower(c.name);
$function$;

-- Validação do catálogo: o cargo do fundador passa a ser tratado como o de qualquer pessoa.
create or replace function public.event_edit_person(p_member uuid, p_name text, p_email text, p_phone text, p_function text, p_area text default ''::text, p_job_title text default ''::text) returns void
 language plpgsql security definer set search_path to ''
as $function$
declare person public.event_members; org uuid; item record;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) not in ('founder','director') or private.event_role(person.event_id) is null then raise exception using errcode='42501',message='Sem permissão para editar a equipe'; end if;
 select organization_id into org from public.platform_events where id=person.event_id;
 perform pg_advisory_xact_lock(hashtextextended(org::text,59));
 for item in select * from (values ('function',p_function),('area',p_area),('title',p_job_title)) as values(kind,name) loop
  if nullif(trim(item.name),'') is not null and lower(trim(item.name)) is distinct from lower(case item.kind when 'function' then person.function when 'area' then person.area else case when person.role='founder' then coalesce(nullif(person.job_title,''),'Fundador') else person.job_title end end) and not exists(select 1 from public.team_catalog c where c.organization_id=org and c.kind=item.kind and lower(c.name)=lower(trim(item.name)) and c.archived_at is null) then raise exception 'Confirme a criação do novo valor no catálogo antes de salvar'; end if;
 end loop;
 perform private.event_edit_person(p_member,p_name,p_email,p_phone,p_function,p_area,p_job_title);
end $function$;

-- Gravação: o cargo é gravado como veio, também para o fundador. O papel de acesso (role) não é tocado.
-- O resto do corpo é idêntico ao de 20261007160000 (MCT-86, responsáveis múltiplos das tarefas).
create or replace function private.event_edit_person(p_member uuid, p_name text, p_email text, p_phone text, p_function text, p_area text default ''::text, p_job_title text default ''::text) returns void
 language plpgsql security definer set search_path to ''
as $function$
declare person public.event_members;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) not in ('founder','director') or private.event_role(person.event_id) is null then raise exception using errcode='42501',message='Sem permissão para editar a equipe'; end if;
 if nullif(trim(p_name),'') is null then raise exception 'Informe o nome da pessoa'; end if;
 update public.event_members set display_name=trim(p_name),contact_email=trim(p_email),phone=trim(p_phone),function=trim(p_function),area=trim(p_area),job_title=trim(p_job_title) where id=p_member;
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

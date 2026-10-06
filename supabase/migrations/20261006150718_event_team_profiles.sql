alter table public.event_members add column display_name text;
alter table public.event_members add column contact_email text;
alter table public.event_members add column phone text not null default '';
alter table public.event_members add column function text not null default '';
alter table public.event_members add column area text not null default '';
alter table public.event_members add column job_title text not null default '';
-- Preserve the former manual team list; it is not evidence of an Auth account.
update public.platform_events set document=document || jsonb_build_object('legacyStaffMembers',document->'staffMembers')
where jsonb_array_length(coalesce(document->'staffMembers','[]'::jsonb))>0 and not(document ? 'legacyStaffMembers');
drop function public.event_team(text);
create function public.event_team(p_event text) returns table(id uuid,user_id uuid,role text,name text,email text,phone text,function text,area text,job_title text)
language sql stable security definer set search_path='' as $$
 select m.id,m.user_id,m.role,coalesce(m.display_name,u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1)),coalesce(m.contact_email,u.email)::text,m.phone,m.function,m.area,case when m.role='founder' then 'Fundador' else m.job_title end
 from public.event_members m join auth.users u on u.id=m.user_id where m.event_id=p_event and m.removed_at is null and private.event_role(p_event) in ('founder','director');
$$;
revoke all on function public.event_team(text) from public,anon;
grant execute on function public.event_team(text) to authenticated;
create function private.event_team_document(p_event text) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'userId',m.user_id,'name',coalesce(m.display_name,u.raw_user_meta_data->>'full_name',split_part(u.email,'@',1)),
 'email',coalesce(m.contact_email,u.email),'phone',m.phone,'function',m.function,'area',m.area,'jobTitle',case when m.role='founder' then 'Fundador' else m.job_title end,
 'accessRole',m.role,'role',case when m.role='staff' then 'Staff' else 'Diretor' end,'active',true,'inviteStatus','accepted') order by m.joined_at,m.id),'[]'::jsonb)
 from public.event_members m join auth.users u on u.id=m.user_id where m.event_id=p_event and m.removed_at is null;
$$;
revoke all on function private.event_team_document(text) from public,anon,authenticated;
create or replace function public.event_list() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('document',case when m.role='staff' then private.staff_document(e.id,e.document) else e.document || jsonb_build_object('staffMembers',private.event_team_document(e.id)) end,
 'revision',e.revision,'code',e.code,'codeEnabled',e.code_enabled,'role',m.role,'organizationId',e.organization_id,'memberId',m.id) order by e.created_at,e.id),'[]'::jsonb)
 from public.platform_events e join public.event_members m on m.event_id=e.id where m.user_id=(select auth.uid()) and m.removed_at is null;
$$;
create function public.event_edit_person(p_member uuid,p_name text,p_email text,p_phone text,p_function text,p_area text default '',p_job_title text default '') returns void language plpgsql security definer set search_path='' as $$
declare person public.event_members;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) not in ('founder','director') or private.event_role(person.event_id) is null then raise exception using errcode='42501',message='Sem permissão para editar a equipe'; end if;
 if nullif(trim(p_name),'') is null then raise exception 'Informe o nome da pessoa'; end if;
 update public.event_members set display_name=trim(p_name),contact_email=trim(p_email),phone=trim(p_phone),function=trim(p_function),area=trim(p_area),job_title=case when role='founder' then 'Fundador' else trim(p_job_title) end where id=p_member;
 update public.platform_events set revision=revision+1,document=document || jsonb_build_object('tasks',(select coalesce(jsonb_agg(case when task->>'ownerId' in(person.id::text,person.user_id::text) then task || jsonb_build_object('owner',trim(p_name)) else task end),'[]'::jsonb) from jsonb_array_elements(coalesce(document->'tasks','[]'::jsonb)) task)) where id=person.event_id;
end $$;
create function public.event_remove_person(p_member uuid) returns void language plpgsql security definer set search_path='' as $$
declare person public.event_members;
begin
 select * into person from public.event_members where id=p_member and removed_at is null;
 if person.id is null or private.event_role(person.event_id) is distinct from 'founder' or person.role='founder' then raise exception using errcode='42501',message='Somente o fundador remove pessoas; o fundador não pode ser removido'; end if;
 update public.event_members set removed_at=now() where id=p_member;
 -- Preserve assignments and names as history. Existing codes/links cannot restore a removed account.
 update public.platform_events set revision=revision+1 where id=person.event_id;
end $$;
revoke all on function public.event_edit_person(uuid,text,text,text,text,text,text),public.event_remove_person(uuid) from public,anon;
grant execute on function public.event_edit_person(uuid,text,text,text,text,text,text),public.event_remove_person(uuid) to authenticated;

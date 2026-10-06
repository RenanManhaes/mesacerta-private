create or replace function public.event_create(p_org uuid,p_document jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.platform_events; doc jsonb;
begin
 if auth.uid() is null or not public.is_org_member(p_org) then raise exception using errcode='42501',message='Sem acesso à organização'; end if;
 if jsonb_typeof(p_document) <> 'object' or nullif(trim(p_document->>'name'),'') is null then raise exception 'Informe o nome do evento'; end if;
 doc := p_document || jsonb_build_object('id',coalesce(nullif(p_document->>'id',''),gen_random_uuid()::text));
 insert into public.platform_events(id,organization_id,founder_id,document) values(doc->>'id',p_org,auth.uid(),doc) returning * into ev;
 insert into public.event_members(event_id,user_id,role) values(ev.id,auth.uid(),'founder');
 return jsonb_build_object('document',ev.document || jsonb_build_object('staffMembers',private.event_team_document(ev.id)),'revision',ev.revision,'code',ev.code,'codeEnabled',true,'role','founder','organizationId',p_org);
end $$;

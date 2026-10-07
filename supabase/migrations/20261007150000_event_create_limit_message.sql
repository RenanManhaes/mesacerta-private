-- MCT-78 (complemento): mensagem clara quando a conta atinge o limite de eventos.
--
-- O texto antigo ("Sua conta pode manter até 1 eventos. Solicite a liberação...")
-- ficava errado no singular e era técnico. Esta migração recria public.event_create
-- a partir da definição atual do banco e muda SOMENTE o texto da mensagem, gerado
-- a partir de public.event_limit() com singular/plural corretos. A regra conta eventos
-- arquivados (arquivar não libera vaga, PRD §56), por isso o texto não diz "ativo". SQLSTATE (42501),
-- lógica, trava transacional, exceção master e permissões continuam iguais;
-- CREATE OR REPLACE preserva os GRANTs existentes.
CREATE OR REPLACE FUNCTION public.event_create(p_org uuid, p_document jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare ev public.platform_events; doc jsonb; limite integer := public.event_limit();
begin
 if auth.uid() is null or not private.is_org_member(p_org) then raise exception using errcode='42501',message='Sem acesso à organização'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,46));
 if not coalesce((select multi_event from public.user_event_permissions where user_id=(select auth.uid())),false)
  and (select count(*) from public.event_members where user_id=(select auth.uid()) and removed_at is null and role='founder') >= limite then
  raise exception using errcode='42501',message=format('Sua conta permite %s evento%s. Eventos arquivados também contam. Para criar outro, fale com a gente.',limite,case when limite=1 then '' else 's' end);
 end if;
 if jsonb_typeof(p_document) <> 'object' or nullif(trim(p_document->>'name'),'') is null then raise exception 'Informe o nome do evento'; end if;
 doc := p_document || jsonb_build_object('id',coalesce(nullif(p_document->>'id',''),gen_random_uuid()::text));
 insert into public.platform_events(id,organization_id,founder_id,document) values(doc->>'id',p_org,auth.uid(),doc) returning * into ev;
 insert into public.event_members(event_id,user_id,role) values(ev.id,auth.uid(),'founder');
 return jsonb_build_object('document',ev.document || jsonb_build_object('staffMembers',private.event_team_document(ev.id)),'revision',ev.revision,'code',ev.code,'codeEnabled',true,'role','founder','organizationId',p_org,'creationPermission',public.event_creation_permission());
end $function$;

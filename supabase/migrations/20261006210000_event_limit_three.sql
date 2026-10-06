-- Decisao do produto (06/10/2026, Renan): a conta master cria eventos sem
-- limite; as demais contas podem manter ate 3 eventos, como a pagina de precos
-- anuncia ("Ate 3 eventos ativos"). A migracao anterior permitia apenas 1, o
-- que contradizia a oferta ja publicada.
--
-- user_event_permissions.multi_event passa a significar "usuario master".
comment on table public.user_event_permissions is 'Permissao de criacao de eventos por conta. multi_event = usuario master, sem limite.';
comment on column public.user_event_permissions.multi_event is 'Usuario master: cria eventos sem limite. Demais contas: limite de public.event_limit().';

create function public.event_limit() returns integer language sql immutable set search_path='' as $$ select 3 $$;
revoke all on function public.event_limit() from public,anon;
grant execute on function public.event_limit() to authenticated;

-- O limite conta os eventos que a pessoa FUNDOU, nao os que ela participa.
-- Entrar como diretor ou staff no evento de outra pessoa nao consome a cota:
-- caso contrario, colaborar em tres eventos impediria a conta de criar o seu.
create or replace function public.event_creation_permission() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare master boolean; founded bigint; limite integer := public.event_limit();
begin
 if auth.uid() is null then raise exception using errcode='42501',message='Entre na sua conta'; end if;
 select multi_event into master from public.user_event_permissions where user_id=auth.uid();
 select count(*) into founded from public.event_members
  where user_id=(select auth.uid()) and removed_at is null and role='founder';
 return jsonb_build_object('multiEvent',coalesce(master,false),'eventCount',founded,'eventLimit',limite,
  'canCreate',coalesce(master,false) or founded < limite);
end $$;

create or replace function public.event_create(p_org uuid,p_document jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.platform_events; doc jsonb; limite integer := public.event_limit();
begin
 if auth.uid() is null or not public.is_org_member(p_org) then raise exception using errcode='42501',message='Sem acesso à organização'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,46));
 if not coalesce((select multi_event from public.user_event_permissions where user_id=(select auth.uid())),false)
  and (select count(*) from public.event_members where user_id=(select auth.uid()) and removed_at is null and role='founder') >= limite then
  raise exception using errcode='42501',message=format('Sua conta pode manter até %s eventos. Solicite a liberação para criar mais.',limite);
 end if;
 if jsonb_typeof(p_document) <> 'object' or nullif(trim(p_document->>'name'),'') is null then raise exception 'Informe o nome do evento'; end if;
 doc := p_document || jsonb_build_object('id',coalesce(nullif(p_document->>'id',''),gen_random_uuid()::text));
 insert into public.platform_events(id,organization_id,founder_id,document) values(doc->>'id',p_org,auth.uid(),doc) returning * into ev;
 insert into public.event_members(event_id,user_id,role) values(ev.id,auth.uid(),'founder');
 return jsonb_build_object('document',ev.document || jsonb_build_object('staffMembers',private.event_team_document(ev.id)),'revision',ev.revision,'code',ev.code,'codeEnabled',true,'role','founder','organizationId',p_org,'creationPermission',public.event_creation_permission());
end $$;

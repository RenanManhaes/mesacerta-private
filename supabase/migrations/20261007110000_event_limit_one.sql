-- MCT-78 (07/10/2026, Renan): conta comum mantem 1 evento ativo. Substitui o
-- limite 3 da MCT-46 (migracao 20261006210000_event_limit_three).
--
-- Muda SOMENTE o valor de public.event_limit(). event_creation_permission() e
-- event_create() ja leem o limite dessa funcao, entao continuam valendo:
--  * a excecao master (user_event_permissions.multi_event) segue sem limite;
--  * a trava transacional por usuario (pg_advisory_xact_lock) segue impedindo
--    dois pedidos simultaneos, mesmo em organizacoes diferentes;
--  * o limite conta os eventos que a pessoa FUNDOU (role = 'founder').
-- Nenhum evento existente e apagado, arquivado ou alterado: contas que ja tem
-- mais de 1 evento mantem todos e apenas nao conseguem criar novos.
create or replace function public.event_limit() returns integer language sql immutable set search_path='' as $$ select 1 $$;
revoke all on function public.event_limit() from public,anon;
grant execute on function public.event_limit() to authenticated;
comment on column public.user_event_permissions.multi_event is 'Usuario master: cria eventos sem limite. Demais contas: limite de public.event_limit() (1 evento, MCT-78).';

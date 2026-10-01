-- Mesa Certa — 0005: correções apontadas pelo get_advisors depois da 0001-0004
--
-- Segurança:
-- 1. set_updated_at() e set_organization_id_from_event() são plpgsql sem
--    search_path fixo (function_search_path_mutable) — um search_path
--    mutável em função SECURITY DEFINER/trigger é vetor de sequestro de
--    nome de objeto. Fixamos search_path = public, pg_temp.
-- 2. is_org_member()/is_org_admin() são SECURITY DEFINER e estavam
--    executáveis via RPC por anon e authenticated. O uso delas é só dentro
--    de policies RLS (todas "to authenticated"); não precisam ser chamáveis
--    diretamente pela API. Revogamos EXECUTE de public/anon e deixamos só
--    authenticated (as policies ainda funcionam: quem dispara a policy é a
--    role authenticated) e service_role.
--
-- Performance:
-- 3. locations ficou sem índice em event_id (esquecido na migration 0003) —
--    adicionado aqui.
-- 4. organization_id não estava indexado em nenhuma tabela filha de evento.
--    Como toda policy RLS filtra por organization_id, isso é o índice mais
--    usado do schema inteiro assim que houver dado — adicionado em todas.
-- 5. FKs sem índice de cobertura apontadas pelo advisor: hosts.participant_id,
--    assignments.host_id, assignments.seat_id, payments.expense_id/
--    revenue_id/supplier_id/sponsor_id.
--
-- "unused_index" (INFO) não é tratado aqui: o banco está vazio (0 linhas em
-- todas as tabelas, ver list_tables), não existe estatística de uso ainda.
-- Avaliar depois de dado real nos ambientes; não remover índice recém-criado
-- por estar "sem uso" num banco sem carga.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.set_organization_id_from_event() set search_path = public, pg_temp;

revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.is_org_admin(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid) to authenticated, service_role;

create index idx_locations_event_id on public.locations(event_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'locations', 'participants', 'tasks', 'schedule_items', 'suppliers',
    'expenses', 'revenues', 'tickets', 'ticket_lots', 'sponsor_plans',
    'sponsors', 'payments', 'simulations',
    'networking_tables', 'seats', 'hosts', 'distribution_versions', 'rounds', 'assignments'
  ]
  loop
    execute format('create index idx_%I_organization_id on public.%I(organization_id);', t, t);
  end loop;
end $$;

create index idx_hosts_participant_id on public.hosts(participant_id);
create index idx_assignments_host_id on public.assignments(host_id);
create index idx_assignments_seat_id on public.assignments(seat_id);
create index idx_payments_expense_id on public.payments(expense_id);
create index idx_payments_revenue_id on public.payments(revenue_id);
create index idx_payments_supplier_id on public.payments(supplier_id);
create index idx_payments_sponsor_id on public.payments(sponsor_id);

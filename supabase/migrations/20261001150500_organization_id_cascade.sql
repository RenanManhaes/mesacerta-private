-- Mesa Certa — 0006: corrige cascata em organization_id
--
-- Achado durante a prova de isolamento RLS (não veio do get_advisors, veio
-- de tentar limpar o dado de teste): organization_id é FK sem ON DELETE
-- CASCADE em toda tabela filha, enquanto event_id tem cascade. Isso cria um
-- hazard de ordem de deleção — apagar uma organização falha com violação de
-- FK a menos que o caller apague events primeiro na mesma transação, mesmo
-- a cascata de events→participants (via event_id) já resolvendo o mesmo
-- dado por outro caminho.
--
-- Reproduzido: `delete from organizations where id = X` falhou com
-- `participants_organization_id_fkey` ainda referenciando a organização,
-- apesar de events (que cascateia para participants via event_id) também
-- pertencer a ela.
--
-- Fix: organization_id passa a ser ON DELETE CASCADE em todas as tabelas
-- filhas, igual event_id. "Apagar uma organização apaga tudo dela" (mesma
-- decisão já registrada para events na migration 0003) agora vale também
-- quando a organização é apagada diretamente, não só através do evento.

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
    execute format('alter table public.%I drop constraint %I_organization_id_fkey;', t, t);
    execute format(
      'alter table public.%I add constraint %I_organization_id_fkey foreign key (organization_id) references public.organizations(id) on delete cascade;',
      t, t
    );
  end loop;
end $$;

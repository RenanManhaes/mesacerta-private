-- Mesa Certa — 0003: entidades de domínio do evento (PRD §47, exceto Networking)
--
-- Todas as tabelas aqui são filhas de events: carregam event_id (FK) e
-- organization_id (denormalizado, preenchido/validado por trigger a partir
-- de event_id — ver set_organization_id_from_event() na migration 0002).
-- RLS em todas, usando is_org_member(organization_id).
--
-- Padrão de cascata: on delete cascade a partir de events e das entidades
-- pai imediatas (ex.: ticket_lots -> tickets, sponsors -> sponsor_plans).
-- Decisão: apagar um evento apaga tudo dele. É o comportamento esperado para
-- um tenant apagar seu próprio dado; não há retenção/soft-delete neste
-- escopo (MCT-3/MCT-4 não pediram soft-delete; fica registrado como corte).

-- ---------------------------------------------------------------------------
-- Locations (§5, usada por Capacidade §21)
-- ---------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  nome text not null,
  endereco text,
  capacidade integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Participants (§20) — inclui empresa, descricao_empresa, segmento: sem eles
-- o módulo de diversidade de encontros do Networking não tem entrada (ver
-- briefing.md — inferir segmento só pelo nome da empresa deu 0% de acerto em
-- nomes opacos, 100% com uma linha de descrição).
-- ---------------------------------------------------------------------------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  nome text not null,
  telefone text,
  email text,
  empresa text,
  descricao_empresa text, -- texto livre de uma linha; entrada do módulo de diversidade
  segmento text,
  cargo text,
  tipo text not null default 'participante' check (tipo in (
    'participante', 'convidado', 'vip', 'palestrante', 'patrocinador', 'expositor', 'equipe', 'outro'
  )),
  status text not null default 'pendente' check (status in (
    'confirmado', 'pendente', 'cancelado', 'checkin'
  )),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_participants_event_id on public.participants(event_id);

-- ---------------------------------------------------------------------------
-- Tasks (§23)
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  titulo text not null,
  responsavel text,
  prazo date,
  categoria text,
  prioridade text not null default 'normal' check (prioridade in ('normal', 'alta', 'critica')),
  status text not null default 'a_fazer' check (status in ('a_fazer', 'em_andamento', 'concluida')),
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_event_id on public.tasks(event_id);

-- ---------------------------------------------------------------------------
-- ScheduleItems (§22) — programação em formato de timeline
-- ---------------------------------------------------------------------------
create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  titulo text not null,
  descricao text,
  hora_inicio timestamptz,
  duracao_min integer not null default 0 check (duracao_min >= 0),
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_schedule_items_event_id on public.schedule_items(event_id);

-- ---------------------------------------------------------------------------
-- Suppliers (§19)
-- ---------------------------------------------------------------------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  nome text not null,
  contato text,
  categoria text,
  servico text,
  contrato text,
  valor_entrada numeric(14,2),
  valor_pago numeric(14,2) not null default 0,
  proximo_vencimento date,
  dados_pagamento jsonb,
  observacoes text,
  status text not null default 'pendente' check (status in ('pendente', 'contratado', 'pago', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_suppliers_event_id on public.suppliers(event_id);

-- ---------------------------------------------------------------------------
-- Expenses (§14) — tipo_custo governa o recálculo quando o público muda.
-- ---------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  supplier_id uuid references public.suppliers(id) on delete set null,
  descricao text not null,
  categoria text,
  tipo_custo text not null default 'fixo' check (tipo_custo in ('fixo', 'por_participante', 'percentual')),
  quantidade numeric(14,2),
  valor_unitario numeric(14,2),
  percentual numeric(5,2), -- usado quando tipo_custo = 'percentual' (pontos percentuais, ex. 4.00 = 4%)
  valor_previsto numeric(14,2) not null default 0,
  valor_real numeric(14,2) not null default 0,
  vencimento date,
  status text not null default 'previsto' check (status in ('previsto', 'a_pagar', 'pago', 'vencido', 'cancelado')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_percentual_requires_tipo check (
    (tipo_custo = 'percentual' and percentual is not null) or (tipo_custo <> 'percentual')
  )
);

create index idx_expenses_event_id on public.expenses(event_id);
create index idx_expenses_supplier_id on public.expenses(supplier_id);

-- ---------------------------------------------------------------------------
-- Revenues (§15)
-- ---------------------------------------------------------------------------
create table public.revenues (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  descricao text not null,
  categoria text,
  previsto numeric(14,2) not null default 0,
  recebido numeric(14,2) not null default 0,
  data_prevista date,
  data_recebida date,
  status text not null default 'previsto' check (status in ('previsto', 'a_receber', 'recebido', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_revenues_event_id on public.revenues(event_id);

-- ---------------------------------------------------------------------------
-- Tickets + TicketLots (§17) — tipos são configuráveis pelo usuário, por isso
-- "nome" é text livre, não enum.
-- ---------------------------------------------------------------------------
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  nome text not null,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_event_id on public.tickets(event_id);

create table public.ticket_lots (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  nome text not null,
  preco numeric(14,2) not null default 0,
  inicio timestamptz,
  fim timestamptz,
  quantidade integer not null default 0 check (quantidade >= 0),
  taxa numeric(14,2) not null default 0,
  desconto numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ticket_lots_event_id on public.ticket_lots(event_id);
create index idx_ticket_lots_ticket_id on public.ticket_lots(ticket_id);

-- ---------------------------------------------------------------------------
-- SponsorPlans + Sponsors (§18) — nomes de plano nunca fixados no código.
-- ---------------------------------------------------------------------------
create table public.sponsor_plans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  nome text not null,
  preco numeric(14,2) not null default 0,
  quantidade integer,
  cortesias integer not null default 0,
  beneficios jsonb not null default '[]'::jsonb,
  entregaveis jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sponsor_plans_event_id on public.sponsor_plans(event_id);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  sponsor_plan_id uuid references public.sponsor_plans(id) on delete set null,
  empresa text not null,
  contato text,
  valor_negociado numeric(14,2) not null default 0,
  recebido numeric(14,2) not null default 0,
  vencimentos jsonb not null default '[]'::jsonb,
  convidados integer not null default 0,
  entregaveis jsonb not null default '[]'::jsonb,
  status text not null default 'negociacao' check (status in ('negociacao', 'fechado', 'pago', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sponsors_event_id on public.sponsors(event_id);
create index idx_sponsors_sponsor_plan_id on public.sponsors(sponsor_plan_id);

-- ---------------------------------------------------------------------------
-- Payments (§47) — pagamentos efetivos, podem referenciar despesa, receita,
-- fornecedor ou patrocinador. Pelo menos uma referência é obrigatória.
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  expense_id uuid references public.expenses(id) on delete cascade,
  revenue_id uuid references public.revenues(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete cascade,
  sponsor_id uuid references public.sponsors(id) on delete cascade,
  valor numeric(14,2) not null,
  data_pagamento date not null default current_date,
  metodo text,
  status text not null default 'confirmado' check (status in ('confirmado', 'pendente', 'estornado')),
  observacao text,
  created_at timestamptz not null default now(),
  constraint payments_tem_referencia check (
    expense_id is not null or revenue_id is not null or supplier_id is not null or sponsor_id is not null
  )
);

create index idx_payments_event_id on public.payments(event_id);

-- ---------------------------------------------------------------------------
-- Simulations (§24) — hipóteses, não alteram o evento real.
-- ---------------------------------------------------------------------------
create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  nome text not null default 'Cenário',
  parametros jsonb not null default '{}'::jsonb,
  resultado jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_simulations_event_id on public.simulations(event_id);

-- ---------------------------------------------------------------------------
-- Triggers: organization_id a partir de event_id, em todas as tabelas acima.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'locations', 'participants', 'tasks', 'schedule_items', 'suppliers',
    'expenses', 'revenues', 'tickets', 'ticket_lots', 'sponsor_plans',
    'sponsors', 'payments', 'simulations'
  ]
  loop
    execute format(
      'create trigger trg_%I_set_org before insert or update of event_id on public.%I for each row execute function public.set_organization_id_from_event();',
      t, t
    );
  end loop;
end $$;

-- updated_at automático nas tabelas que têm a coluna
do $$
declare
  t text;
begin
  foreach t in array array[
    'locations', 'participants', 'tasks', 'schedule_items', 'suppliers',
    'expenses', 'revenues', 'tickets', 'ticket_lots', 'sponsor_plans',
    'sponsors'
  ]
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS: todas usam is_org_member(organization_id). Como organization_id é
-- validado/preenchido pela trigger acima a partir de event_id, e o próprio
-- event_id só pertence a organizações visíveis (RLS de events), basta checar
-- organization_id aqui — mais barato que fazer join até events a cada linha.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'locations', 'participants', 'tasks', 'schedule_items', 'suppliers',
    'expenses', 'revenues', 'tickets', 'ticket_lots', 'sponsor_plans',
    'sponsors', 'payments', 'simulations'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format(
      'create policy %I_select on public.%I for select to authenticated using (public.is_org_member(organization_id));',
      t, t
    );
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated with check (public.is_org_member(organization_id));',
      t, t
    );
    execute format(
      'create policy %I_update on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));',
      t, t
    );
    execute format(
      'create policy %I_delete on public.%I for delete to authenticated using (public.is_org_member(organization_id));',
      t, t
    );
  end loop;
end $$;

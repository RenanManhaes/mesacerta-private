-- Mesa Certa — 0004: módulo Networking (PRD §25-§40, §47, §49)
--
-- Seat é modelada como ENTIDADE (PRD §47, "novo requisito"): uma posição real
-- de uma mesa, não uma contagem. Isso permite Mesa → capacidade → cadeiras →
-- ocupantes em vez de Mesa → lista de pessoas, e é o que sustenta o desenho
-- espacial obrigatório do §29/§30 (cada seat tem uma posição ao redor da
-- mesa; a UI desenha uma cadeira por seat, ocupada ou vazia).
--
-- DistributionVersions carrega estado rascunho/publicado (§40): "Se uma
-- alteração impactar uma distribuição publicada, o sistema não deve alterar
-- tudo silenciosamente" — por isso só existe uma versão 'publicado' por vez
-- por evento (índice parcial único abaixo), e regenerar cria versão nova em
-- vez de sobrescrever a publicada.
--
-- O motor (src/lib/networking/engine.js) produz tab[participante][rodada] =
-- mesa. Assignments é a materialização disso: (round, seat, participante),
-- com seat carregando a mesa via networking_tables.

-- ---------------------------------------------------------------------------
-- networking_tables ("Tables" do PRD; nome evita a palavra reservada "table")
-- ---------------------------------------------------------------------------
create table public.networking_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  numero integer not null,
  nome text, -- nome da empresa/patrocinador associado à mesa, quando houver (§29)
  capacidade integer not null check (capacidade > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, numero)
);

create index idx_networking_tables_event_id on public.networking_tables(event_id);

-- ---------------------------------------------------------------------------
-- Seats — posição real de uma mesa (§47, §30). A quantidade de seats de uma
-- mesa deve corresponder à capacidade (aplicação gera/ajusta seats quando
-- capacidade muda; não há trigger de geração automática aqui para manter a
-- escrita explícita e auditável).
-- ---------------------------------------------------------------------------
create table public.seats (
  id uuid primary key default gen_random_uuid(),
  networking_table_id uuid not null references public.networking_tables(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  posicao integer not null check (posicao >= 0), -- ordem ao redor da mesa, usada para desenhar o perímetro
  created_at timestamptz not null default now(),
  unique (networking_table_id, posicao)
);

create index idx_seats_event_id on public.seats(event_id);
create index idx_seats_networking_table_id on public.seats(networking_table_id);

-- ---------------------------------------------------------------------------
-- Hosts (§26) — anfitrião fixo ou rotativo, associado a um participante e a
-- uma mesa "de origem" (§31: o anfitrião fixo ocupa uma cadeira; o rotativo
-- está associado à mesa mas circula — ver evitarCasa() no engine).
-- ---------------------------------------------------------------------------
create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  participant_id uuid not null references public.participants(id) on delete cascade,
  networking_table_id uuid not null references public.networking_tables(id) on delete cascade,
  tipo text not null check (tipo in ('fixo', 'rotativo')),
  created_at timestamptz not null default now(),
  unique (event_id, participant_id) -- um participante é anfitrião de no máximo uma mesa
);

create index idx_hosts_event_id on public.hosts(event_id);
create index idx_hosts_networking_table_id on public.hosts(networking_table_id);

-- ---------------------------------------------------------------------------
-- DistributionVersions (§40) — estado rascunho/publicado.
-- ---------------------------------------------------------------------------
create table public.distribution_versions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  versao integer not null,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  seed integer, -- seed do PRNG do engine (rng(seed)), para reproduzir a grade
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (event_id, versao)
);

create index idx_distribution_versions_event_id on public.distribution_versions(event_id);

-- No máximo uma versão publicada por evento ao mesmo tempo. Publicar uma
-- nova versão exige, na aplicação, despublicar a anterior explicitamente —
-- o banco não troca silenciosamente (§40).
create unique index uq_distribution_versions_one_published_per_event
  on public.distribution_versions(event_id)
  where (status = 'publicado');

-- ---------------------------------------------------------------------------
-- Rounds (§27, §37) — rodadas de uma versão de distribuição.
-- ---------------------------------------------------------------------------
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  distribution_version_id uuid not null references public.distribution_versions(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  numero integer not null,
  created_at timestamptz not null default now(),
  unique (distribution_version_id, numero)
);

create index idx_rounds_event_id on public.rounds(event_id);
create index idx_rounds_distribution_version_id on public.rounds(distribution_version_id);

-- ---------------------------------------------------------------------------
-- Assignments — materialização de tab[participante][rodada] = mesa, via seat.
-- distribution_version_id é denormalizado de round para simplificar RLS e
-- consultas ("todas as assignments da versão X") sem join até rounds.
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  distribution_version_id uuid not null references public.distribution_versions(id) on delete cascade,
  seat_id uuid not null references public.seats(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  participant_id uuid references public.participants(id) on delete cascade,
  host_id uuid references public.hosts(id) on delete cascade,
  conflito boolean not null default false,
  conflito_motivo text,
  created_at timestamptz not null default now(),
  unique (round_id, seat_id), -- uma cadeira tem no máximo um ocupante por rodada
  constraint assignments_ocupante check (
    (participant_id is not null and host_id is null) or
    (participant_id is null and host_id is not null) or
    (participant_id is null and host_id is null) -- cadeira vazia (§30: lugar vazio continua visível)
  )
);

create index idx_assignments_event_id on public.assignments(event_id);
create index idx_assignments_round_id on public.assignments(round_id);
create index idx_assignments_distribution_version_id on public.assignments(distribution_version_id);
create index idx_assignments_participant_id on public.assignments(participant_id);

-- Um participante não ocupa duas cadeiras na mesma rodada.
create unique index uq_assignments_participant_per_round
  on public.assignments(round_id, participant_id)
  where (participant_id is not null);

-- ---------------------------------------------------------------------------
-- Triggers: organization_id a partir de event_id, em todas as tabelas acima.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'networking_tables', 'seats', 'hosts', 'distribution_versions', 'rounds', 'assignments'
  ]
  loop
    execute format(
      'create trigger trg_%I_set_org before insert or update of event_id on public.%I for each row execute function public.set_organization_id_from_event();',
      t, t
    );
  end loop;
end $$;

create trigger trg_networking_tables_updated_at
  before update on public.networking_tables
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'networking_tables', 'seats', 'hosts', 'distribution_versions', 'rounds', 'assignments'
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

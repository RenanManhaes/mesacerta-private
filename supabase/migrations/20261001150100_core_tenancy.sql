-- Mesa Certa — 0002: organizações, memberships, eventos
--
-- Este é o núcleo de tenancy (MCT-4). organizations é a raiz de isolamento.
-- memberships liga auth.users (gerenciado pelo Supabase Auth) a uma
-- organização com um papel. events pertence a uma organização.
--
-- auth.users já existe (schema auth do Supabase); não criamos usuários aqui,
-- só referenciamos via FK.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is
  'Raiz de isolamento multi-tenant. Toda tabela de domínio referencia organization_id, direta ou indiretamente via events.';

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- Papel do usuário dentro da organização.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.memberships is
  'Associação usuário↔organização com papel. Um usuário pode pertencer a mais de uma organização.';

create index idx_memberships_user_id on public.memberships(user_id);
create index idx_memberships_organization_id on public.memberships(organization_id);

-- Agora que memberships existe, criamos a função de apoio para RLS usada em
-- todas as policies das tabelas de domínio.
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
  );
$$;

comment on function public.is_org_member(uuid) is
  'Verdadeiro se o usuário autenticado (auth.uid()) é membro da organização. Usada em toda policy RLS de tabela de domínio.';

-- Papel específico para mutação: só owner/admin escreve dados sensíveis de
-- organização (ex.: convidar/remover membros). Tabelas de domínio comuns
-- usam is_org_member (qualquer papel lê/escreve); isso pode ser refinado por
-- tabela em migration futura, se o produto exigir.
create or replace function public.is_org_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  );
$$;

comment on function public.is_org_admin(uuid) is
  'Verdadeiro se o usuário autenticado é owner ou admin da organização. Usada em policies de gestão de membros.';

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nome text not null,
  data_inicio date,
  data_fim date,
  cidade text,
  local_nome text,
  publico_esperado integer,
  capacidade_espaco integer,
  tem_ingressos boolean not null default false,
  tem_patrocinadores boolean not null default false,
  tem_fornecedores boolean not null default false,
  tem_programacao boolean not null default false,
  tem_networking boolean not null default false,
  status text not null default 'planejamento' check (status in ('planejamento', 'confirmado', 'em_andamento', 'finalizado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.events is
  'Evento dentro de uma organização. Os campos tem_* vêm do onboarding (PRD §7) e ligam/desligam módulos opcionais na UI; não controlam RLS.';

create index idx_events_organization_id on public.events(organization_id);

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Função usada pelas tabelas filhas de evento (migrations seguintes) para
-- preencher e validar organization_id a partir de event_id, para que a
-- aplicação só precise informar event_id e a tenancy nunca fique
-- inconsistente nem seja escrita livremente pelo cliente.
create or replace function public.set_organization_id_from_event()
returns trigger
language plpgsql
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id from public.events where id = new.event_id;
  if v_org_id is null then
    raise exception 'event_id % não corresponde a um evento existente', new.event_id;
  end if;
  new.organization_id = v_org_id;
  return new;
end;
$$;

comment on function public.set_organization_id_from_event() is
  'Preenche organization_id a partir de event_id em INSERT/UPDATE, para toda tabela filha de evento. Garante que organization_id nunca diverge do evento dono.';

-- RLS: organizations
alter table public.organizations enable row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (true); -- qualquer usuário autenticado pode criar uma organização (vira owner via aplicação, na mesma transação lógica)

create policy organizations_update on public.organizations
  for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.is_org_admin(id));

-- RLS: memberships
alter table public.memberships enable row level security;

create policy memberships_select on public.memberships
  for select to authenticated
  using (public.is_org_member(organization_id));

-- Bootstrapping: a primeira membership de uma organização (sem nenhum
-- membro ainda) pode ser criada por qualquer usuário autenticado — é assim
-- que o criador da organização vira seu primeiro owner. Depois disso, só
-- owner/admin adiciona novos membros.
create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (
    public.is_org_admin(organization_id)
    or not exists (
      select 1 from public.memberships m2 where m2.organization_id = memberships.organization_id
    )
  );

create policy memberships_update on public.memberships
  for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy memberships_delete on public.memberships
  for delete to authenticated
  using (public.is_org_admin(organization_id));

-- RLS: events
alter table public.events enable row level security;

create policy events_select on public.events
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy events_insert on public.events
  for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy events_update on public.events
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy events_delete on public.events
  for delete to authenticated
  using (public.is_org_admin(organization_id));

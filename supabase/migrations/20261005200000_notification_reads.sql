-- MCT-53: estado de leitura das notificações do sino, por usuário, no banco.
-- As notificações em si são derivadas dos dados do evento (tarefas, despesas,
-- fornecedores, equipe); aqui guardamos apenas quais chaves cada usuário já leu.
create table public.notification_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id text not null,
  notification_key text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, event_id, notification_key)
);

create index idx_notification_reads_org on public.notification_reads(organization_id);

alter table public.notification_reads enable row level security;

-- Cada usuário só enxerga e grava a própria leitura, e só em organização da qual é membro.
create policy notification_reads_select on public.notification_reads
  for select to authenticated
  using (user_id = (select auth.uid()) and public.is_org_member(organization_id));
create policy notification_reads_insert on public.notification_reads
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_org_member(organization_id));
create policy notification_reads_update on public.notification_reads
  for update to authenticated
  using (user_id = (select auth.uid()) and public.is_org_member(organization_id))
  with check (user_id = (select auth.uid()) and public.is_org_member(organization_id));

revoke all on public.notification_reads from anon, authenticated;
grant select, insert, update on public.notification_reads to authenticated;

comment on table public.notification_reads is
  'Chaves de notificação já lidas por usuário/evento (MCT-53). Sem delete: leitura é monotônica.';

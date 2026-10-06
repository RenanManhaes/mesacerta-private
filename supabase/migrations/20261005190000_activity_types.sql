-- MCT-63: tipos de atividade da programação, guardados por organização.
-- Ficam disponíveis em todos os eventos da organização. A atividade guarda o NOME do tipo
-- (texto) dentro do documento do evento; renomear um tipo atualiza as atividades pela aplicação.

create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60 and name = btrim(name)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.activity_types is
  'Tipos de atividade da programação (palestra, painel, ...), por organização. Nome único sem diferenciar maiúsculas.';

create unique index activity_types_org_name_key on public.activity_types (organization_id, lower(name));

create trigger trg_activity_types_updated_at
  before update on public.activity_types
  for each row execute function public.set_updated_at();

alter table public.activity_types enable row level security;
revoke all on public.activity_types from anon, authenticated;
grant select, insert, update, delete on public.activity_types to authenticated;

create policy activity_types_select on public.activity_types for select to authenticated
  using (public.is_org_member(organization_id));
create policy activity_types_insert on public.activity_types for insert to authenticated
  with check (public.is_org_member(organization_id));
create policy activity_types_update on public.activity_types for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy activity_types_delete on public.activity_types for delete to authenticated
  using (public.is_org_member(organization_id));

-- Lista inicial: toda organização nova nasce com ela (a organização ainda não tem membro quando é
-- criada, por isso o gatilho é security definer) e as existentes recebem agora.
create schema if not exists private;

create function private.seed_activity_types(p_org uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.activity_types (organization_id, name)
  select p_org, n from unnest(array[
    'Palestra', 'Painel', 'Rodada de negócio', 'Intervalo',
    'Credenciamento', 'Almoço', 'Apresentação', 'Encerramento'
  ]) as n
  on conflict do nothing;
$$;
revoke execute on function private.seed_activity_types(uuid) from public, anon, authenticated;

create function private.organizations_seed_activity_types()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.seed_activity_types(new.id);
  return new;
end $$;
revoke execute on function private.organizations_seed_activity_types() from public, anon, authenticated;

create trigger trg_organizations_seed_activity_types
  after insert on public.organizations
  for each row execute function private.organizations_seed_activity_types();

select private.seed_activity_types(id) from public.organizations;

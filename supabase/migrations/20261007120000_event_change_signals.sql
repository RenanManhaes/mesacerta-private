-- MCT-85: sinal leve de "o evento mudou", para atualizar as sessões abertas sem recarregar a página.
-- O documento completo continua restrito (RLS de platform_events só libera fundador e diretor).
-- Esta tabela guarda só (evento, revisão, hora): nenhum dado do evento. Qualquer membro ativo pode
-- ler e assinar via Realtime; ao receber uma revisão nova, o app rebusca o evento por event_list,
-- que já devolve a projeção do papel (a staff nunca recebe o documento completo).
create table public.event_change_signals (
 event_id text primary key references public.platform_events(id) on delete cascade,
 revision bigint not null,
 changed_at timestamptz not null default now()
);
alter table public.event_change_signals enable row level security;
revoke all on public.event_change_signals from public,anon,authenticated;
grant select on public.event_change_signals to authenticated;
create policy signal_read on public.event_change_signals for select to authenticated
 using (private.event_role(event_id) is not null);

-- Toda gravação que muda a revisão (event_save, equipe, catálogo...) emite o sinal, sem depender de cada função.
create function private.emit_event_change_signal() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.event_change_signals(event_id,revision,changed_at) values(new.id,new.revision,now())
 on conflict(event_id) do update set revision=excluded.revision,changed_at=excluded.changed_at;
 return new;
end $$;
revoke all on function private.emit_event_change_signal() from public,anon,authenticated;
create trigger emit_event_change_signal_insert after insert on public.platform_events
 for each row execute function private.emit_event_change_signal();
create trigger emit_event_change_signal_update after update of revision on public.platform_events
 for each row when (old.revision is distinct from new.revision) execute function private.emit_event_change_signal();

insert into public.event_change_signals(event_id,revision) select id,revision from public.platform_events
on conflict(event_id) do nothing;

do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
  and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='event_change_signals') then
  alter publication supabase_realtime add table public.event_change_signals;
 end if;
end $$;

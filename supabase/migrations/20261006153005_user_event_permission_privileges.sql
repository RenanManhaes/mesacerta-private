-- Supabase default privileges may grant DML to new tables. Explicitly remove it.
revoke all on public.user_event_permissions from anon,authenticated;
grant select on public.user_event_permissions to authenticated;

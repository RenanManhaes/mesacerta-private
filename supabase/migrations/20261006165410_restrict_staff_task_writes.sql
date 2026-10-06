-- RLS chooses rows; a trigger also limits the columns staff may change.
drop policy event_access on public.tasks;
create policy task_read on public.tasks for select to authenticated
 using (private.event_role(event_id::text) in ('founder','director')
 or (private.event_role(event_id::text)='staff' and assigned_user_id=(select auth.uid())));
create policy task_update on public.tasks for update to authenticated
 using (private.event_role(event_id::text) in ('founder','director')
 or (private.event_role(event_id::text)='staff' and assigned_user_id=(select auth.uid())))
 with check (private.event_role(event_id::text) in ('founder','director')
 or (private.event_role(event_id::text)='staff' and assigned_user_id=(select auth.uid())));
create policy task_create on public.tasks for insert to authenticated
 with check (private.event_role(event_id::text) in ('founder','director'));
create policy task_delete on public.tasks for delete to authenticated
 using (private.event_role(event_id::text) in ('founder','director'));

create function private.guard_staff_task_update() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin
 if private.event_role(old.event_id::text)='staff' then
  if (to_jsonb(new) - array['status','updated_at']) is distinct from
     (to_jsonb(old) - array['status','updated_at']) then
   raise exception using errcode='42501',message='Staff só pode mudar o status de tarefas atribuídas';
  end if;
  -- Only the database supplies the update timestamp, even when sent by a client.
  new.updated_at := now();
 end if;
 return new;
end $$;
revoke all on function private.guard_staff_task_update() from public,anon,authenticated;
create trigger guard_staff_task_update before update on public.tasks
 for each row execute function private.guard_staff_task_update();

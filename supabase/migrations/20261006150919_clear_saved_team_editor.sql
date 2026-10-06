create function private.clear_team_editor() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null then
  update public.platform_events set document=jsonb_set(document,'{uiState}',coalesce(document->'uiState','{}'::jsonb) || jsonb_build_object(auth.uid()::text,coalesce(document->'uiState'->auth.uid()::text,'{}'::jsonb) || jsonb_build_object('staff.draft',null))) where id=new.event_id;
 end if;
 return new;
end $$;
revoke all on function private.clear_team_editor() from public,anon,authenticated;
create trigger clear_team_editor after update of display_name,contact_email,phone,function,area,job_title,removed_at on public.event_members for each row execute function private.clear_team_editor();

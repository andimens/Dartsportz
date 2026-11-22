-- Dartsportz – Update 4: Einladungscode optional (Admin-Schalter)
insert into public.app_settings (key, value) values ('inviteRequired', 'false'::jsonb) on conflict (key) do nothing;

create or replace function public.needs_invite() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles)
     and coalesce((select (value)::text::boolean from app_settings where key = 'inviteRequired'), false) $$;
grant execute on function public.needs_invite() to anon, authenticated;

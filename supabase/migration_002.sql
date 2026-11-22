-- Dartsportz – Update 2 (im SQL Editor ausführen, nach schema.sql)

-- Braucht die Registrierung einen Einladungscode? (der allererste Nutzer nicht)
create or replace function public.needs_invite() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles) $$;

-- Einladungscode prüfen, ohne ihn zu verbrauchen
create or replace function public.check_invite(p_code text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from invites where code = upper(p_code) and uses < max_uses and expires_at > now()) $$;

grant execute on function public.needs_invite() to anon, authenticated;
grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function public.redeem_invite(text) to authenticated;

-- Live-Spiele: auch der Host darf immer lesen/ändern
drop policy if exists "live lesen" on live_games;
create policy "live lesen" on live_games for select using (auth.uid() = any(players) or host = auth.uid());
drop policy if exists "live ändern" on live_games;
create policy "live ändern" on live_games for update using (is_active() and (auth.uid() = any(players) or host = auth.uid()));

-- Spiele dürfen auch von Mitspielern (nicht nur vom Ersteller) gespeichert werden
drop policy if exists "matches schreiben" on matches;
create policy "matches schreiben" on matches for insert with check (is_active() and (owner = auth.uid() or auth.uid() = any(players)));

-- Rechte (neue Supabase-Projekte vergeben diese nicht mehr automatisch)
grant usage on schema public to anon, authenticated;
grant select on public.keepalive to anon, authenticated;
grant select on public.app_settings to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.invites, public.friendships, public.matches,
  public.live_games, public.chat_messages, public.guest_claims, public.app_settings, public.push_subscriptions to authenticated;
grant usage, select on all sequences in schema public to authenticated;

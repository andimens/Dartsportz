-- =========================================================
-- Dartsportz – Datenbank-Schema (Supabase SQL Editor → Run)
-- =========================================================

-- Profile (1:1 zu auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'Spieler',
  nick text, country text default 'DE', age int, height int, hand text default 'rechts',
  board text default 'winmau-blade-x', color text default '#ff6b00', avatar_url text,
  dart jsonb default '{}'::jsonb,
  role text not null default 'user' check (role in ('admin','user')),
  banned boolean not null default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Einladungslinks (nur Admin erstellt)
create table if not exists public.invites (
  code text primary key default upper(substr(md5(random()::text),1,8)),
  created_by uuid references public.profiles(id) on delete set null,
  max_uses int default 10, uses int default 0,
  expires_at timestamptz default now() + interval '30 days',
  created_at timestamptz default now()
);

-- Freundschaften
create table if not exists public.friendships (
  user_a uuid references public.profiles(id) on delete cascade,
  user_b uuid references public.profiles(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending','accepted')),
  created_at timestamptz default now(),
  primary key (user_a, user_b)
);

-- Abgeschlossene Spiele (komplette Wurfdaten als JSON)
create table if not exists public.matches (
  id text primary key,
  mode text not null,
  owner uuid references public.profiles(id) on delete set null,
  players uuid[] not null default '{}',
  data jsonb not null,
  created_at timestamptz default now()
);
create index if not exists matches_players_idx on public.matches using gin (players);

-- Live-Spiele (Synchronisation zwischen Handys)
create table if not exists public.live_games (
  id uuid primary key default gen_random_uuid(),
  host uuid references public.profiles(id) on delete cascade,
  players uuid[] not null default '{}',
  status text not null default 'invited' check (status in ('invited','running','finished','cancelled')),
  state jsonb not null default '{}'::jsonb,
  version int not null default 0,
  updated_at timestamptz default now()
);

-- Chat
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  sender uuid references public.profiles(id) on delete cascade,
  receiver uuid references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz default now(),
  read_at timestamptz
);
create index if not exists chat_pair_idx on public.chat_messages (sender, receiver, created_at);

-- Gäste-Übernahme per Code
create table if not exists public.guest_claims (
  code text primary key,
  created_by uuid references public.profiles(id) on delete cascade,
  guest jsonb not null,
  matches jsonb not null default '[]'::jsonb,
  claimed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Globale Einstellungen (z. B. Scheiben-Sounds, vom Admin gesetzt)
create table if not exists public.app_settings (
  key text primary key, value jsonb, updated_at timestamptz default now()
);

-- Push-Abos
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  subscription jsonb not null, created_at timestamptz default now()
);

-- Keep-alive (wird alle 3 Tage von GitHub Actions angepingt)
create table if not exists public.keepalive (id int primary key default 1, pinged_at timestamptz default now());
insert into public.keepalive (id) values (1) on conflict do nothing;

-- ---------- Hilfsfunktionen ----------
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not banned) $$;

create or replace function public.is_active() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and not banned) $$;

-- Neues Profil bei Registrierung; der allererste Nutzer wird Admin
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          case when (select count(*) from profiles) = 0 then 'admin' else 'user' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Einladung einlösen (nach Registrierung aufrufen)
create or replace function public.redeem_invite(p_code text) returns boolean language plpgsql security definer set search_path = public as $$
declare inv invites; host uuid;
begin
  select * into inv from invites where code = upper(p_code) for update;
  if inv is null or inv.uses >= inv.max_uses or inv.expires_at < now() then return false; end if;
  update invites set uses = uses + 1 where code = inv.code;
  host := inv.created_by;
  if host is not null and host <> auth.uid() then
    insert into friendships (user_a, user_b) values (least(host, auth.uid()), greatest(host, auth.uid())) on conflict do nothing;
  end if;
  return true;
end $$;

-- ---------- Row Level Security ----------
alter table profiles enable row level security;
alter table invites enable row level security;
alter table friendships enable row level security;
alter table matches enable row level security;
alter table live_games enable row level security;
alter table chat_messages enable row level security;
alter table guest_claims enable row level security;
alter table app_settings enable row level security;
alter table push_subscriptions enable row level security;
alter table keepalive enable row level security;

create policy "profiles lesen" on profiles for select using (auth.role() = 'authenticated');
create policy "eigenes profil" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()) and banned = false);
create policy "admin profile" on profiles for update using (is_admin());

create policy "invites admin" on invites for all using (is_admin()) with check (is_admin());

create policy "freunde lesen" on friendships for select using (auth.uid() in (user_a, user_b));
create policy "freunde anlegen" on friendships for insert with check (is_active() and auth.uid() in (user_a, user_b));
create policy "freunde löschen" on friendships for delete using (auth.uid() in (user_a, user_b));

create policy "matches lesen" on matches for select using (auth.uid() = any(players) or owner = auth.uid() or is_admin());
create policy "matches schreiben" on matches for insert with check (is_active() and owner = auth.uid());

create policy "live lesen" on live_games for select using (auth.uid() = any(players));
create policy "live anlegen" on live_games for insert with check (is_active() and host = auth.uid());
create policy "live ändern" on live_games for update using (is_active() and auth.uid() = any(players));

create policy "chat lesen" on chat_messages for select using (auth.uid() in (sender, receiver));
create policy "chat senden" on chat_messages for insert with check (is_active() and sender = auth.uid());
create policy "chat gelesen" on chat_messages for update using (receiver = auth.uid());

create policy "claims" on guest_claims for all using (auth.role() = 'authenticated') with check (is_active());

create policy "settings lesen" on app_settings for select using (true);
create policy "settings admin" on app_settings for all using (is_admin()) with check (is_admin());

create policy "push eigene" on push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "keepalive lesen" on keepalive for select using (true);

-- Realtime für Live-Spiele und Chat
alter publication supabase_realtime add table public.live_games;
alter publication supabase_realtime add table public.chat_messages;

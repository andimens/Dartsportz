-- Dartsportz – Update 5: Statistik-Reset mit Bestätigungscode vom Admin
create table if not exists public.reset_requests (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  code text not null,
  used boolean not null default false,
  created_at timestamptz default now()
);
alter table public.reset_requests enable row level security;
drop policy if exists "reset admin" on public.reset_requests;
create policy "reset admin" on public.reset_requests for select using (is_admin());
grant select on public.reset_requests to authenticated;

-- Nutzer fordert Reset an: Code wird erzeugt, nur der Admin kann ihn sehen
create or replace function public.request_reset() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not is_active() then return false; end if;
  update reset_requests set used = true where user_id = auth.uid() and not used;
  insert into reset_requests (user_id, code) values (auth.uid(), lpad((floor(random() * 1000000))::int::text, 6, '0'));
  return true;
end $$;

-- Nutzer gibt den Code ein, den er vom Admin bekommen hat
create or replace function public.verify_reset(p_code text) returns boolean language plpgsql security definer set search_path = public as $$
declare r reset_requests;
begin
  select * into r from reset_requests where user_id = auth.uid() and not used and code = trim(p_code)
    and created_at > now() - interval '7 days' order by created_at desc limit 1;
  if r is null then return false; end if;
  update reset_requests set used = true where id = r.id;
  return true;
end $$;
grant execute on function public.request_reset() to authenticated;
grant execute on function public.verify_reset(text) to authenticated;

-- Dartsportz – Update 3: Sicherheit Gast-Codes verschärft
drop policy if exists "claims" on guest_claims;
create policy "claims eigene" on guest_claims for all using (created_by = auth.uid()) with check (created_by = auth.uid() and is_active());

-- Einlösen nur über diese Funktion: liefert die Daten genau eines Codes und markiert ihn als eingelöst
create or replace function public.claim_guest(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare c guest_claims;
begin
  if not is_active() then return null; end if;
  select * into c from guest_claims where code = upper(p_code) for update;
  if c is null or (c.claimed_by is not null and c.claimed_by <> auth.uid()) then return null; end if;
  update guest_claims set claimed_by = auth.uid() where code = c.code;
  return jsonb_build_object('guest', c.guest, 'matches', c.matches);
end $$;
grant execute on function public.claim_guest(text) to authenticated;

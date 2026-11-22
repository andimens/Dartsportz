# Dartsportz 🎯

Dart-Scorer als PWA (offline-fähig) – X01, Cricket, Killer, Highscore, Shanghai, Bot-Karriere (30 Level), Training, Statistiken, Pfeil-Designer.

- `index.html` – fertige App (wird von `build.py` aus `src/` erzeugt)
- `supabase/schema.sql` – Datenbank (einmal im Supabase SQL Editor ausführen)
- `.github/workflows/keepalive.yml` – pingt Supabase alle 3 Tage, damit das Projekt nicht pausiert

## Hosting
Vercel → „Add New Project“ → dieses Repo wählen → Framework „Other“ → Deploy. Kein Build-Schritt nötig.

## Keep-alive einrichten
GitHub → Settings → Secrets and variables → Actions → `SUPABASE_URL` und `SUPABASE_ANON_KEY` anlegen.

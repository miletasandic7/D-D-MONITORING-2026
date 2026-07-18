# Zašto /api/cameras i /api/incidents vraćaju 503 na Vercel-u

## Zaključak istrage

Kod je proveren i **nije uzrok** — lokalno, sa istim handlerima
(`api/cameras.js`, `api/incidents/index.js`, `api/_auth.js`), dobijeni su:

- Bez `DATABASE_URL` / `SUPABASE_JWT_SECRET`: **503** sa istom porukom
  koju prijavljuješ ("Database not configured...") — ovo je namerno,
  graceful-degradation ponašanje, ne bug.
- Sa oba env var-a postavljena i migracijama pokrenutim: **200** sa
  ispravnim podacima.

Zaključak: 503 na tvom Vercel deploy-u znači da **live projekat nema
podešene environment varijable** (i/ili migracije nisu pokrenute nad
produkcionom bazom), ne da je kod pokvaren.

## Kako da proveriš odmah

Otvori (bez potrebe za login-om u app):

```
https://d-d-monitoring-2026.vercel.app/api/health
```

Ovo je nov dijagnostički endpoint (dodat u ovom fix-u) koji vraća tačno
šta nedostaje, bez otkrivanja tajnih vrednosti:

```json
{
  "success": false,
  "checks": {
    "env": {
      "DATABASE_URL": false,
      "SUPABASE_JWT_SECRET": false,
      ...
    },
    "database": { "configured": false, "connected": null, "has_default_organization": null }
  }
}
```

Šta god od ovoga piše `false`, to je sledeći korak.

## Konkretni koraci na Vercel dashboard-u

1. **Vercel → Project → Settings → Environment Variables**, proveri da
   postoje (za **Production** environment, ne samo Preview/Development):
   - `DATABASE_URL` — connection string ka tvojoj Postgres bazi (Neon/Supabase Postgres/itd.)
   - `SUPABASE_JWT_SECRET` — Supabase → Settings → API → JWT Secret
   - (opciono za Fazu 3) `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_ENDPOINT`, `STORAGE_PUBLIC_BASE_URL`
2. Posle dodavanja/izmene env varijabli, **redeploy je obavezan** —
   Vercel ne primenjuje nove env varijable na već postojeći build,
   samo na sledeći deploy (dugme "Redeploy" u Deployments tabu).
3. Proveri **Root Directory** podešavanje (Settings → General → Root
   Directory) — mora biti prazno/repo root, ne `frontend/`, inače
   `vercel.json` i `api/` folder na root-u se uopšte ne uzimaju u obzir
   pri deploy-u.
4. Proveri da su migracije **stvarno pokrenute nad produkcionom bazom**
   na koju pokazuje `DATABASE_URL`. Najbrže je preko novog skripta:
   ```bash
   DATABASE_URL="postgres://..." npm run migrate:postgres
   ```
   To automatski izvršava `db/schema.sql` i **sve** fajlove iz
   `db/migrations/*.sql` redom. Ako želiš ručno, ekvivalentno je:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   psql "$DATABASE_URL" -f db/migrations/001_multi_tenant_foundation.sql
   psql "$DATABASE_URL" -f db/migrations/002_events_organization_scoping.sql
   psql "$DATABASE_URL" -f db/migrations/003_operator_experience.sql
   psql "$DATABASE_URL" -f db/migrations/004_snapshots_recordings.sql
   psql "$DATABASE_URL" -f db/migrations/005_incidents.sql
   psql "$DATABASE_URL" -f db/migrations/006_media_nodes.sql
   psql "$DATABASE_URL" -f db/migrations/007_rls_audit_logs.sql
   ```
   (`/api/health`'s `has_default_organization: false` bez `connected: false`
   je znak da je baza dostupna ali migracije nisu pokrenute.)
5. Uradi **redeploy**.
6. Ponovo otvori `/api/health` posle redeploy-a da potvrdiš `"success": true`.
7. Uradi smoke test ključnih ruta:
   ```bash
   DEPLOY_BASE_URL="https://d-d-monitoring-2026.vercel.app" npm run smoke:deploy
   ```
   Ako imaš validan Supabase access token i želiš da `/api/cameras` i
   `/api/incidents` moraju da vrate `200`, dodaj i:
   ```bash
   DEPLOY_BASE_URL="https://d-d-monitoring-2026.vercel.app" \
   SMOKE_BEARER_TOKEN="..." \
   npm run smoke:deploy
   ```
   Bez tokena je i dalje validno da te dve rute vrate `401/403`; bitno
   je da više ne vraćaju `503`.

## Šta je promenjeno u ovom fix-u (za kontekst)

- `api/health.js` (novo) — dijagnostički endpoint, gore opisan.
- `api/_auth.js` — dodato `console.error` logovanje na svakom 503
  mestu, sa jasnim prefiksom, vidljivo u Vercel → Deployments →
  Functions → Logs.
- `dev-server.js` (novo) + `npm run dev` — lokalni server koji montira
  sve `api/*.js` handlere po istom pravilu putanja kao Vercel, bez
  potrebe za `vercel login`.
- `scripts/run-postgres-migrations.js` + `npm run migrate:postgres` —
  automatski pokreće `schema.sql` i sve Postgres migracije redom nad
  bazom iz `DATABASE_URL`.
- `scripts/smoke-deploy.js` + `npm run smoke:deploy` — proverava
  `/api/health`, a zatim da `/api/cameras` i `/api/incidents` više ne
  vraćaju `503` (ili `200` ako je prosleđen bearer token).
- `frontend/vite.config.js` — dodat proxy `/api` → `localhost:3001`
  tokom lokalnog razvoja.

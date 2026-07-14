# D&D Monitoring — roadmap ka multi-tenant monitoring centru

Status: **plan / nacrt** — ništa u ovom dokumentu nije implementirano. Cilj je da
posluži kao referenca za sledeće faze razvoja pre nego što se počne sa kodom.

Trenutno stanje (posle prethodnih ispravki) je jednostavan single-tenant
dashboard: jedna organizacija, kamere u jednoj tabeli, bez rola, bez audit loga.
Da bi se stiglo do "profesionalnog monitoring centra" sa više klijenata,
operaterima, alarmima i skalabilnim streamingom, potrebna je promena na tri
nivoa: model podataka, sistemska arhitektura i redosled isporuke (faze).

---

## 1. Ključni koncepti pre šeme

- **Organization (customer)** — klijent platforme (firma čije objekte štitimo).
  Sve ostalo u sistemu je skalirano po `organization_id`.
- **Site** — fizička lokacija klijenta (magacin, filijala, gradilište).
- **Camera** — pripada jednom site-u; jedan `rtsp_url` + referenca na media
  node koji je servira kao HLS/WebRTC.
- **User** — može biti platform admin (Anthropic-strana, upravlja celom
  platformom), organizacioni admin (klijent — upravlja svojim site-ovima i
  korisnicima), operator (zaposlen u monitoring centru — gleda kamere,
  reaguje na alarme) ili customer viewer (klijent koji samo gleda svoje
  kamere, bez operativnih ovlašćenja).
- **Operator assignment** — koji operater pokriva koje site-ove/kamere. Ovo je
  odvojeno od role, jer isti operater menja raspored (smene) tokom vremena.
- **Event** — automatski detektovan signal (pokret, AI detekcija, senzor).
- **Incident/alarm** — radni nalog koji nastaje iz eventa (ili ručno), ima
  status, dodeljenog operatera, i istoriju.
- **Audit log / camera view log** — nezavisna, append-only evidencija ko je
  šta radio i kada — ovo je regulatorni zahtev za monitoring centre.

---

## 2. Model baze podataka (PostgreSQL)

Sve tenant-scoped tabele nose `organization_id` direktno (čak i kad se može
izvesti preko site_id/camera_id) — to omogućava jednostavne i brze **Row Level
Security (RLS)** politike bez JOIN-ova, što je ključno na skali.

```sql
-- =========================================================
-- 1. TENANCY
-- =========================================================

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  plan_tier       TEXT NOT NULL DEFAULT 'standard',   -- standard | professional | enterprise
  status          TEXT NOT NULL DEFAULT 'active',     -- active | suspended | trial
  contact_email   TEXT,
  camera_limit    INTEGER NOT NULL DEFAULT 10,
  site_limit      INTEGER NOT NULL DEFAULT 3,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sites_org ON sites(organization_id);

-- =========================================================
-- 2. MEDIA / STREAMING INFRASTRUCTURE
-- =========================================================

-- Registar streaming servera (MediaMTX/go2rtc instance), za horizontalno
-- skaliranje po regionu. Kamere se raspoređuju na node-ove po kapacitetu.
CREATE TABLE media_nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region          TEXT NOT NULL,               -- npr. eu-central, us-east
  hostname        TEXT NOT NULL,
  public_hls_url  TEXT NOT NULL,               -- https://stream-eu1.example.com
  capacity        INTEGER NOT NULL DEFAULT 50, -- max broj kamera
  status          TEXT NOT NULL DEFAULT 'online', -- online | degraded | offline
  last_heartbeat_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cameras (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  media_node_id   UUID REFERENCES media_nodes(id),
  name            TEXT NOT NULL,
  rtsp_url        TEXT NOT NULL,               -- čuvati enkriptovano (pgcrypto) u produkciji
  location        TEXT,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  recording_mode  TEXT NOT NULL DEFAULT 'event', -- off | event | continuous
  retention_days  INTEGER NOT NULL DEFAULT 30,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cameras_org ON cameras(organization_id);
CREATE INDEX idx_cameras_site ON cameras(site_id);

-- Kratkotrajni potpisani tokeni za pristup HLS/WebRTC streamu — sprečava
-- da operater samo pogodi URL tuđe kamere; token nosi camera_id + user_id + exp.
CREATE TABLE camera_stream_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id       UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  token           TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stream_tokens_expiry ON camera_stream_tokens(expires_at);

-- =========================================================
-- 3. IDENTITY, ROLES, PERMISSIONS
-- =========================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL za platform staff
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  user_type       TEXT NOT NULL,   -- platform_admin | org_admin | operator | customer_viewer
  status          TEXT NOT NULL DEFAULT 'active',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_org ON users(organization_id);

CREATE TABLE roles (
  id              SERIAL PRIMARY KEY,
  key             TEXT NOT NULL UNIQUE,     -- org_admin, operator, viewer...
  description     TEXT
);

CREATE TABLE permissions (
  id              SERIAL PRIMARY KEY,
  key             TEXT NOT NULL UNIQUE,     -- camera.view, camera.snapshot, incident.resolve...
  description     TEXT
);

CREATE TABLE role_permissions (
  role_id         INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id   INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id         INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Koji operater trenutno pokriva koji site (menja se po smenama)
CREATE TABLE operator_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  assigned_by     UUID REFERENCES users(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  active          BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_operator_assignments_user ON operator_assignments(user_id);
CREATE INDEX idx_operator_assignments_site ON operator_assignments(site_id);

-- =========================================================
-- 4. SNAPSHOTS & RECORDINGS
-- =========================================================

CREATE TABLE snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id       UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  taken_by_user_id UUID REFERENCES users(id),
  taken_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  storage_url     TEXT NOT NULL,      -- S3-compatible object storage
  trigger         TEXT NOT NULL DEFAULT 'manual', -- manual | event
  file_size_bytes BIGINT
);
CREATE INDEX idx_snapshots_camera ON snapshots(camera_id, taken_at DESC);

CREATE TABLE recordings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id         UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id          UUID REFERENCES events(id),
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ,
  storage_url       TEXT,
  duration_seconds  INTEGER,
  size_bytes        BIGINT,
  trigger_reason    TEXT,             -- motion | ai_detection | manual | continuous
  status            TEXT NOT NULL DEFAULT 'recording', -- recording | completed | failed
  retention_expires_at TIMESTAMPTZ
);
CREATE INDEX idx_recordings_camera ON recordings(camera_id, start_time DESC);
CREATE INDEX idx_recordings_retention ON recordings(retention_expires_at);

-- =========================================================
-- 5. EVENTS & ALARMS
-- =========================================================

CREATE TABLE event_types (
  id              SERIAL PRIMARY KEY,
  key             TEXT NOT NULL UNIQUE,   -- motion, line_cross, intrusion, camera_offline...
  label           TEXT NOT NULL,
  default_severity TEXT NOT NULL DEFAULT 'medium' -- low | medium | high | critical
);

CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id       UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type_id   INTEGER NOT NULL REFERENCES event_types(id),
  source          TEXT NOT NULL DEFAULT 'ai', -- ai | manual | sensor
  confidence      NUMERIC(4,3),
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB
);
CREATE INDEX idx_events_camera_time ON events(camera_id, detected_at DESC);
CREATE INDEX idx_events_org_time ON events(organization_id, detected_at DESC);

CREATE TABLE incidents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id               UUID NOT NULL REFERENCES sites(id),
  camera_id             UUID NOT NULL REFERENCES cameras(id),
  event_id              UUID REFERENCES events(id),
  severity              TEXT NOT NULL DEFAULT 'medium',
  status                TEXT NOT NULL DEFAULT 'new', -- new | acknowledged | in_progress | resolved | false_alarm
  assigned_operator_id  UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at       TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  resolution_notes      TEXT
);
CREATE INDEX idx_incidents_org_status ON incidents(organization_id, status);
CREATE INDEX idx_incidents_operator ON incidents(assigned_operator_id, status);

-- Vremenska linija postupanja po incidentu (za UI i za audit)
CREATE TABLE incident_activity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,  -- acknowledged, escalated, resolved, commented...
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_activity ON incident_activity_log(incident_id, created_at);

-- Buduće (faza 4+): pravila za notifikacije/eskalaciju
CREATE TABLE notification_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type_id         INTEGER REFERENCES event_types(id),
  channel               TEXT NOT NULL,  -- email | sms | push
  recipient             TEXT NOT NULL,
  escalate_after_minutes INTEGER
);

-- =========================================================
-- 6. AUDIT & COMPLIANCE
-- =========================================================

-- Append-only opšti audit log (login, izmene podešavanja, izvoz snimka...)
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,        -- login, camera.create, recording.export...
  resource_type   TEXT,
  resource_id     UUID,
  metadata        JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Posebna, visoko-frekventna tabela: "ko je gledao koju kameru i kada"
-- (odvojeno od audit_logs jer se drugačije upisuje/čita — svaki live-view
-- session, ne svaka akcija).
CREATE TABLE camera_view_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id       UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  ip_address      INET
);
CREATE INDEX idx_camera_view_camera ON camera_view_logs(camera_id, started_at DESC);
CREATE INDEX idx_camera_view_user ON camera_view_logs(user_id, started_at DESC);

-- =========================================================
-- 7. BILLING (nastavak postojeće PayPal integracije)
-- =========================================================

CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL,
  paypal_subscription_id TEXT,
  status                TEXT NOT NULL DEFAULT 'active',
  current_period_end    TIMESTAMPTZ
);
```

### Row Level Security (obavezno pre uvođenja drugog klijenta)

```sql
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
-- ... isto za sve tenant-scoped tabele

CREATE POLICY tenant_isolation_cameras ON cameras
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

Aplikacioni sloj mora, na početku svakog request-a, postaviti
`SET app.current_org_id = '<org iz JWT-a>'` (ili ekvivalent preko Supabase
`auth.jwt()` claim-a) — inače RLS ne štiti ništa.

---

## 3. Sistemska arhitektura

```
IP kamere (RTSP, po site-u)
        │
        ▼
Regionalni media node-ovi (MediaMTX/go2rtc klaster, po regionu)
  - pull RTSP → re-publish HLS (gledanje) + WebRTC (niska latencija)
  - izdaje kratkotrajne stream tokene
  - heartbeat u `media_nodes` tabelu (za load balancing/health)
        │
        ▼
Aplikacioni sloj
  - Operator konzola (web) — live grid, alarmi, snapshot, izveštaji
  - Customer portal (web) — klijent gleda samo svoje kamere/incidente
  - REST/GraphQL API — RBAC + tenant scoping na svakom pozivu
  - Event/alarm worker (persistent servis, NE serverless) — čita event stream,
    kreira incidente, pokreće event-based recording, šalje notifikacije
        │
        ▼
Podaci i skladište
  - PostgreSQL (RLS po organization_id, read replika za izveštaje/audit)
  - Object storage S3-compatible (snapshot-i, snimci, sa retention lifecycle)
  - Message queue (event ingestion → alarm engine → notifikacije), na početku
    dovoljan Postgres LISTEN/NOTIFY ili Redis Streams, kasnije Kafka/SQS
```

Ključne arhitekturne odluke:

1. **Vercel ostaje za frontend + CRUD API**, ali servisi koji moraju da žive
   (event/alarm worker, media node health checker) idu na poseban always-on
   host (npr. mali VPS/K8s/Fly.io) — to je već identifikovano u prethodnoj
   analizi streaminga i važi i ovde za event pipeline.
2. **Media node registry** (`media_nodes` tabela) omogućava da se kamere
   raspoređuju na više streaming servera po regionu/kapacitetu — to je
   "scalable streaming" deo zahteva.
3. **Stream autorizacija preko tokena** (`camera_stream_tokens`), ne preko
   golog URL-a — bez ovoga svaka kamera je javno dostupna svakome ko pogodi
   URL šablon.
4. **RBAC na dva nivoa**: role (šta korisnik sme uopšte) + operator
   assignment (koje site-ove/kamere trenutno pokriva) — jer u monitoring
   centru operateri rotiraju smene i klijente.
5. **Audit i camera-view logovi su odvojeni** od običnih application logova —
   to su regulatorno osetljivi podaci, append-only, sopstveni retention.

---

## 4. Faze razvoja

Svaka faza je samostalno testabilna i ne ruši prethodnu.

### Faza 0 — Priprema (bez vidljivih promena za korisnika)
- Migracija šeme: uvođenje `organizations`, `sites`, dodavanje
  `organization_id`/`site_id` na `cameras` i popunjavanje za postojeće podatke
  (jedna "default" organizacija + jedan "default" site za trenutne kamere).
- Uvođenje `users`, `roles`, `permissions` uz mapiranje postojećih naloga.
- Bez promene u UI-ju — cilj je da stari dashboard nastavi da radi dok se
  baza priprema ispod.

### Faza 1 — Multi-tenant osnove
- CRUD za organizacije i site-ove (platform admin panel).
- Kamere se kreiraju u kontekstu site-a; API zahtevi obavezno nose
  `organization_id` iz JWT-a, uz RLS uključen.
- Osnovni RBAC middleware u API sloju (provera role pre svake operacije).

### Faza 2 — Operatorsko iskustvo
- `operator_assignments`: dodela operatera site-ovima/kamerama.
- Live grid filtriran po dodeljenim site-ovima operatera.
- `camera_view_logs`: beleženje početka/kraja gledanja svake kamere.
- Uvođenje `camera_stream_tokens` — stream URL prestaje da bude pogodljiv.

### Faza 3 — Snapshot i snimanje
- Endpoint za ručni snapshot (`snapshots` tabela + upload u object storage).
- Event-based recording pipeline: kada dođe event, worker pokreće snimanje
  segmenta na media node-u i upisuje `recordings` red.
- Retention job (briše/arhivira snimke posle `retention_days`).

### Faza 4 — Alarm/event menadžment
- `events` + `event_types` + `incidents` + `incident_activity_log`.
- Radni tok incidenta: new → acknowledged → in_progress → resolved/false_alarm.
- Dodela operateru, notifikacije (email/SMS) preko `notification_rules`.

### Faza 5 — Skalabilan streaming
- `media_nodes` registry + health heartbeat.
- Automatska dodela nove kamere node-u sa slobodnim kapacitetom po regionu.
- Load balancer/DNS geo-routing ispred media node-ova.
- Read replika baze za izveštaje/audit upite (da ne opterećuju operativnu bazu).

### Faza 6 — Usklađenost i otvrdnjavanje (hardening)
- Kompletan `audit_logs` na svim osetljivim akcijama (izvoz snimka, brisanje
  kamere, promena role...).
- Penetraciono testiranje tenant izolacije (pokušaj pristupa tuđoj kameri/API-ju).
- Rate limiting, alerting na neuspele login pokušaje, SLA monitoring po media node-u.

### Faza 7 — Napredne mogućnosti (opciono)
- AI analitika (prepoznavanje objekata/lica, line-crossing) kao dodatni
  izvor eventova.
- Mobilna aplikacija za operatere/klijente.
- Zaseban customer-facing portal (van operator konzole) sa ograničenim
  ovlašćenjima.
- Planovi/naplata vezani za broj kamera i site-ova (`subscriptions` tabela je
  već pripremljena).

---

## 5. Šta NIJE urađeno u ovom koraku

Ovaj dokument je isključivo plan. Sledeći koraci (kada ih odobriš) bi bili:
1. Napraviti migracioni SQL fajl za Fazu 0 nad postojećom bazom.
2. Definisati tačan RBAC permission set (lista `permissions.key` vrednosti).
3. Dizajnirati API ugovore (request/response) za nove entitete.
4. Tek onda početi implementaciju, fazu po fazu.

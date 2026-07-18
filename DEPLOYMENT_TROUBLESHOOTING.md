# Deployment Guide & Troubleshooting

## Prerequisites

- Node.js 18+ (for local development)
- PostgreSQL 14+ database
- Supabase project (or any PostgreSQL-compatible database)
- Vercel account (for deployment)

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db`) |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase (Settings → API → JWT Secret) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_BUCKET` | S3/R2 bucket name | - |
| `STORAGE_ACCESS_KEY_ID` | Storage access key | - |
| `STORAGE_SECRET_ACCESS_KEY` | Storage secret key | - |
| `STORAGE_ENDPOINT` | S3-compatible endpoint (R2, MinIO, etc.) | AWS default |
| `STORAGE_PUBLIC_BASE_URL` | Public URL prefix for storage | Required for uploads |
| `ALLOW_AUTO_ORG_ADMIN` | Allow auto-creation of org_admin users | `false` (secure default) |
| `PAYPAL_ENVIRONMENT` | PayPal environment (`sandbox` or `live`) | `live` |
| `PAYPAL_LIVE_CLIENT_ID` | PayPal live client ID | - |
| `PAYPAL_LIVE_CLIENT_SECRET` | PayPal live secret | - |

## Database Setup

Run migrations against your PostgreSQL database:

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

## Troubleshooting

### 503 Errors on /api/cameras and /api/incidents

Check the health endpoint to diagnose:

```
https://your-domain.vercel.app/api/health
```

This returns a diagnostic response showing which environment variables are missing.

### Common Issues

1. **DATABASE_URL missing**: Set the PostgreSQL connection string
2. **SUPABASE_JWT_SECRET missing**: Set from Supabase dashboard
3. **has_default_organization: false**: Run the migrations against your database
4. **Storage not configured**: Set STORAGE_* variables or storage features won't work

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Local Development

```bash
npm install
npm run dev
```

The dev server mounts all `api/*.js` handlers on the same path rules as Vercel.

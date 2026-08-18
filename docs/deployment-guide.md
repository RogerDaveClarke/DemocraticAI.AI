# Parliament Explorer Deployment Guide
_Updated: 2026-08-12_

## Architecture

- Cloud Run frontend service (`parliament-frontend`)
- Cloud Run API service (`oireachtas-api`) — Express/TypeScript, Node 18
- Cloud Run ingestion job
- Cloud Scheduler weekly trigger
- BigQuery retrieval dataset (`parliamentary_data`)
- Firestore for chat history, feature overrides, access requests, and usage metrics
- Firebase Auth with TOTP MFA enforcement
- Firebase Remote Config for global feature flags
- Resend for transactional email (`noreply@example.com`)

## Current service URLs

| Service | URL |
|---------|-----|
| API | `https://your-api-service-url.run.app` |
| Frontend (stale) | `https://your-frontend-service-url.run.app` |
| Firebase project | `your-project-id` |
| Region | `us-west1` |

## Required environment variables (Cloud Run API)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Set to `8080` |
| `GOOGLE_CLOUD_PROJECT` | Yes | GCP project ID |
| `RESEND_API_KEY` | Yes | Transactional email via Resend |
| `VALID_API_KEYS` | Yes | Comma-separated keys for `/api/chat` |
| `JWT_SECRET` | Yes | JWT signing secret (use Secret Manager) |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh secret (use Secret Manager) |
| `ADMIN_NOTIFICATION_EMAIL` | No | Override admin notification address (default: `admin@example.com`) |
| `ALLOWED_ORIGINS` | No | Comma-separated extra CORS origins |
| `RATE_LIMIT_MAX_REQUESTS` | No | General rate limit max (default: 100 per 15 min) |
| `CHAT_RATE_LIMIT_MAX` | No | Chat endpoint rate limit max (default: 20 per 15 min) |

## First-time setup

### 1. Deploy services

```powershell
# API
gcloud run deploy oireachtas-api --region us-west1 --source cloud-run-api

# Frontend
gcloud run deploy parliament-frontend --region us-west1 --source .
```

### 2. Set required env vars

```powershell
gcloud run services update oireachtas-api --region us-west1 `
  --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=your-project-id" `
  --set-secrets "JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh-secret:latest" `
  --set-env-vars "RESEND_API_KEY=re_..." `
  --set-env-vars "VALID_API_KEYS=your-api-key"
```

### 3. Enable TOTP MFA at project level

```bash
node scripts/enable-totp-mfa.mjs
```

### 4. Set admin custom claim

```bash
node scripts/set-admin-claim.mjs admin@example.com
```

Sign out and back in after this step for the new JWT to include the `admin:true` claim.

### 5. Verify email (if not already verified)

```bash
node scripts/verify-email.mjs admin@example.com
```

## Validate deployment

```powershell
# Health check
Invoke-RestMethod https://your-api-service-url.run.app/health

# Admin API (requires signed-in admin token)
gcloud run services list --region=us-west1 --project=your-project-id
```

## Adapter settings

- `PARLIAMENT_ADAPTER` — current: `oireachtas`
- `PARLIAMENT_NAME` — current: `Irish Parliament`
- `PARLIAMENT_API_BASE_URL` — current: `https://api.oireachtas.ie/v1`
- `PARLIAMENT_DATA_SOURCE` — descriptive label shown in UI

## Adding a new CORS origin (e.g. custom domain)

No redeployment required:
```powershell
gcloud run services update oireachtas-api --region us-west1 `
  --set-env-vars "ALLOWED_ORIGINS=https://your-domain.com"
```

## Dependency notes

- `firebase-admin` is pinned to `^12.7.0` — do not upgrade to v13+ without testing. v13+ bundles `jwks-rsa@4` which requires `jose@6` (ESM-only) and crashes the CJS Node.js server at startup.
- `resend` npm SDK is intentionally absent. Transactional email uses native `fetch()` to the Resend REST API to avoid the jose ESM conflict chain.

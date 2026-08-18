# Deployment Guide

## Isolation guarantee

A clone must use a GCP project, Firebase tenant, service accounts, domains, API keys, and optional third-party accounts owned by its operator. No production project ID, service URL, administrator identity, or sender identity is a runtime default.

Run this before release:

```powershell
npm ci
npm run check:clone-isolation
npm run typecheck
npm run build
Push-Location cloud-run-api
npm ci
npm run build
Pop-Location
```

An unconfigured frontend build and an unconfigured API startup are expected to fail.

## Canonical bootstrap

### Windows

```powershell
./scripts/bootstrap-gcp.ps1 `
  -ProjectId "your-gcp-project-id" `
  -AdminEmail "admin@example.com" `
  -Region "us-west1" `
  -BillingAccount "XXXXXX-XXXXXX-XXXXXX" `
  -ParliamentAdapter "oireachtas" `
  -ParliamentName "Irish Parliament" `
  -ParliamentApiBaseUrl "https://api.oireachtas.ie/v1"
```

### Linux or macOS

```bash
PROJECT_ID=your-gcp-project-id \
ADMIN_EMAIL=admin@example.com \
REGION=us-west1 \
BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX \
./scripts/bootstrap-gcp.sh
```

The official Oireachtas API URL is a public source default, not a private tenant resource.

## Provisioned resources

- Firebase and Identity Platform
- Passwordless Email Link authentication and TOTP
- Initial passwordless administrator
- Firestore
- BigQuery dataset
- Vertex AI access
- Cloud Run frontend and API
- Dedicated API and ingestion service accounts
- Ingestion job and weekly scheduler
- Generated, ignored `.env.production`

## Optional third-party services

Authentication email is sent by Firebase. Resend notifications are disabled unless all of these are configured on the API service:

- `RESEND_API_KEY`, preferably from Secret Manager
- `EMAIL_FROM`, using a domain verified by the operator
- `ADMIN_NOTIFICATION_EMAIL`
- `SUPPORT_EMAIL`

Google Analytics remains disabled when `VITE_GA_MEASUREMENT_ID` is blank. Supabase is not required by the active deployment path.

## Production migration

Do not remove configuration from a live revision. Deploy and validate the parameterized path in a disposable project first. Then configure production through the same bootstrap/deployment interface and retain the previous Cloud Run revisions for rollback.

Rotate any API key or third-party credential that was previously committed only after the replacement production frontend and API are live together.

## Clean transfer to a new repository

After the clone-safety changes are committed and validated, export only the resulting tree, not this repository's history:

```powershell
New-Item -ItemType Directory ../democraticai-clean

git archive HEAD | tar -x -C ../democraticai-clean
Push-Location ../democraticai-clean
git init
git add .
git commit -m "Initial clean import"
Pop-Location
```

Before pushing the new repository, verify that `.env.production` is absent and run `npm run check:clone-isolation`. Configure the new repository's CI credentials through GitHub environments or workload identity federation, never committed files.

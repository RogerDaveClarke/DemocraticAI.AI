# GCP Setup Guide (Current Runtime)
_Updated: 2026-07-10_

This project now uses a two-service Cloud Run model plus a Cloud Run ingestion job.

## Runtime topology

- Public frontend Cloud Run service
- Public API Cloud Run service
- Cloud Run Job for ingestion
- Cloud Scheduler job triggering ingestion weekly
- BigQuery dataset for parliamentary retrieval context
- Firestore for chat history and metrics
- Vertex AI Gemini for answer generation

## Recommended setup path

Use bootstrap scripts from repository root.

### Windows

```powershell
./scripts/bootstrap-gcp.ps1 `
	-ProjectId "<YOUR_PROJECT_ID>" `
	-Region "us-west1" `
	-BillingAccount "<BILLING_ACCOUNT_ID>" `
	-ParliamentAdapter "oireachtas" `
	-ParliamentName "Irish Parliament" `
	-ParliamentApiBaseUrl "https://api.oireachtas.ie/v1"
```

### Linux/macOS

```bash
PROJECT_ID=<YOUR_PROJECT_ID> \
REGION=us-west1 \
BILLING_ACCOUNT=<BILLING_ACCOUNT_ID> \
PARLIAMENT_ADAPTER=oireachtas \
PARLIAMENT_NAME="Irish Parliament" \
PARLIAMENT_API_BASE_URL=https://api.oireachtas.ie/v1 \
./scripts/bootstrap-gcp.sh
```

## Adapter configuration

- `PARLIAMENT_ADAPTER`
- `PARLIAMENT_NAME`
- `PARLIAMENT_API_BASE_URL`
- `PARLIAMENT_DATA_SOURCE`

Current ingester support is `PARLIAMENT_ADAPTER=oireachtas`.

## Bootstrap outputs

- API URL
- Frontend URL
- BigQuery dataset
- Scheduler job name and cron

The script also generates `.env.production` aligned with deployed runtime values.

# GCP Deployment Guide

This is the current deployment reference for Parliament Explorer.

## Recommended deployment method

Use bootstrap scripts at repository root.

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

## What gets provisioned

- Cloud Run API and frontend services
- Cloud Run ingestion job
- Cloud Scheduler ingestion trigger
- BigQuery dataset for parliamentary retrieval
- Firebase + Firestore foundations

## Required adapter variables

- `PARLIAMENT_ADAPTER`
- `PARLIAMENT_NAME`
- `PARLIAMENT_API_BASE_URL`
- `PARLIAMENT_DATA_SOURCE`

Current adapter implementation: `oireachtas`.

## Post-deploy checks

```bash
gcloud run services list --region=us-west1 --project=<YOUR_PROJECT_ID>
gcloud run jobs list --region=us-west1 --project=<YOUR_PROJECT_ID>
gcloud scheduler jobs list --location=us-west1 --project=<YOUR_PROJECT_ID>
curl https://<YOUR_API_SERVICE_URL>/api/data-status
```

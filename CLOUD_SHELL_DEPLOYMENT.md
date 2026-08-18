# Cloud Shell Deployment Guide

Use this guide to bootstrap the platform directly from Cloud Shell.

## 1. Open Cloud Shell and clone

```bash
git clone https://github.com/RogerDaveClarke/Parliament.git
cd Parliament
```

## 2. Set project and run bootstrap

```bash
export PROJECT_ID=<YOUR_PROJECT_ID>
export REGION=us-west1
export BILLING_ACCOUNT=<BILLING_ACCOUNT_ID>

gcloud config set project $PROJECT_ID

PROJECT_ID=$PROJECT_ID \
REGION=$REGION \
BILLING_ACCOUNT=$BILLING_ACCOUNT \
PARLIAMENT_ADAPTER=oireachtas \
PARLIAMENT_NAME="Irish Parliament" \
PARLIAMENT_API_BASE_URL=https://api.oireachtas.ie/v1 \
./scripts/bootstrap-gcp.sh
```

## 3. Validate deployment

```bash
gcloud run services list --region=us-west1 --project=<YOUR_PROJECT_ID>
gcloud run jobs list --region=us-west1 --project=<YOUR_PROJECT_ID>
gcloud scheduler jobs list --location=us-west1 --project=<YOUR_PROJECT_ID>
curl https://<YOUR_API_SERVICE_URL>/api/data-status
```

## Optional: CI/CD triggers

If desired, configure Cloud Build triggers after bootstrap to automate redeployments.

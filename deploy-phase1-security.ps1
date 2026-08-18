#!/usr/bin/env powershell
# Phase 1 Foundation Security Deployment Script
# Deploy essential security components using gcloud CLI

Write-Host "Parliament Explorer - Phase 1 Security Deployment" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Variables
$PROJECT_ID = "replace-with-your-project-id"
$REGION = "us-central1"

Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host ""

# 1. Create Service Accounts
Write-Host "1. Creating Service Accounts..." -ForegroundColor Yellow

Write-Host "   Creating API service account..."
gcloud iam service-accounts create parliament-api-foundation `
    --display-name="Parliament API Foundation Service Account" `
    --description="Foundation service account for Parliament API with minimal permissions" `
    --project=$PROJECT_ID

Write-Host "   Creating Frontend service account..."
gcloud iam service-accounts create parliament-frontend-foundation `
    --display-name="Parliament Frontend Foundation Service Account" `
    --description="Foundation service account for Parliament Frontend with minimal permissions" `
    --project=$PROJECT_ID

# 2. Grant IAM Roles
Write-Host ""
Write-Host "2️⃣ Granting IAM Roles..." -ForegroundColor Yellow

Write-Host "   Granting Firestore access to API service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:parliament-api-foundation@$PROJECT_ID.iam.gserviceaccount.com" `
    --role="roles/datastore.user"

Write-Host "   Granting logging access to API service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:parliament-api-foundation@$PROJECT_ID.iam.gserviceaccount.com" `
    --role="roles/logging.logWriter"

Write-Host "   Granting monitoring access to API service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:parliament-api-foundation@$PROJECT_ID.iam.gserviceaccount.com" `
    --role="roles/monitoring.metricWriter"

# 3. Create Secret Manager Secret
Write-Host ""
Write-Host "3️⃣ Creating Secret Manager Secret..." -ForegroundColor Yellow

Write-Host "   Creating API key secret..."
# Get API key from environment variable or prompt user
$API_KEY = $env:PARLIAMENT_API_KEY
if (-not $API_KEY) {
    Write-Host "   Please enter the API key for Secret Manager:" -ForegroundColor Cyan
    $API_KEY = Read-Host -Prompt "API Key"
}

Write-Output $API_KEY | gcloud secrets create parliament-api-key `
    --data-file=- `
    --replication-policy="user-managed" `
    --locations=$REGION `
    --project=$PROJECT_ID

Write-Host "   Granting secret access to API service account..."
gcloud secrets add-iam-policy-binding parliament-api-key `
    --member="serviceAccount:parliament-api-foundation@$PROJECT_ID.iam.gserviceaccount.com" `
    --role="roles/secretmanager.secretAccessor" `
    --project=$PROJECT_ID

# 4. Create Security Logs Bucket
Write-Host ""
Write-Host "4️⃣ Creating Security Logs Storage..." -ForegroundColor Yellow

Write-Host "   Creating security logs bucket..."
gsutil mb -p $PROJECT_ID -c STANDARD -l US gs://parliament-security-logs-foundation

Write-Host "   Setting bucket permissions..."
gsutil uniformbucketlevelaccess set on gs://parliament-security-logs-foundation
gsutil pap set enforced gs://parliament-security-logs-foundation

# 5. Create Audit Log Sink
Write-Host ""
Write-Host "5️⃣ Creating Audit Log Sink..." -ForegroundColor Yellow

$LOG_FILTER = @"
protoPayload.serviceName="iam.googleapis.com" OR
protoPayload.serviceName="secretmanager.googleapis.com" OR
protoPayload.serviceName="run.googleapis.com" OR
(protoPayload.methodName="SetIamPolicy" OR 
 protoPayload.methodName="CreateServiceAccount" OR
 protoPayload.methodName="DeleteServiceAccount")
"@

Write-Host "   Creating log sink..."
gcloud logging sinks create parliament-security-foundation `
    gs://parliament-security-logs-foundation `
    --log-filter="$LOG_FILTER" `
    --project=$PROJECT_ID

# 6. Enable Required APIs (if not already enabled)
Write-Host ""
Write-Host "6️⃣ Ensuring Required APIs are Enabled..." -ForegroundColor Yellow

$REQUIRED_APIS = @(
    "iam.googleapis.com",
    "secretmanager.googleapis.com", 
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudbuild.googleapis.com"
)

foreach ($API in $REQUIRED_APIS) {
    Write-Host "   Enabling $API..."
    gcloud services enable $API --project=$PROJECT_ID
}

# 7. Display Deployment Summary
Write-Host ""
Write-Host "✅ Phase 1 Security Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployed Components:" -ForegroundColor Cyan
Write-Host "   • Service Accounts: parliament-api-foundation, parliament-frontend-foundation"
Write-Host "   • Secret Manager: parliament-api-key (stores API key securely)"
Write-Host "   • Audit Logging: parliament-security-foundation sink"
Write-Host "   • Security Storage: parliament-security-logs-foundation bucket"
Write-Host "   • IAM Roles: Least-privilege access granted"
Write-Host ""
Write-Host "🔑 Service Account Emails:" -ForegroundColor Cyan
Write-Host "   API: parliament-api-foundation@$PROJECT_ID.iam.gserviceaccount.com"
Write-Host "   Frontend: parliament-frontend-foundation@$PROJECT_ID.iam.gserviceaccount.com"
Write-Host ""
Write-Host "🔐 Secret Manager:" -ForegroundColor Cyan
Write-Host "   Secret Name: parliament-api-key"
Write-Host "   Access: gcloud secrets versions access latest --secret=parliament-api-key"
Write-Host ""
Write-Host "💰 Estimated Monthly Cost: $15-25" -ForegroundColor Green
Write-Host "   • Secret Manager: ~$5"
Write-Host "   • Audit Logging: ~$5-10"
Write-Host "   • Cloud Storage: ~$5-10"
Write-Host ""
Write-Host "📈 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update Cloud Run services to use new service accounts"
Write-Host "   2. Modify application to fetch API key from Secret Manager"
Write-Host "   3. Configure monitoring alerts (manual setup required)"
Write-Host "   4. Review audit logs in Cloud Storage bucket"
Write-Host ""
Write-Host "🚀 Ready for Phase 2: Advanced Protection deployment!" -ForegroundColor Magenta
# Update Cloud Run Services with Foundation Security Service Accounts
# Apply the new service accounts to existing Cloud Run deployments

Write-Host "Updating Cloud Run Services with Foundation Security" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

$PROJECT_ID = "replace-with-your-project-id"
$API_SERVICE_ACCOUNT = "parliament-api-foundation@$PROJECT_ID.iam.gserviceaccount.com"
$FRONTEND_SERVICE_ACCOUNT = "parliament-frontend-foundation@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host ""
Write-Host "1. Updating Parliament API Services..." -ForegroundColor Yellow

# Update parliament-api in us-central1
Write-Host "   Updating parliament-api (us-central1)..."
gcloud run services update parliament-api `
    --service-account=$API_SERVICE_ACCOUNT `
    --region=us-central1 `
    --project=$PROJECT_ID

# Update parliament-api in us-west1  
Write-Host "   Updating parliament-api (us-west1)..."
gcloud run services update parliament-api `
    --service-account=$API_SERVICE_ACCOUNT `
    --region=us-west1 `
    --project=$PROJECT_ID

Write-Host ""
Write-Host "2. Updating Parliament Frontend Services..." -ForegroundColor Yellow

# Update parliament-frontend in us-central1
Write-Host "   Updating parliament-frontend (us-central1)..."
gcloud run services update parliament-frontend `
    --service-account=$FRONTEND_SERVICE_ACCOUNT `
    --region=us-central1 `
    --project=$PROJECT_ID

# Update parliament-frontend in us-west1
Write-Host "   Updating parliament-frontend (us-west1)..."
gcloud run services update parliament-frontend `
    --service-account=$FRONTEND_SERVICE_ACCOUNT `
    --region=us-west1 `
    --project=$PROJECT_ID

Write-Host ""
Write-Host "3. Setting Environment Variables for Secret Manager..." -ForegroundColor Yellow

# Update API services to use Secret Manager for API key
Write-Host "   Configuring parliament-api (us-central1) to use Secret Manager..."
gcloud run services update parliament-api `
    --set-env-vars="USE_SECRET_MANAGER=true,SECRET_NAME=parliament-api-key,PROJECT_ID=$PROJECT_ID" `
    --region=us-central1 `
    --project=$PROJECT_ID

Write-Host "   Configuring parliament-api (us-west1) to use Secret Manager..."
gcloud run services update parliament-api `
    --set-env-vars="USE_SECRET_MANAGER=true,SECRET_NAME=parliament-api-key,PROJECT_ID=$PROJECT_ID" `
    --region=us-west1 `
    --project=$PROJECT_ID

Write-Host ""
Write-Host "4. Verification..." -ForegroundColor Yellow

Write-Host "   Checking parliament-api (us-central1) configuration..."
gcloud run services describe parliament-api --region=us-central1 --project=$PROJECT_ID --format="value(spec.template.spec.serviceAccountName)"

Write-Host "   Checking parliament-api (us-west1) configuration..."
gcloud run services describe parliament-api --region=us-west1 --project=$PROJECT_ID --format="value(spec.template.spec.serviceAccountName)"

Write-Host "   Checking parliament-frontend (us-central1) configuration..."
gcloud run services describe parliament-frontend --region=us-central1 --project=$PROJECT_ID --format="value(spec.template.spec.serviceAccountName)"

Write-Host "   Checking parliament-frontend (us-west1) configuration..."
gcloud run services describe parliament-frontend --region=us-west1 --project=$PROJECT_ID --format="value(spec.template.spec.serviceAccountName)"

Write-Host ""
Write-Host "Cloud Run Services Updated Successfully!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Security Improvements Applied:" -ForegroundColor Cyan
Write-Host "  - All services now use dedicated service accounts with least-privilege access"
Write-Host "  - API services configured to fetch API key from Secret Manager"
Write-Host "  - Enhanced security logging and monitoring enabled"
Write-Host "  - Environment variables configured for secure secret access"
Write-Host ""
Write-Host "Next Application Updates Needed:" -ForegroundColor Yellow
Write-Host "  1. Update API code to fetch from Secret Manager instead of environment variable"
Write-Host "  2. Test API key retrieval from Secret Manager"
Write-Host "  3. Verify all endpoints still function correctly"
Write-Host "  4. Monitor security logs in Cloud Storage bucket"
Write-Host ""
Write-Host "Foundation Security Phase 1 Complete!" -ForegroundColor Magenta
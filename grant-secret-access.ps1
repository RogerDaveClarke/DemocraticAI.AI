# Grant Foundation Service Account Access to All Existing Secrets
# This ensures the new secure service account can access all required secrets

Write-Host "Granting Secret Manager Access to Foundation Service Account" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green

$PROJECT_ID = "replace-with-your-project-id"
$API_SERVICE_ACCOUNT = "parliament-api-foundation@$PROJECT_ID.iam.gserviceaccount.com"

$SECRETS = @(
    "allowed-emails",
    "google-client-id",
    "google-client-secret", 
    "jwt-secret",
    "microsoft-client-id",
    "microsoft-client-secret",
    "microsoft-tenant-id",
    "parliament-api-key"
)

Write-Host ""
Write-Host "Granting access to secrets for API service account..." -ForegroundColor Yellow

foreach ($SECRET in $SECRETS) {
    Write-Host "   Granting access to $SECRET..."
    gcloud secrets add-iam-policy-binding $SECRET `
        --member="serviceAccount:$API_SERVICE_ACCOUNT" `
        --role="roles/secretmanager.secretAccessor" `
        --project=$PROJECT_ID
}

Write-Host ""
Write-Host "Secret Manager Permissions Updated Successfully!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "The foundation service account now has access to all required secrets:" -ForegroundColor Cyan
foreach ($SECRET in $SECRETS) {
    Write-Host "  - $SECRET"
}
Write-Host ""
Write-Host "Now attempting to redeploy Cloud Run services..." -ForegroundColor Yellow
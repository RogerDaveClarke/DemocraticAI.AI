# Deploy Oireachtas Data Ingestion Cloud Function
# This will deploy the updated function that includes photo URLs and proper active status

$PROJECT_ID = "parliament-explorer"
$REGION = "us-west1"
$FUNCTION_NAME = "ingest-oireachtas-data"

Write-Host "Deploying Oireachtas Data Ingestion Cloud Function..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Gray
Write-Host "Region: $REGION" -ForegroundColor Gray
Write-Host "Function: $FUNCTION_NAME" -ForegroundColor Gray

# Change to the cloud function directory
Push-Location cloud-functions/oireachtas-ingester

try {
    # Deploy the enhanced version
    Write-Host "`nDeploying enhanced ingester with photo URL support..." -ForegroundColor Yellow
    
    gcloud functions deploy $FUNCTION_NAME `
        --gen2 `
        --runtime=python311 `
        --region=$REGION `
        --source=. `
        --entry-point=ingest_oireachtas_data `
        --trigger-http `
        --allow-unauthenticated `
        --timeout=540s `
        --memory=512MB `
        --set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJECT_ID
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDeployment successful!" -ForegroundColor Green
        Write-Host "`nFunction URL: https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME" -ForegroundColor Cyan
        
        Write-Host "`nTo trigger the ingestion, run:" -ForegroundColor Yellow
        Write-Host "  .\scripts\trigger-ingestion.ps1" -ForegroundColor Gray
    } else {
        Write-Host "`nDeployment failed!" -ForegroundColor Red
        exit 1
    }
    
} finally {
    Pop-Location
}

# Script to trigger Oireachtas data ingestion Cloud Function
# This will fetch and update all member data including photos and active status

$CLOUD_FUNCTION_URL = "http://localhost:8080"

Write-Host "Triggering Oireachtas data ingestion..." -ForegroundColor Cyan
Write-Host "This will update all member data including photos and active status" -ForegroundColor Yellow

try {
    # Get authentication token
    $token = gcloud auth print-identity-token
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $CLOUD_FUNCTION_URL -Method Post -Headers $headers
    
    Write-Host "`nIngestion completed successfully!" -ForegroundColor Green
    Write-Host "Duration: $($response.metadata.duration_seconds) seconds" -ForegroundColor Gray
    Write-Host "Members updated: $($response.metadata.counts.members)" -ForegroundColor Gray
    Write-Host "Parties updated: $($response.metadata.counts.parties)" -ForegroundColor Gray
    Write-Host "Houses updated: $($response.metadata.counts.houses)" -ForegroundColor Gray
    Write-Host "Constituencies updated: $($response.metadata.counts.constituencies)" -ForegroundColor Gray
    
} catch {
    Write-Host "`nError triggering ingestion:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
    
    exit 1
}

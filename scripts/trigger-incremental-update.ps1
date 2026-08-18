# Trigger incremental update for Oireachtas data (last 7 days)
# This is much faster and cheaper than full ingestion

$functionUrl = "http://localhost:8080"

Write-Host "Triggering incremental data update (last 7 days)..." -ForegroundColor Cyan
Write-Host "This will update votes, questions, debates, and bill status changes`n"

$body = @{
    type = "incremental"
    days_back = 7
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $functionUrl -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300
    
    Write-Host "`nUpdate completed successfully!" -ForegroundColor Green
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "  Duration: $($response.metadata.duration_seconds) seconds"
    Write-Host "  Bills updated: $($response.metadata.counts.bills)"
    Write-Host "  Votes updated: $($response.metadata.counts.votes)"
    Write-Host "  Questions updated: $($response.metadata.counts.questions)"
    Write-Host "  Debates updated: $($response.metadata.counts.debates)"
    
} catch {
    Write-Host "`nError during update:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

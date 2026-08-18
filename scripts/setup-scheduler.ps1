# Cloud Scheduler Setup for Automatic Daily Updates
# This keeps your parliamentary data fresh with minimal cost

# Cost estimate: ~$0.10/month for scheduler + ~$0.05/day for function execution
# Total: ~$1.60/month for daily automated updates

Write-Host "Setting up Cloud Scheduler for daily incremental updates..." -ForegroundColor Cyan
Write-Host ""

$projectId = "replace-with-your-project-id"
$region = "us-west1"
$functionUrl = "http://localhost:8080"

# Create Cloud Scheduler job for daily incremental updates
Write-Host "Creating scheduler job: daily-parliament-update" -ForegroundColor Yellow

gcloud scheduler jobs create http daily-parliament-update `
    --location=$region `
    --schedule="0 2 * * *" `
    --uri=$functionUrl `
    --http-method=POST `
    --headers="Content-Type=application/json" `
    --message-body='{\"type\":\"incremental\",\"days_back\":7}' `
    --time-zone="Europe/Dublin" `
    --description="Daily incremental update for Oireachtas data (votes, questions, debates)" `
    --project=$projectId

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Scheduler created successfully!" -ForegroundColor Green
    Write-Host "`nSchedule: Daily at 2:00 AM Dublin time"
    Write-Host "Updates: Last 7 days of votes, questions, debates, bill changes"
    Write-Host "`nTo manually trigger: gcloud scheduler jobs run daily-parliament-update --location=$region"
    Write-Host "To pause: gcloud scheduler jobs pause daily-parliament-update --location=$region"
    Write-Host "To resume: gcloud scheduler jobs resume daily-parliament-update --location=$region"
    Write-Host "To delete: gcloud scheduler jobs delete daily-parliament-update --location=$region"
} else {
    Write-Host "`n✗ Failed to create scheduler" -ForegroundColor Red
    Write-Host "If job already exists, delete it first with:"
    Write-Host "gcloud scheduler jobs delete daily-parliament-update --location=$region"
}

Write-Host "`n"
Write-Host "Optional: Create weekly full refresh job" -ForegroundColor Cyan
Write-Host "This ensures data consistency with a full ingestion once per week:"
Write-Host ""
Write-Host "gcloud scheduler jobs create http weekly-parliament-full-refresh \"
Write-Host "    --location=$region \"
Write-Host "    --schedule=`"0 3 * * 0`" \"
Write-Host "    --uri=$functionUrl \"
Write-Host "    --http-method=POST \"
Write-Host "    --headers=`"Content-Type=application/json`" \"
Write-Host "    --message-body='{`"type`":`"full`"}' \"
Write-Host "    --time-zone=`"Europe/Dublin`" \"
Write-Host "    --description=`"Weekly full data refresh for Oireachtas data`" \"
Write-Host "    --project=$projectId"

# Query Firestore Database
# This script allows you to query your Firestore database from the command line

param(
    [string]$Collection = "members",
    [string]$Filter = "",
    [int]$Limit = 10
)

Write-Host "Querying Firestore Collection: $Collection" -ForegroundColor Cyan

# Use gcloud firestore to query
if ($Filter) {
    Write-Host "Filter: $Filter" -ForegroundColor Gray
    gcloud firestore documents list $Collection --filter="$Filter" --limit=$Limit --format=json | ConvertFrom-Json
} else {
    Write-Host "Getting first $Limit documents..." -ForegroundColor Gray
    gcloud firestore documents list $Collection --limit=$Limit --format=json | ConvertFrom-Json
}

# Examples:
Write-Host "`nExample queries:" -ForegroundColor Yellow
Write-Host "  .\scripts\query-firestore.ps1 -Collection members -Limit 5" -ForegroundColor Gray
Write-Host "  .\scripts\query-firestore.ps1 -Collection members -Filter 'isActive=true' -Limit 10" -ForegroundColor Gray
Write-Host "  .\scripts\query-firestore.ps1 -Collection members -Filter 'fullName:Micheal Martin'" -ForegroundColor Gray

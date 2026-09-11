param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    [string]$Type = "chore",
    [switch]$Push
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
    Write-Host "Not a git repository root." -ForegroundColor Red
    exit 1
}

$commitMessage = "${Type}: $Message"

Write-Host "Staging all changes..." -ForegroundColor Yellow
git add .

Write-Host "Running repository security verification..." -ForegroundColor Yellow
npm run verify:repo-security
if ($LASTEXITCODE -ne 0) {
    Write-Host "Security verification failed. Commit aborted; staged files were not committed." -ForegroundColor Red
    exit 1
}

Write-Host "Committing: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed." -ForegroundColor Red
    exit 1
}

if ($Push) {
    Write-Host "Pushing to remote..." -ForegroundColor Yellow
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "Push completed." -ForegroundColor Green
} else {
    Write-Host "Commit completed. Push not performed by default." -ForegroundColor Green
}

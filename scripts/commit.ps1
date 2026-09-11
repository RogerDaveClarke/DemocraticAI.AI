# Secure Commit Helper for Parliament Explorer
# Fails closed on verification errors and does not push unless requested.

param(
    [string]$Message = "",
    [string]$Type = "chore",
    [switch]$Push,
    [switch]$Build,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host "Secure Git Commit Helper" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\commit.ps1 -Message 'commit message' [-Type 'chore'] [-Build] [-Push]"
    Write-Host ""
    Write-Host "Behavior:"
    Write-Host "  1. Runs npm run verify:repo-security"
    Write-Host "  2. Optionally runs npm run build when -Build is provided"
    Write-Host "  3. Stages and commits all tracked/untracked changes"
    Write-Host "  4. Pushes only when -Push is provided"
    exit
}

if ($Help) {
    Show-Help
}

if (-not (Test-Path ".git")) {
    Write-Host "Error: Not a git repository root." -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host "Error: -Message is required." -ForegroundColor Red
    exit 1
}

if ($Build) {
    Write-Host "Running build..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed. Commit aborted." -ForegroundColor Red
        exit 1
    }
}

$commitMessage = "${Type}: $Message"

Write-Host "Staging all files..." -ForegroundColor Yellow
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
    Write-Host "Commit and push completed." -ForegroundColor Green
} else {
    Write-Host "Commit completed. No push was performed." -ForegroundColor Green
}
# Quick PowerShell script for common commit scenarios
# Simplified version of commit.ps1 for quick operations

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    [string]$Type = "feat",
    [switch]$Push
)

# Simple error handling
$ErrorActionPreference = "Stop"

try {
    # Check if we're in a git repository
    if (-not (Test-Path ".git")) {
        throw "Not a git repository"
    }

    Write-Host "Quick Commit Script" -ForegroundColor Green
    Write-Host "==================" -ForegroundColor Green

    # Build the commit message
    $commitMessage = "${Type}: $Message"
    
    Write-Host "Adding all files..." -ForegroundColor Yellow
    git add .

    Write-Host "Running repository security verification..." -ForegroundColor Yellow
    npm run verify:repo-security
    if ($LASTEXITCODE -ne 0) {
        throw "Security verification failed. Commit aborted; staged files were not committed."
    }
    
    Write-Host "Committing: $commitMessage" -ForegroundColor Yellow
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        $hash = git rev-parse --short HEAD
        Write-Host "✓ Committed successfully! ($hash)" -ForegroundColor Green
        
        if ($Push) {
            Write-Host "Pushing to remote..." -ForegroundColor Yellow
            git push
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Pushed successfully!" -ForegroundColor Green
            } else {
                Write-Host "✗ Push failed!" -ForegroundColor Red
            }
        } else {
            Write-Host "✓ Commit complete. No push performed." -ForegroundColor Green
        }
    } else {
        Write-Host "✗ Commit failed!" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All done! 🎉" -ForegroundColor Green
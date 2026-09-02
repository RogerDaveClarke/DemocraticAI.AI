# Local Deployment Script for Parliament AI (Service + Webfront)
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Local Instance of Parliament AI (Service + Webfront)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

$PROJECT_ROOT = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($PROJECT_ROOT)) {
    $PROJECT_ROOT = Get-Location
}
$API_PATH = Join-Path $PROJECT_ROOT "cloud-run-api"

# 1. Environment files check
$rootEnvLocal = Join-Path $PROJECT_ROOT ".env.local"
$rootEnvExample = Join-Path $PROJECT_ROOT ".env.example"

if (-not (Test-Path $rootEnvLocal)) {
    if (Test-Path $rootEnvExample) {
        Write-Host "⚠️  .env.local not found in root. Copying from .env.example..." -ForegroundColor Yellow
        Copy-Item $rootEnvExample $rootEnvLocal
    } else {
        Write-Host "⚠️  .env.local not found in root." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Root .env.local found" -ForegroundColor Green
}

$apiEnvLocal = Join-Path $API_PATH ".env.local"
$apiEnvExample = Join-Path $API_PATH ".env.example"

if (-not (Test-Path $apiEnvLocal)) {
    if (Test-Path $apiEnvExample) {
        Write-Host "⚠️  cloud-run-api/.env.local not found. Copying from .env.example..." -ForegroundColor Yellow
        Copy-Item $apiEnvExample $apiEnvLocal
    } else {
        Write-Host "⚠️  cloud-run-api/.env.local not found." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ API .env.local found" -ForegroundColor Green
}

# 2. Check dependencies
$rootNodeModules = Join-Path $PROJECT_ROOT "node_modules"
if (-not (Test-Path $rootNodeModules)) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $PROJECT_ROOT
    npm install
    Pop-Location
}

$apiNodeModules = Join-Path $API_PATH "node_modules"
if (-not (Test-Path $apiNodeModules)) {
    Write-Host "📦 Installing API dependencies..." -ForegroundColor Yellow
    Push-Location $API_PATH
    npm install
    Pop-Location
}

# 3. Launch API and Frontend in separate PowerShell windows
Write-Host "⚙️  Starting API service (cloud-run-api) on http://localhost:8080..." -ForegroundColor Cyan
$apiCmd = "Set-Location '$API_PATH'; Write-Host '--- Starting Parliament API Service (Port 8080) ---' -ForegroundColor Cyan; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd

Write-Host "🖥️  Starting Webfront frontend on http://localhost:5173..." -ForegroundColor Cyan
$frontendCmd = "Set-Location '$PROJECT_ROOT'; Write-Host '--- Starting Parliament Webfront (Port 5173) ---' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "`n✅ Both processes launched!" -ForegroundColor Green
Write-Host "   - API Service:   http://localhost:8080" -ForegroundColor White
Write-Host "   - Webfront UI:   http://localhost:5173" -ForegroundColor White
Write-Host "Close the respective PowerShell windows to stop each service.`n" -ForegroundColor Gray

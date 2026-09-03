# Local Deployment Script for Democratic AI (Service + Webfront)
$ErrorActionPreference = "Stop"

Write-Host "[>] Starting Local Instance of Democratic AI (Service + Webfront)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

$SCRIPT_DIR = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($SCRIPT_DIR)) {
    $SCRIPT_DIR = Get-Location
}

if (Test-Path (Join-Path (Split-Path -Parent $SCRIPT_DIR) "cloud-run-api")) {
    $PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
} else {
    $PROJECT_ROOT = $SCRIPT_DIR
}
$API_PATH = Join-Path $PROJECT_ROOT "cloud-run-api"

# 1. Environment files check
$rootEnvLocal = Join-Path $PROJECT_ROOT ".env.local"
$rootEnvExample = Join-Path $PROJECT_ROOT ".env.example"

if (-not (Test-Path $rootEnvLocal)) {
    if (Test-Path $rootEnvExample) {
        Write-Host "[!] .env.local not found in root. Copying from .env.example..." -ForegroundColor Yellow
        Copy-Item $rootEnvExample $rootEnvLocal
    } else {
        Write-Host "[!] .env.local not found in root." -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Root .env.local found" -ForegroundColor Green
    # Ensure local API port is 8080
    $rawContent = Get-Content $rootEnvLocal -Raw
    if ($rawContent -match "VITE_API_URL=http://localhost:3002") {
        Write-Host "[*] Updating VITE_API_URL in root .env.local to http://localhost:8080..." -ForegroundColor Yellow
        $rawContent = $rawContent -replace "VITE_API_URL=http://localhost:3002", "VITE_API_URL=http://localhost:8080"
        $rawContent = $rawContent -replace "VITE_API_BASE_URL=http://localhost:3002", "VITE_API_BASE_URL=http://localhost:8080"
        Set-Content -Path $rootEnvLocal -Value $rawContent -NoNewline
    }
}

$apiEnvLocal = Join-Path $API_PATH ".env.local"
$apiEnvExample = Join-Path $API_PATH ".env.example"

if (-not (Test-Path $apiEnvLocal)) {
    if (Test-Path $apiEnvExample) {
        Write-Host "[!] cloud-run-api/.env.local not found. Copying from .env.example..." -ForegroundColor Yellow
        Copy-Item $apiEnvExample $apiEnvLocal
    } else {
        Write-Host "[!] cloud-run-api/.env.local not found." -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] API .env.local found" -ForegroundColor Green
}

# 2. Check dependencies
$rootNodeModules = Join-Path $PROJECT_ROOT "node_modules"
if (-not (Test-Path $rootNodeModules)) {
    Write-Host "[+] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $PROJECT_ROOT
    npm install
    Pop-Location
}

$apiNodeModules = Join-Path $API_PATH "node_modules"
if (-not (Test-Path $apiNodeModules)) {
    Write-Host "[+] Installing API dependencies..." -ForegroundColor Yellow
    Push-Location $API_PATH
    npm install
    Pop-Location
}

# 3. Check Google Application Default Credentials
# The API uses Firestore and Firebase Admin. Without ADC the sign-in lookup
# fails and no sign-in email is ever sent.
$adcPath = Join-Path $env:APPDATA "gcloud\application_default_credentials.json"
if (-not (Test-Path $adcPath) -and -not $env:GOOGLE_APPLICATION_CREDENTIALS) {
    Write-Host "[!] Google Application Default Credentials not found." -ForegroundColor Yellow
    Write-Host "    Sign-in and any Firestore-backed feature WILL fail until you run:" -ForegroundColor Yellow
    Write-Host "      gcloud auth application-default login" -ForegroundColor White
} else {
    Write-Host "[OK] Google Application Default Credentials found" -ForegroundColor Green
}

# 4. Launch API and Frontend in separate PowerShell windows
Write-Host "[>] Starting API service (cloud-run-api) on http://localhost:8080..." -ForegroundColor Cyan
$apiCmd = "Set-Location '$API_PATH'; Write-Host '--- Starting Democratic AI API Service (Port 8080) ---' -ForegroundColor Cyan; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd

Write-Host "[>] Starting Webfront frontend on http://localhost:5173..." -ForegroundColor Cyan
$frontendCmd = "Set-Location '$PROJECT_ROOT'; Write-Host '--- Starting Democratic AI Webfront (Port 5173) ---' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# 5. Verify both services actually came up
Write-Host ""
Write-Host "[*] Waiting for services to respond..." -ForegroundColor Cyan

function Wait-ForService {
    param([string]$Url, [string]$Name, [int]$TimeoutSeconds = 60)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host "[OK] $Name is up ($Url)" -ForegroundColor Green
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "[X] $Name did NOT come up within $TimeoutSeconds seconds ($Url)" -ForegroundColor Red
    Write-Host "    Check the '$Name' PowerShell window for the startup error." -ForegroundColor Red
    return $false
}

$apiUp = Wait-ForService -Url "http://localhost:8080/health" -Name "API service"
$webUp = Wait-ForService -Url "http://localhost:5173/" -Name "Webfront"

Write-Host ""
if ($apiUp -and $webUp) {
    Write-Host "[OK] Both services are running." -ForegroundColor Green
} else {
    Write-Host "[X] One or more services failed to start. Sign-in will not work until both are up." -ForegroundColor Red
}
Write-Host "   - API Service:   http://localhost:8080" -ForegroundColor White
Write-Host "   - Webfront UI:   http://localhost:5173" -ForegroundColor White
Write-Host "Close the respective PowerShell windows to stop each service." -ForegroundColor Gray
Write-Host ""

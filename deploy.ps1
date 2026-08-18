# Parliament Project Deployment Script
# Ensures all deployments use us-west1 region

$ErrorActionPreference = "Stop"

Write-Host "🚀 Parliament Project Deployment (US-West1)" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$REGION = $env:GCP_REGION
if ([string]::IsNullOrWhiteSpace($REGION)) {
    $REGION = "us-west1"
}

$PROJECT_ID = $env:GCP_PROJECT_ID
if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) {
    $PROJECT_ID = (gcloud config get-value project 2>$null).Trim()
}

$API_SERVICE = $env:API_SERVICE_NAME
if ([string]::IsNullOrWhiteSpace($API_SERVICE)) {
    $API_SERVICE = "parliament-api"
}

$FRONTEND_SERVICE = $env:FRONTEND_SERVICE_NAME
if ([string]::IsNullOrWhiteSpace($FRONTEND_SERVICE)) {
    $FRONTEND_SERVICE = "parliament-frontend"
}
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$API_PATH = Join-Path $PROJECT_ROOT "cloud-run-api"

function Deploy-Frontend {
    Write-Host "📦 Deploying Frontend..." -ForegroundColor Yellow
    Set-Location $PROJECT_ROOT
    
    $apiUrl = gcloud run services describe $API_SERVICE --region=$REGION --project=$PROJECT_ID --format="value(status.url)"

    gcloud run deploy $FRONTEND_SERVICE `
        --source . `
        --region=$REGION `
        --project=$PROJECT_ID `
        --allow-unauthenticated `
        --platform=managed `
        --set-env-vars VITE_API_URL=$apiUrl
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend deployment failed" -ForegroundColor Red
        exit 1
    }
}

function Deploy-API {
    Write-Host "📦 Deploying API..." -ForegroundColor Yellow
    Set-Location $API_PATH
    
    gcloud run deploy $API_SERVICE `
        --source . `
        --region=$REGION `
        --project=$PROJECT_ID `
        --allow-unauthenticated `
        --platform=managed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ API deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ API deployment failed" -ForegroundColor Red
        exit 1
    }
}

function Show-Deployment-Info {
    Write-Host "`n🌐 Deployment Information:" -ForegroundColor Cyan
    Write-Host "Region: $REGION" -ForegroundColor White
    $frontendUrl = gcloud run services describe $FRONTEND_SERVICE --region=$REGION --project=$PROJECT_ID --format="value(status.url)"
    $apiUrl = gcloud run services describe $API_SERVICE --region=$REGION --project=$PROJECT_ID --format="value(status.url)"
    Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Green
    Write-Host "API URL: $apiUrl" -ForegroundColor Green
    Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
    gcloud run services list --region=$REGION --project=$PROJECT_ID
}

function Main {
    param(
        [string]$Service = "all"
    )
    
    Write-Host "🔧 Deploying to region: $REGION" -ForegroundColor Yellow
    
    switch ($Service.ToLower()) {
        "frontend" { Deploy-Frontend }
        "api" { Deploy-API }
        "all" { 
            Deploy-API
            Deploy-Frontend 
        }
        default { 
            Write-Host "Usage: .\deploy.ps1 [frontend|api|all]" -ForegroundColor Red
            exit 1
        }
    }
    
    Show-Deployment-Info
    Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
}

# Run the main function with parameters
Main -Service $args[0]
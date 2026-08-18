# Parliament Project Migration Script (PowerShell)
# Migrates from replace-with-your-project-id (EU) to new US-based project

param(
    [string]$NewProjectId
)

$ErrorActionPreference = "Stop"

Write-Host "🇺🇸 Parliament Project - US Region Migration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Configuration
$OLD_PROJECT = "replace-with-your-project-id"
$NEW_BUCKET = "myparliament-images-us"
$OLD_BUCKET = "myparliament-images"
$REGION = "us-west1"

function Test-GcloudAuth {
    $auth = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if (-not $auth) {
        Write-Host "❌ Please authenticate with gcloud first:" -ForegroundColor Red
        Write-Host "   gcloud auth login" -ForegroundColor Yellow
        exit 1
    }
}

function New-CloudProject {
    if (-not $NewProjectId) {
        $NewProjectId = Read-Host "Enter new project ID (e.g., myparliament-us)"
    }
    
    Write-Host "🔧 Creating new project: $NewProjectId" -ForegroundColor Yellow
    gcloud projects create $NewProjectId
    
    Write-Host "🔧 Setting billing account..." -ForegroundColor Yellow
    $billingAccount = (gcloud billing accounts list --format="value(name)" | Select-Object -First 1)
    gcloud billing projects link $NewProjectId --billing-account=$billingAccount
    
    Write-Host "🔧 Setting project as default..." -ForegroundColor Yellow
    gcloud config set project $NewProjectId
    
    return $NewProjectId
}

function Enable-RequiredAPIs {
    Write-Host "🔧 Enabling required APIs..." -ForegroundColor Yellow
    gcloud services enable run.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable firestore.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable cloudfunctions.googleapis.com
    Write-Host "✅ APIs enabled" -ForegroundColor Green
}

function New-FirestoreDatabase {
    Write-Host "🔧 Creating Firestore database in $REGION..." -ForegroundColor Yellow
    gcloud firestore databases create --location=$REGION
    Write-Host "✅ Firestore database created" -ForegroundColor Green
}

function New-StorageBucket {
    Write-Host "🔧 Creating Cloud Storage bucket: $NEW_BUCKET" -ForegroundColor Yellow
    gsutil mb -l $REGION gs://$NEW_BUCKET
    
    Write-Host "🔧 Setting bucket permissions..." -ForegroundColor Yellow
    gsutil iam ch allUsers:objectViewer gs://$NEW_BUCKET
    Write-Host "✅ Storage bucket created" -ForegroundColor Green
}

function Copy-ProjectData {
    Write-Host "🔧 Copying images from old bucket..." -ForegroundColor Yellow
    gsutil -m cp -r gs://$OLD_BUCKET/* gs://$NEW_BUCKET/
    Write-Host "✅ Images copied" -ForegroundColor Green
    
    Write-Host "📝 Note: Firestore data will need to be exported/imported manually" -ForegroundColor Magenta
    Write-Host "   Use the Firebase console or gcloud firestore export/import commands" -ForegroundColor Magenta
}

function Update-ConfigurationFiles {
    param([string]$ProjectId)
    
    Write-Host "🔧 Updating configuration files..." -ForegroundColor Yellow
    
    $files = @(
        "cloud-run-api\src\index.ts",
        "scripts\upload-party-images.js",
        "scripts\update-member-photos.js",
        "scripts\ingest-data.js"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            $content = $content -replace $OLD_PROJECT, $ProjectId
            $content = $content -replace "myparliament-images", $NEW_BUCKET
            Set-Content $file $content
            Write-Host "✅ Updated $file" -ForegroundColor Green
        } else {
            Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
        }
    }
}

function Export-FirestoreData {
    param([string]$OutputPath = "firestore-export")
    
    Write-Host "🔧 Exporting Firestore data from old project..." -ForegroundColor Yellow
    
    # Switch to old project
    gcloud config set project $OLD_PROJECT
    
    # Create export bucket if needed
    $exportBucket = "gs://myparliament-export-temp"
    gsutil mb $exportBucket 2>$null
    
    # Export data
    gcloud firestore export $exportBucket --async
    
    Write-Host "✅ Firestore export started. Check Cloud Console for progress." -ForegroundColor Green
    Write-Host "   Export location: $exportBucket" -ForegroundColor Cyan
}

function Import-FirestoreData {
    param([string]$ExportPath)
    
    if (-not $ExportPath) {
        $ExportPath = Read-Host "Enter the export path (gs://bucket/path)"
    }
    
    Write-Host "🔧 Importing Firestore data to new project..." -ForegroundColor Yellow
    gcloud firestore import $ExportPath --async
    
    Write-Host "✅ Firestore import started. Check Cloud Console for progress." -ForegroundColor Green
}

function Show-NextSteps {
    param([string]$ProjectId)
    
    Write-Host ""
    Write-Host "🎉 Migration setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Complete Firestore data export/import" -ForegroundColor White
    Write-Host "2. Deploy services to new project:" -ForegroundColor White
    Write-Host "   cd cloud-run-api && gcloud run deploy oireachtas-api --source . --region $REGION" -ForegroundColor Gray
    Write-Host "   cd .. && gcloud run deploy parliament --source . --region $REGION" -ForegroundColor Gray
    Write-Host "3. Test all functionality" -ForegroundColor White
    Write-Host "4. Update DNS/domains to point to new services" -ForegroundColor White
    Write-Host "5. Clean up old project resources" -ForegroundColor White
    Write-Host ""
    Write-Host "New project: $ProjectId" -ForegroundColor Green
    Write-Host "New bucket: gs://$NEW_BUCKET" -ForegroundColor Green
    Write-Host "Region: $REGION" -ForegroundColor Green
}

# Main execution
function Start-Migration {
    Test-GcloudAuth
    
    Write-Host "Starting migration process..." -ForegroundColor Cyan
    $currentProject = gcloud config get-value project
    Write-Host "Current project: $currentProject" -ForegroundColor Gray
    
    $projectId = New-CloudProject
    Enable-RequiredAPIs
    New-FirestoreDatabase
    New-StorageBucket
    Copy-ProjectData
    Update-ConfigurationFiles -ProjectId $projectId
    
    # Ask if user wants to export data now
    $export = Read-Host "Do you want to export Firestore data now? (y/N)"
    if ($export -eq "y" -or $export -eq "Y") {
        Export-FirestoreData
        
        Write-Host "Waiting for export to complete. Check Cloud Console..." -ForegroundColor Yellow
        Read-Host "Press Enter when export is complete"
        
        $importPath = Read-Host "Enter the export path for import (from Cloud Console)"
        gcloud config set project $projectId
        Import-FirestoreData -ExportPath $importPath
    }
    
    Show-NextSteps -ProjectId $projectId
}

# Execute if running as script
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Path) {
    Start-Migration
}
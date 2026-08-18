# Parliament Explorer - GCP Cloud Run Deployment Script (Windows Compatible)
# This script sets up the complete OAuth-only authentication system on Google Cloud Platform

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1",
    
    [Parameter(Mandatory=$false)]
    [string]$AllowedEmails = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSecrets = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Parliament Explorer - GCP Deployment Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Validate gcloud CLI installation
try {
    $gcloudVersion = gcloud version --format="value(Google Cloud SDK)"
    Write-Host "Google Cloud SDK detected: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Error "Google Cloud SDK not found. Please install gcloud CLI."
    exit 1
}

# Set the project
Write-Host "Setting up GCP project: $ProjectId" -ForegroundColor Yellow
gcloud config set project $ProjectId

# Enable required APIs
Write-Host "Enabling required Google Cloud APIs..." -ForegroundColor Yellow
$apis = @(
    "cloudbuild.googleapis.com",
    "run.googleapis.com", 
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com",
    "iamcredentials.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "   Enabling $api..." -ForegroundColor Cyan
    gcloud services enable $api
}

# Create secrets if not skipping
if (-not $SkipSecrets) {
    Write-Host "Setting up OAuth secrets..." -ForegroundColor Yellow
    
    # Google OAuth secrets
    Write-Host "   Please enter your Google OAuth Client ID:" -ForegroundColor Cyan
    $googleClientId = Read-Host
    $googleClientId | gcloud secrets create google-client-id --data-file=-
    
    Write-Host "   Please enter your Google OAuth Client Secret:" -ForegroundColor Cyan
    $googleClientSecret = Read-Host
    $googleClientSecret | gcloud secrets create google-client-secret --data-file=-
    
    # Microsoft OAuth secrets
    Write-Host "   Please enter your Microsoft Azure Client ID:" -ForegroundColor Cyan
    $microsoftClientId = Read-Host
    $microsoftClientId | gcloud secrets create microsoft-client-id --data-file=-
    
    Write-Host "   Please enter your Microsoft Azure Client Secret:" -ForegroundColor Cyan
    $microsoftClientSecret = Read-Host
    $microsoftClientSecret | gcloud secrets create microsoft-client-secret --data-file=-
    
    Write-Host "   Please enter your Microsoft Azure Tenant ID:" -ForegroundColor Cyan
    $microsoftTenantId = Read-Host
    $microsoftTenantId | gcloud secrets create microsoft-tenant-id --data-file=-
    
    # Generate JWT secret
    Write-Host "   Generating secure JWT secret..." -ForegroundColor Cyan
    $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 16)
    $jwtSecret | gcloud secrets create jwt-secret --data-file=-
    
    # Set allowed emails
    if ($AllowedEmails -eq "") {
        Write-Host "   Please enter allowed email addresses (comma-separated):" -ForegroundColor Cyan
        $AllowedEmails = Read-Host
    }
    $AllowedEmails | gcloud secrets create allowed-emails --data-file=-
    
    Write-Host "Secrets created successfully!" -ForegroundColor Green
}

# Create Firestore database
Write-Host "Setting up Firestore database..." -ForegroundColor Yellow
try {
    gcloud firestore databases create --region=$Region --type=firestore-native
    Write-Host "Firestore database created!" -ForegroundColor Green
} catch {
    Write-Host "Firestore database may already exist or creation failed." -ForegroundColor Yellow
}

# Grant Cloud Build permissions to deploy to Cloud Run
Write-Host "Setting up Cloud Build permissions..." -ForegroundColor Yellow
$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$projectNumber@cloudbuild.gserviceaccount.com" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$projectNumber@cloudbuild.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$projectNumber@cloudbuild.gserviceaccount.com" --role="roles/iam.serviceAccountUser"

# Create Cloud Storage bucket for Cloud Build logs
Write-Host "Creating Cloud Build logs bucket..." -ForegroundColor Yellow
try {
    gsutil mb -p $ProjectId -l $Region "gs://$ProjectId-cloudbuild-logs"
    Write-Host "Cloud Build logs bucket created!" -ForegroundColor Green
} catch {
    Write-Host "Cloud Build logs bucket may already exist." -ForegroundColor Yellow
}

# Submit the build
Write-Host "Starting Cloud Build deployment..." -ForegroundColor Yellow
Write-Host "   This will build and deploy both frontend and backend..." -ForegroundColor Cyan

gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION=$Region .

Write-Host "" -ForegroundColor White
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Parliament Explorer is now deployed with OAuth-only authentication!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure OAuth redirect URIs in Google Cloud Console and Azure Portal" -ForegroundColor White
Write-Host "2. Update allowed origins for your Cloud Run frontend URL" -ForegroundColor White
Write-Host "3. Test authentication with your allowed email addresses" -ForegroundColor White
Write-Host "4. Monitor deployment in Cloud Run console" -ForegroundColor White
Write-Host ""
Write-Host "Useful Links:" -ForegroundColor Yellow
Write-Host "   Cloud Run Console: https://console.cloud.google.com/run?project=$ProjectId" -ForegroundColor Cyan
Write-Host "   Cloud Build History: https://console.cloud.google.com/cloud-build/builds?project=$ProjectId" -ForegroundColor Cyan
Write-Host "   Secret Manager: https://console.cloud.google.com/security/secret-manager?project=$ProjectId" -ForegroundColor Cyan
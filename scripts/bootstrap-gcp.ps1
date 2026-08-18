param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[^\s@]+@[^\s@]+\.[^\s@]+$')]
    [string]$AdminEmail,

    [string]$Region = "us-west1",
    [string]$BillingAccount = "",
    [string]$ParliamentAdapter = "oireachtas",
    [string]$ParliamentName = "Irish Parliament",
    [string]$ParliamentApiBaseUrl = "https://api.oireachtas.ie/v1",
    [string]$BqDataset = "parliamentary_data",
    [string]$BqLocation = "US",
    [string]$FirestoreLocation = "nam5",
    [string]$ApiServiceName = "parliament-api",
    [string]$FrontendServiceName = "parliament-frontend",
    [string]$IngestionJobName = "parliament-ingestion-job",
    [string]$SchedulerJobName = "parliament-weekly-ingestion",
    [string]$SchedulerCron = "0 2 * * 1"
)

$ErrorActionPreference = "Stop"

$script:GcloudExecutable = (Get-Command gcloud -ErrorAction Stop).Source
$script:BqExecutable = (Get-Command bq -ErrorAction Stop).Source

function gcloud {
    & $script:GcloudExecutable @args
    if ($LASTEXITCODE -ne 0) { throw "gcloud command failed: $($args -join ' ')" }
}

function bq {
    & $script:BqExecutable @args
    if ($LASTEXITCODE -ne 0) { throw "bq command failed: $($args -join ' ')" }
}

function Require-Command([string]$name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $name"
    }
}

function Info([string]$msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Warn([string]$msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Ok([string]$msg) {
    Write-Host "[OK] $msg" -ForegroundColor Green
}

function Ensure-ApiEnabled([string[]]$apis) {
    foreach ($api in $apis) {
        Info "Enabling API: $api"
        gcloud services enable $api --project $ProjectId | Out-Null
    }
}

function Wait-ServiceAccount([string]$email) {
    for ($attempt = 1; $attempt -le 20; $attempt++) {
        try {
            gcloud iam service-accounts describe $email --project=$ProjectId | Out-Null
            return
        } catch {
            if ($attempt -eq 20) { throw }
            [System.Threading.Thread]::Sleep(1500)
        }
    }
}

function Add-ProjectIamBinding([string]$member, [string]$role) {
    for ($attempt = 1; $attempt -le 20; $attempt++) {
        try {
            gcloud projects add-iam-policy-binding $ProjectId --member=$member --role=$role | Out-Null
            return
        } catch {
            if ($attempt -eq 20) { throw }
            [System.Threading.Thread]::Sleep(1500)
        }
    }
}

function Ensure-Project() {
    Info "Ensuring GCP project exists: $ProjectId"
    $exists = $true
    try {
        gcloud projects describe $ProjectId --format="value(projectId)" | Out-Null
    } catch {
        $exists = $false
    }

    if (-not $exists) {
        gcloud projects create $ProjectId | Out-Null
        Ok "Created project $ProjectId"
    } else {
        Ok "Project exists"
    }

    if ($BillingAccount -ne "") {
        $billingInfo = gcloud beta billing projects describe $ProjectId --format=json | ConvertFrom-Json
        $expectedBillingAccount = "billingAccounts/$BillingAccount"
        if ($billingInfo.billingEnabled -and $billingInfo.billingAccountName -eq $expectedBillingAccount) {
            Ok "Billing account already linked"
        } else {
            Info "Linking billing account"
            gcloud billing projects link $ProjectId --billing-account=$BillingAccount | Out-Null
        }
    } else {
        Warn "No billing account supplied. Ensure billing is linked or deployments may fail."
    }

    gcloud auth application-default set-quota-project $ProjectId | Out-Null
}

function Wait-FirebaseOperation([string]$operationName, [hashtable]$headers) {
    do {
        $operation = Invoke-RestMethod -Method GET -Uri "https://firebase.googleapis.com/v1beta1/$operationName" -Headers $headers
        if ($operation.error) { throw "Firebase operation failed: $($operation.error.message)" }
        if (-not $operation.done) { [System.Threading.Thread]::Sleep(1500) }
    } while (-not $operation.done)
    return $operation.response
}

function Ensure-FirebaseAndFirestore() {
    Info "Ensuring Firebase is attached to project"
    $token = gcloud auth print-access-token
    $headers = @{ Authorization = "Bearer $token"; "x-goog-user-project" = $ProjectId }
    $firebaseBase = "https://firebase.googleapis.com/v1beta1/projects/$ProjectId"
    try {
        Invoke-RestMethod -Method GET -Uri $firebaseBase -Headers $headers | Out-Null
        Ok "Firebase already enabled"
    } catch {
        $operation = Invoke-RestMethod -Method POST -Uri "$($firebaseBase):addFirebase" -Headers $headers -ContentType "application/json" -Body '{}'
        Wait-FirebaseOperation $operation.name $headers | Out-Null
        Ok "Firebase enabled"
    }

    Info "Ensuring Firestore database exists"
    $dbList = gcloud firestore databases list --project $ProjectId --format=json | ConvertFrom-Json
    $defaultExists = @($dbList).name -match '/databases/\(default\)$'
    if (-not $defaultExists) {
        gcloud firestore databases create --database="(default)" --location=$FirestoreLocation --type=firestore-native --project=$ProjectId --quiet | Out-Null
        Ok "Created Firestore default database in $FirestoreLocation"
    } else {
        Ok "Firestore default database exists"
    }
}

function Ensure-BigQueryDataset() {
    Info "Ensuring BigQuery dataset exists: $BqDataset"
    try {
        bq --project_id=$ProjectId --location=$BqLocation show --dataset "${ProjectId}:$BqDataset" | Out-Null
        Ok "BigQuery dataset exists"
    } catch {
        bq --project_id=$ProjectId --location=$BqLocation mk --dataset --description "Parliament data for RAG" "${ProjectId}:$BqDataset" | Out-Null
        Ok "Created BigQuery dataset"
    }
}

function Ensure-FirebaseWebAppConfig() {
    Info "Ensuring Firebase web app exists"
    $token = gcloud auth print-access-token
    $headers = @{ Authorization = "Bearer $token"; "x-goog-user-project" = $ProjectId }
    $appsUri = "https://firebase.googleapis.com/v1beta1/projects/$ProjectId/webApps"
    $appsResponse = Invoke-RestMethod -Method GET -Uri $appsUri -Headers $headers
    $webApp = @($appsResponse.apps) | Select-Object -First 1
    if (-not $webApp) {
        $body = @{ displayName = "Parliament AI" } | ConvertTo-Json
        $operation = Invoke-RestMethod -Method POST -Uri $appsUri -Headers $headers -ContentType "application/json" -Body $body
        $webApp = Wait-FirebaseOperation $operation.name $headers
        Ok "Created Firebase web app"
    } else {
        Ok "Firebase web app exists"
    }
    if (-not $webApp.appId) { throw "Firebase web app response did not include appId" }
    $config = Invoke-RestMethod -Method GET -Uri "$appsUri/$($webApp.appId)/config" -Headers $headers
    if (-not $config.apiKey -or -not $config.projectId -or -not $config.appId) { throw "Firebase SDK config is incomplete" }
    return $config
}

function Ensure-AuthDomain([string]$frontendDomain) {
    Info "Ensuring Firebase authorized domain includes $frontendDomain"
    try {
        $token = gcloud auth print-access-token
        $headers = @{ Authorization = "Bearer $token"; "x-goog-user-project" = $ProjectId }
        $url = "https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/config"
        $cfg = Invoke-RestMethod -Method GET -Uri $url -Headers $headers

        $domains = @()
        if ($cfg.authorizedDomains) {
            $domains = @($cfg.authorizedDomains)
        }

        if ($domains -notcontains $frontendDomain) {
            $domains += $frontendDomain
            $patchBody = @{ authorizedDomains = $domains } | ConvertTo-Json -Depth 4
            Invoke-RestMethod -Method PATCH -Uri "${url}?updateMask=authorizedDomains" -Headers $headers -ContentType "application/json" -Body $patchBody | Out-Null
            Ok "Authorized domain added"
        } else {
            Ok "Authorized domain already present"
        }
    } catch {
        throw "Could not update Firebase authorized domains: $($_.Exception.Message)"
    }
}

function Ensure-ArtifactRepo() {
    Info "Ensuring Artifact Registry repo exists"
    try {
        gcloud artifacts repositories describe parliament --location $Region --project $ProjectId | Out-Null
        Ok "Artifact Registry repo exists"
    } catch {
        gcloud artifacts repositories create parliament --repository-format=docker --location=$Region --project=$ProjectId | Out-Null
        Ok "Created Artifact Registry repo"
    }
}

function Ensure-IngestionJob([string]$jobImage, [string]$jobServiceAccount) {
    Info "Preparing ingestion job source"
    Copy-Item -Force ".\scripts\ingest_to_bigquery.py" ".\cloud-jobs\ingester\ingest_to_bigquery.py"

    Info "Building ingestion job image"
    Push-Location ".\cloud-jobs\ingester"
    gcloud builds submit --tag $jobImage --project $ProjectId --quiet | Out-Null
    Pop-Location

    Info "Creating/updating Cloud Run Job: $IngestionJobName"
    $jobExists = $true
    try {
        gcloud run jobs describe $IngestionJobName --region $Region --project $ProjectId | Out-Null
    } catch {
        $jobExists = $false
    }

    if (-not $jobExists) {
        gcloud run jobs create $IngestionJobName `
            --image=$jobImage `
            --region=$Region `
            --project=$ProjectId `
            --service-account=$jobServiceAccount `
            --set-env-vars="GOOGLE_CLOUD_PROJECT=$ProjectId,BQ_DATASET=$BqDataset,BQ_LOCATION=$BqLocation,PARLIAMENT_ADAPTER=$ParliamentAdapter,PARLIAMENT_API_BASE_URL=$ParliamentApiBaseUrl" `
            --task-timeout=3600 `
            --max-retries=1 `
            --quiet | Out-Null
        Ok "Created ingestion job"
    } else {
        gcloud run jobs update $IngestionJobName `
            --image=$jobImage `
            --region=$Region `
            --project=$ProjectId `
            --service-account=$jobServiceAccount `
            --set-env-vars="GOOGLE_CLOUD_PROJECT=$ProjectId,BQ_DATASET=$BqDataset,BQ_LOCATION=$BqLocation,PARLIAMENT_ADAPTER=$ParliamentAdapter,PARLIAMENT_API_BASE_URL=$ParliamentApiBaseUrl" `
            --task-timeout=3600 `
            --max-retries=1 `
            --quiet | Out-Null
        Ok "Updated ingestion job"
    }
}

function Ensure-Scheduler([string]$schedulerSaEmail) {
    Info "Creating/updating Cloud Scheduler job: $SchedulerJobName"
    $uri = "https://$Region-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$ProjectId/jobs/$IngestionJobName:run"

    $exists = $true
    try {
        gcloud scheduler jobs describe $SchedulerJobName --location=$Region --project=$ProjectId | Out-Null
    } catch {
        $exists = $false
    }

    if (-not $exists) {
        gcloud scheduler jobs create http $SchedulerJobName `
            --schedule=$SchedulerCron `
            --location=$Region `
            --project=$ProjectId `
            --uri=$uri `
            --http-method=POST `
            --oauth-service-account-email=$schedulerSaEmail `
            --quiet | Out-Null
        Ok "Created scheduler job"
    } else {
        gcloud scheduler jobs update http $SchedulerJobName `
            --schedule=$SchedulerCron `
            --location=$Region `
            --project=$ProjectId `
            --uri=$uri `
            --http-method=POST `
            --oauth-service-account-email=$schedulerSaEmail `
            --quiet | Out-Null
        Ok "Updated scheduler job"
    }
}

function Ensure-PasswordlessIdentity() {
    Info "Configuring passwordless Email Link authentication"
    $token = gcloud auth print-access-token
    $headers = @{ Authorization = "Bearer $token"; "x-goog-user-project" = $ProjectId }
    $url = "https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/config"
    try {
        Invoke-RestMethod -Method GET -Uri $url -Headers $headers | Out-Null
    } catch {
        if ([int]$_.Exception.Response.StatusCode -ne 404) { throw }
        Info "Initializing Identity Platform"
        $initializeUrl = "https://identitytoolkit.googleapis.com/v2/projects/$ProjectId/identityPlatform:initializeAuth"
        Invoke-RestMethod -Method POST -Uri $initializeUrl -Headers $headers -ContentType "application/json" -Body '{}' | Out-Null
    }
    $body = @{ signIn = @{ email = @{ enabled = $true; passwordRequired = $false } } } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Method PATCH -Uri "${url}?updateMask=signIn.email" -Headers $headers -ContentType "application/json" -Body $body | Out-Null

    $env:GOOGLE_CLOUD_PROJECT = $ProjectId
    node .\scripts\enable-totp-mfa.mjs
    if ($LASTEXITCODE -ne 0) { throw "Could not enable Firebase TOTP" }
    node .\scripts\bootstrap-admin.mjs $AdminEmail
    if ($LASTEXITCODE -ne 0) { throw "Could not configure initial administrator" }
    Ok "Passwordless authentication and initial administrator configured"
}

function Main() {
    Require-Command "gcloud"
    Require-Command "bq"
    Require-Command "node"

    Info "Checking gcloud authentication"
    $activeAcct = gcloud auth list --filter="status:ACTIVE" --format="value(account)"
    if (-not $activeAcct) {
        throw "No active gcloud account. Run: gcloud auth login"
    }
    Ok "Authenticated as $activeAcct"

    Ensure-Project

    Ensure-ApiEnabled @(
        "serviceusage.googleapis.com",
        "cloudresourcemanager.googleapis.com",
        "cloudbuild.googleapis.com",
        "run.googleapis.com",
        "artifactregistry.googleapis.com",
        "bigquery.googleapis.com",
        "firestore.googleapis.com",
        "firebase.googleapis.com",
        "identitytoolkit.googleapis.com",
        "secretmanager.googleapis.com",
        "cloudscheduler.googleapis.com",
        "iamcredentials.googleapis.com",
        "logging.googleapis.com",
        "monitoring.googleapis.com",
        "aiplatform.googleapis.com"
    )

    Ensure-ArtifactRepo
    Ensure-FirebaseAndFirestore
    Ensure-BigQueryDataset

    $firebaseCfg = Ensure-FirebaseWebAppConfig
    Ensure-PasswordlessIdentity
    $bootstrapUrl = "https://$ProjectId.web.app"

    Info "Ensuring API runtime service account"
    $apiSaName = "parliament-api-sa"
    $apiSaEmail = "$apiSaName@$ProjectId.iam.gserviceaccount.com"
    try {
        gcloud iam service-accounts describe $apiSaEmail --project=$ProjectId | Out-Null
    } catch {
        gcloud iam service-accounts create $apiSaName --project=$ProjectId --display-name="Parliament API Runtime" | Out-Null
        Wait-ServiceAccount $apiSaEmail
    }
    @(
        "roles/aiplatform.user",
        "roles/bigquery.dataViewer",
        "roles/bigquery.jobUser",
        "roles/datastore.user",
        "roles/firebaseauth.admin",
        "roles/cloudconfig.admin",
        "roles/logging.logWriter"
    ) | ForEach-Object {
        Add-ProjectIamBinding "serviceAccount:$apiSaEmail" $_
    }

    Info "Deploying API service"
    $apiKey = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
    gcloud run deploy $ApiServiceName `
        --source .\cloud-run-api `
        --region=$Region `
        --project=$ProjectId `
        --allow-unauthenticated `
        --platform=managed `
        --service-account=$apiSaEmail `
        --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$ProjectId,FIREBASE_WEB_API_KEY=$($firebaseCfg.apiKey),PASSWORDLESS_CONTINUE_URL=$bootstrapUrl,CORS_ORIGIN=$bootstrapUrl,ADMIN_NOTIFICATION_EMAIL=$AdminEmail,VALID_API_KEYS=$apiKey,BQ_DATASET=$BqDataset,PARLIAMENT_ADAPTER=$ParliamentAdapter,PARLIAMENT_NAME=$ParliamentName,PARLIAMENT_API_BASE_URL=$ParliamentApiBaseUrl,PARLIAMENT_DATA_SOURCE=$ParliamentApiBaseUrl" | Out-Null

    $apiUrl = gcloud run services describe $ApiServiceName --region=$Region --project=$ProjectId --format="value(status.url)"
    Ok "API deployed: $apiUrl"

    Info "Writing .env.production from discovered values"
    $envContent = @"
VITE_API_URL=$apiUrl
VITE_API_KEY=$apiKey
VITE_GOOGLE_CLIENT_ID=
VITE_GA_MEASUREMENT_ID=
VITE_FIREBASE_API_KEY=$($firebaseCfg.apiKey)
VITE_FIREBASE_AUTH_DOMAIN=$($firebaseCfg.authDomain)
VITE_FIREBASE_PROJECT_ID=$($firebaseCfg.projectId)
VITE_FIREBASE_STORAGE_BUCKET=$($firebaseCfg.storageBucket)
VITE_FIREBASE_MESSAGING_SENDER_ID=$($firebaseCfg.messagingSenderId)
VITE_FIREBASE_APP_ID=$($firebaseCfg.appId)
VITE_API_BASE_URL=$apiUrl
"@
    Set-Content -Path ".\.env.production" -Value $envContent -NoNewline

    Info "Deploying frontend service"
    gcloud run deploy $FrontendServiceName `
        --source . `
        --region=$Region `
        --project=$ProjectId `
        --allow-unauthenticated `
        --platform=managed `
        --port=80 | Out-Null

    $frontendUrl = gcloud run services describe $FrontendServiceName --region=$Region --project=$ProjectId --format="value(status.url)"
    $frontendDomain = ([uri]$frontendUrl).Host
    Ok "Frontend deployed: $frontendUrl"

    Info "Locking API CORS to frontend domain"
    gcloud run services update $ApiServiceName `
        --region=$Region `
        --project=$ProjectId `
        --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$ProjectId,FIREBASE_WEB_API_KEY=$($firebaseCfg.apiKey),PASSWORDLESS_CONTINUE_URL=$frontendUrl,CORS_ORIGIN=$frontendUrl,ADMIN_NOTIFICATION_EMAIL=$AdminEmail,VALID_API_KEYS=$apiKey,BQ_DATASET=$BqDataset,PARLIAMENT_ADAPTER=$ParliamentAdapter,PARLIAMENT_NAME=$ParliamentName,PARLIAMENT_API_BASE_URL=$ParliamentApiBaseUrl,PARLIAMENT_DATA_SOURCE=$ParliamentApiBaseUrl" | Out-Null

    Ensure-AuthDomain $frontendDomain

    Info "Ensuring ingestion runtime service account"
    $projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
    $jobSaName = "parliament-ingestion-sa"
    $jobSaEmail = "$jobSaName@$ProjectId.iam.gserviceaccount.com"
    try {
        gcloud iam service-accounts describe $jobSaEmail --project=$ProjectId | Out-Null
    } catch {
        gcloud iam service-accounts create $jobSaName --project=$ProjectId --display-name="Parliament Ingestion SA" | Out-Null
        Wait-ServiceAccount $jobSaEmail
    }

    Add-ProjectIamBinding "serviceAccount:$jobSaEmail" "roles/bigquery.dataEditor"
    Add-ProjectIamBinding "serviceAccount:$jobSaEmail" "roles/bigquery.jobUser"
    Add-ProjectIamBinding "serviceAccount:$jobSaEmail" "roles/logging.logWriter"

    $jobImage = "$Region-docker.pkg.dev/$ProjectId/parliament/ingestion-job:latest"
    Ensure-IngestionJob -jobImage $jobImage -jobServiceAccount $jobSaEmail

    Info "Ensuring scheduler invoker service account"
    $schedulerSaName = "parliament-scheduler-sa"
    $schedulerSaEmail = "$schedulerSaName@$ProjectId.iam.gserviceaccount.com"
    try {
        gcloud iam service-accounts describe $schedulerSaEmail --project=$ProjectId | Out-Null
    } catch {
        gcloud iam service-accounts create $schedulerSaName --project=$ProjectId --display-name="Parliament Scheduler SA" | Out-Null
        Wait-ServiceAccount $schedulerSaEmail
    }

    Add-ProjectIamBinding "serviceAccount:$schedulerSaEmail" "roles/run.invoker"

    Ensure-Scheduler -schedulerSaEmail $schedulerSaEmail

    Info "Running initial ingestion job"
    gcloud run jobs execute $IngestionJobName --region=$Region --project=$ProjectId --wait | Out-Null

    Ok "Bootstrap complete"
    Write-Host ""
    Write-Host "Project:   $ProjectId" -ForegroundColor White
    Write-Host "Region:    $Region" -ForegroundColor White
    Write-Host "Adapter:   $ParliamentAdapter" -ForegroundColor White
    Write-Host "API URL:   $apiUrl" -ForegroundColor Green
    Write-Host "Frontend:  $frontendUrl" -ForegroundColor Green
    Write-Host "Dataset:   ${ProjectId}:$BqDataset" -ForegroundColor White
    Write-Host "Scheduler: $SchedulerJobName ($SchedulerCron UTC)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next: request a sign-in link for the administrator and enroll Firebase TOTP. Configure optional third-party services separately." -ForegroundColor Yellow
}

Main



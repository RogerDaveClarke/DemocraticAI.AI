#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-west1}"
BILLING_ACCOUNT="${BILLING_ACCOUNT:-}"
PARLIAMENT_ADAPTER="${PARLIAMENT_ADAPTER:-oireachtas}"
PARLIAMENT_NAME="${PARLIAMENT_NAME:-Irish Parliament}"
PARLIAMENT_API_BASE_URL="${PARLIAMENT_API_BASE_URL:-https://api.oireachtas.ie/v1}"
BQ_DATASET="${BQ_DATASET:-parliamentary_data}"
BQ_LOCATION="${BQ_LOCATION:-US}"
FIRESTORE_LOCATION="${FIRESTORE_LOCATION:-nam5}"
API_SERVICE_NAME="${API_SERVICE_NAME:-parliament-api}"
FRONTEND_SERVICE_NAME="${FRONTEND_SERVICE_NAME:-parliament-frontend}"
INGESTION_JOB_NAME="${INGESTION_JOB_NAME:-parliament-ingestion-job}"
SCHEDULER_JOB_NAME="${SCHEDULER_JOB_NAME:-parliament-weekly-ingestion}"
SCHEDULER_CRON="${SCHEDULER_CRON:-0 2 * * 1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"

if [[ -z "$PROJECT_ID" || -z "$ADMIN_EMAIL" ]]; then
  echo "PROJECT_ID and ADMIN_EMAIL are required."
  echo "Example: PROJECT_ID=my-project ADMIN_EMAIL=admin@example.com ./scripts/bootstrap-gcp.sh"
  exit 1
fi

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1"; exit 1; }
}

info() { echo "[INFO] $*"; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*"; }

wait_service_account() {
  local email="$1"
  for attempt in $(seq 1 20); do
    if gcloud iam service-accounts describe "$email" --project="$PROJECT_ID" >/dev/null 2>&1; then
      return 0
    fi
    [[ "$attempt" -eq 20 ]] && return 1
    sleep 1
  done
}

add_project_iam_binding() {
  local member="$1"
  local role="$2"
  for attempt in $(seq 1 20); do
    if gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$member" --role="$role" >/dev/null 2>&1; then
      return 0
    fi
    [[ "$attempt" -eq 20 ]] && return 1
    sleep 1
  done
}

need_cmd gcloud
need_cmd bq
need_cmd jq
need_cmd curl
need_cmd python3
need_cmd node

if [[ -z "$(gcloud auth list --filter=status:ACTIVE --format='value(account)')" ]]; then
  echo "No active gcloud account. Run: gcloud auth login"
  exit 1
fi

info "Ensuring project exists: $PROJECT_ID"
if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud projects create "$PROJECT_ID"
fi

gcloud config set project "$PROJECT_ID" >/dev/null

if [[ -n "$BILLING_ACCOUNT" ]]; then
  CURRENT_BILLING_ACCOUNT="$(gcloud beta billing projects describe "$PROJECT_ID" --format='value(billingAccountName)')"
  if [[ "$CURRENT_BILLING_ACCOUNT" == "billingAccounts/$BILLING_ACCOUNT" ]]; then
    ok "Billing account already linked"
  else
    gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
  fi
else
  warn "No BILLING_ACCOUNT supplied. Ensure billing is linked or deploy may fail."
fi

info "Enabling required APIs"
gcloud services enable \
  serviceusage.googleapis.com \
  cloudresourcemanager.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  bigquery.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  identitytoolkit.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  iamcredentials.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  aiplatform.googleapis.com \
  aiplatform.googleapis.com \
  --project "$PROJECT_ID"

info "Ensuring Artifact Registry repo exists"
if ! gcloud artifacts repositories describe parliament --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create parliament --repository-format=docker --location="$REGION" --project="$PROJECT_ID"
fi

info "Ensuring Firebase + Firestore"
gcloud firebase projects:add-firebase "$PROJECT_ID" --quiet || true
if ! gcloud firestore databases list --project "$PROJECT_ID" --format='value(name)' | grep -q '/databases/(default)$'; then
  gcloud firestore databases create --database='(default)' --location="$FIRESTORE_LOCATION" --type=firestore-native --project="$PROJECT_ID"
fi

info "Ensuring Firebase web app"
WEB_APP_ID="$(gcloud firebase apps list --project "$PROJECT_ID" --format=json | jq -r '.[] | select(.platform=="WEB") | .appId' | head -n1)"
if [[ -z "$WEB_APP_ID" || "$WEB_APP_ID" == "null" ]]; then
  WEB_APP_ID="$(gcloud firebase apps create WEB 'Parliament Explorer' --project "$PROJECT_ID" --format=json | jq -r '.appId')"
fi

SDK_JSON="$(gcloud firebase apps sdkconfig WEB "$WEB_APP_ID" --project "$PROJECT_ID" --format=json)"
if echo "$SDK_JSON" | jq -e '.apiKey' >/dev/null 2>&1; then
  FIREBASE_API_KEY="$(echo "$SDK_JSON" | jq -r '.apiKey')"
  FIREBASE_AUTH_DOMAIN="$(echo "$SDK_JSON" | jq -r '.authDomain')"
  FIREBASE_PROJECT_ID="$(echo "$SDK_JSON" | jq -r '.projectId')"
  FIREBASE_STORAGE_BUCKET="$(echo "$SDK_JSON" | jq -r '.storageBucket')"
  FIREBASE_MESSAGING_SENDER_ID="$(echo "$SDK_JSON" | jq -r '.messagingSenderId')"
  FIREBASE_APP_ID="$(echo "$SDK_JSON" | jq -r '.appId')"
else
  warn "Unexpected firebase sdkconfig format; using project-based defaults"
  FIREBASE_API_KEY=""
  FIREBASE_AUTH_DOMAIN="$PROJECT_ID.firebaseapp.com"
  FIREBASE_PROJECT_ID="$PROJECT_ID"
  FIREBASE_STORAGE_BUCKET="$PROJECT_ID.appspot.com"
  FIREBASE_MESSAGING_SENDER_ID=""
  FIREBASE_APP_ID="$WEB_APP_ID"
fi

info "Configuring passwordless Email Link authentication"
TOKEN="$(gcloud auth print-access-token)"
curl --fail --silent --show-error -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT_ID/config?updateMask=signIn.email" \
  -d '{"signIn":{"email":{"enabled":true,"passwordRequired":false}}}' >/dev/null
export GOOGLE_CLOUD_PROJECT="$PROJECT_ID"
node ./scripts/enable-totp-mfa.mjs
node ./scripts/bootstrap-admin.mjs "$ADMIN_EMAIL"
BOOTSTRAP_URL="https://$PROJECT_ID.web.app"

info "Ensuring BigQuery dataset exists: $BQ_DATASET"
if ! bq --project_id="$PROJECT_ID" --location="$BQ_LOCATION" show --dataset "$PROJECT_ID:$BQ_DATASET" >/dev/null 2>&1; then
  bq --project_id="$PROJECT_ID" --location="$BQ_LOCATION" mk --dataset "$PROJECT_ID:$BQ_DATASET"
fi

API_KEY="$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)"

info "Ensuring API runtime service account"
API_SA="parliament-api-sa@$PROJECT_ID.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$API_SA" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create parliament-api-sa --project="$PROJECT_ID" --display-name="Parliament API Runtime"
  wait_service_account "$API_SA"
fi
for role in roles/aiplatform.user roles/bigquery.dataViewer roles/bigquery.jobUser roles/datastore.user roles/firebaseauth.admin roles/cloudconfig.admin roles/logging.logWriter; do
  add_project_iam_binding "serviceAccount:$API_SA" "$role"
done

info "Deploying API"
gcloud run deploy "$API_SERVICE_NAME" \
  --source ./cloud-run-api \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --allow-unauthenticated \
  --platform=managed \
  --service-account="$API_SA" \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIREBASE_WEB_API_KEY=$FIREBASE_API_KEY,PASSWORDLESS_CONTINUE_URL=$BOOTSTRAP_URL,CORS_ORIGIN=$BOOTSTRAP_URL,ADMIN_NOTIFICATION_EMAIL=$ADMIN_EMAIL,VALID_API_KEYS=$API_KEY,BQ_DATASET=$BQ_DATASET,PARLIAMENT_ADAPTER=$PARLIAMENT_ADAPTER,PARLIAMENT_NAME=$PARLIAMENT_NAME,PARLIAMENT_API_BASE_URL=$PARLIAMENT_API_BASE_URL,PARLIAMENT_DATA_SOURCE=$PARLIAMENT_API_BASE_URL"

API_URL="$(gcloud run services describe "$API_SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"

info "Writing .env.production"
cat > .env.production <<EOF
VITE_API_URL=$API_URL
VITE_API_KEY=$API_KEY
VITE_GOOGLE_CLIENT_ID=
VITE_GA_MEASUREMENT_ID=
VITE_FIREBASE_API_KEY=$FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=$FIREBASE_APP_ID
VITE_API_BASE_URL=$API_URL
EOF

info "Deploying frontend"
gcloud run deploy "$FRONTEND_SERVICE_NAME" \
  --source . \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --allow-unauthenticated \
  --platform=managed \
  --port=80

FRONTEND_URL="$(gcloud run services describe "$FRONTEND_SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
FRONTEND_DOMAIN="$(python3 - <<PY
from urllib.parse import urlparse
print(urlparse('$FRONTEND_URL').hostname)
PY
)"

info "Updating API CORS"
gcloud run services update "$API_SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIREBASE_WEB_API_KEY=$FIREBASE_API_KEY,PASSWORDLESS_CONTINUE_URL=$FRONTEND_URL,CORS_ORIGIN=$FRONTEND_URL,ADMIN_NOTIFICATION_EMAIL=$ADMIN_EMAIL,VALID_API_KEYS=$API_KEY,BQ_DATASET=$BQ_DATASET,PARLIAMENT_ADAPTER=$PARLIAMENT_ADAPTER,PARLIAMENT_NAME=$PARLIAMENT_NAME,PARLIAMENT_API_BASE_URL=$PARLIAMENT_API_BASE_URL,PARLIAMENT_DATA_SOURCE=$PARLIAMENT_API_BASE_URL"

info "Updating Firebase authorized domains"
TOKEN="$(gcloud auth print-access-token)"
CFG="$(curl -s -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $PROJECT_ID" "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT_ID/config")"
DOMAINS="$(echo "$CFG" | jq -c --arg d "$FRONTEND_DOMAIN" '.authorizedDomains // [] | if index($d) then . else . + [$d] end')"
curl --fail --silent --show-error -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-goog-user-project: $PROJECT_ID" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT_ID/config?updateMask=authorizedDomains" \
  -d "{\"authorizedDomains\":$DOMAINS}" >/dev/null

info "Ensuring ingestion service account"
JOB_SA="parliament-ingestion-sa@$PROJECT_ID.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$JOB_SA" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create parliament-ingestion-sa --project="$PROJECT_ID" --display-name="Parliament Ingestion SA"
  wait_service_account "$JOB_SA"
fi
add_project_iam_binding "serviceAccount:$JOB_SA" "roles/bigquery.dataEditor"
add_project_iam_binding "serviceAccount:$JOB_SA" "roles/bigquery.jobUser"
add_project_iam_binding "serviceAccount:$JOB_SA" "roles/logging.logWriter"

cp ./scripts/ingest_to_bigquery.py ./cloud-jobs/ingester/ingest_to_bigquery.py
JOB_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/parliament/ingestion-job:latest"
(
  cd ./cloud-jobs/ingester
  gcloud builds submit --tag "$JOB_IMAGE" --project "$PROJECT_ID" --quiet
)

if ! gcloud run jobs describe "$INGESTION_JOB_NAME" --region="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud run jobs create "$INGESTION_JOB_NAME" \
    --image="$JOB_IMAGE" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --service-account="$JOB_SA" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,BQ_DATASET=$BQ_DATASET,BQ_LOCATION=$BQ_LOCATION,PARLIAMENT_ADAPTER=$PARLIAMENT_ADAPTER,PARLIAMENT_API_BASE_URL=$PARLIAMENT_API_BASE_URL" \
    --task-timeout=3600 --max-retries=1 --quiet
else
  gcloud run jobs update "$INGESTION_JOB_NAME" \
    --image="$JOB_IMAGE" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --service-account="$JOB_SA" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,BQ_DATASET=$BQ_DATASET,BQ_LOCATION=$BQ_LOCATION,PARLIAMENT_ADAPTER=$PARLIAMENT_ADAPTER,PARLIAMENT_API_BASE_URL=$PARLIAMENT_API_BASE_URL" \
    --task-timeout=3600 --max-retries=1 --quiet
fi

SCHED_SA="parliament-scheduler-sa@$PROJECT_ID.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SCHED_SA" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create parliament-scheduler-sa --project="$PROJECT_ID" --display-name="Parliament Scheduler SA"
  wait_service_account "$SCHED_SA"
fi
add_project_iam_binding "serviceAccount:$SCHED_SA" "roles/run.invoker"

SCHED_URI="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${INGESTION_JOB_NAME}:run"
if ! gcloud scheduler jobs describe "$SCHEDULER_JOB_NAME" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud scheduler jobs create http "$SCHEDULER_JOB_NAME" \
    --schedule="$SCHEDULER_CRON" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --uri="$SCHED_URI" \
    --http-method=POST \
    --oauth-service-account-email="$SCHED_SA" \
    --quiet
else
  gcloud scheduler jobs update http "$SCHEDULER_JOB_NAME" \
    --schedule="$SCHEDULER_CRON" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --uri="$SCHED_URI" \
    --http-method=POST \
    --oauth-service-account-email="$SCHED_SA" \
    --quiet
fi

info "Running initial ingestion"
gcloud run jobs execute "$INGESTION_JOB_NAME" --region="$REGION" --project="$PROJECT_ID" --wait

echo
echo "Bootstrap complete"
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Adapter:  $PARLIAMENT_ADAPTER"
echo "API:      $API_URL"
echo "Frontend: $FRONTEND_URL"
echo "Dataset:  $PROJECT_ID:$BQ_DATASET"
echo "Schedule: $SCHEDULER_JOB_NAME ($SCHEDULER_CRON UTC)"

#!/bin/bash

# Parliament Explorer - Simple Build and Deploy Script
# For quick deployment to GCP Cloud Run

set -e

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}

echo "🏛️  Parliament Explorer - Cloud Build Deploy"
echo "============================================="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Validate gcloud authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ No active gcloud authentication found."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Submit the build
echo "🚀 Starting Cloud Build..."
echo "This will build and deploy both frontend and backend..."
echo ""

gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_REGION=$REGION \
    .

echo ""
echo "🎉 Deployment submitted!"
echo "======================="
echo ""
echo "📋 Monitor the build:"
echo "   gcloud builds list --limit=5"
echo ""
echo "🔗 Cloud Console:"
echo "   https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
echo ""
echo "📊 Cloud Run Services:"
echo "   https://console.cloud.google.com/run?project=$PROJECT_ID"
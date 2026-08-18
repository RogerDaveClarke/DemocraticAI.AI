#!/bin/bash
# Parliament Explorer - Build Trigger Setup Script

echo "🏛️  Setting up Cloud Build Trigger for Parliament Explorer"
echo "========================================================"

# Set project
gcloud config set project replace-with-your-project-id

# Create build trigger
echo "Creating build trigger connected to GitHub repository..."
gcloud builds triggers create github \
    --repo-name="Parliament" \
    --repo-owner="RogerDaveClarke" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild.yaml" \
    --name="parliament-auto-deploy" \
    --description="Automatic deployment for Parliament Explorer OAuth system"

echo ""
echo "✅ Build trigger created successfully!"
echo ""
echo "🚀 To manually trigger a build:"
echo "   gcloud builds triggers run parliament-auto-deploy --branch=main"
echo ""
echo "📊 Monitor builds at:"
echo "   https://console.cloud.google.com/cloud-build/builds?project=replace-with-your-project-id"
echo ""
echo "🔗 View triggers at:"
echo "   https://console.cloud.google.com/cloud-build/triggers?project=replace-with-your-project-id"
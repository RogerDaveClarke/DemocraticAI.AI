#!/bin/bash

# Parliament Project Migration Script
# Migrates from replace-with-your-project-id (EU) to new US-based project

set -e

echo "🇺🇸 Parliament Project - US Region Migration"
echo "============================================"

# Configuration
OLD_PROJECT="replace-with-your-project-id"
NEW_PROJECT=""
NEW_BUCKET="myparliament-images-us"
OLD_BUCKET="myparliament-images"
REGION="us-west1"

# Function to check if gcloud is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo "❌ Please authenticate with gcloud first:"
        echo "   gcloud auth login"
        exit 1
    fi
}

# Function to create new project
create_project() {
    read -p "Enter new project ID (e.g., myparliament-us): " NEW_PROJECT
    
    echo "🔧 Creating new project: $NEW_PROJECT"
    gcloud projects create $NEW_PROJECT
    
    echo "🔧 Setting billing account..."
    BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(name)" | head -1)
    gcloud billing projects link $NEW_PROJECT --billing-account=$BILLING_ACCOUNT
    
    echo "🔧 Setting project as default..."
    gcloud config set project $NEW_PROJECT
}

# Function to enable APIs
enable_apis() {
    echo "🔧 Enabling required APIs..."
    gcloud services enable run.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable firestore.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable cloudfunctions.googleapis.com
    echo "✅ APIs enabled"
}

# Function to create Firestore database
create_firestore() {
    echo "🔧 Creating Firestore database in $REGION..."
    gcloud firestore databases create --location=$REGION
    echo "✅ Firestore database created"
}

# Function to create storage bucket
create_storage() {
    echo "🔧 Creating Cloud Storage bucket: $NEW_BUCKET"
    gsutil mb -l $REGION gs://$NEW_BUCKET
    
    echo "🔧 Setting bucket permissions..."
    gsutil iam ch allUsers:objectViewer gs://$NEW_BUCKET
    echo "✅ Storage bucket created"
}

# Function to copy data
copy_data() {
    echo "🔧 Copying images from old bucket..."
    gsutil -m cp -r gs://$OLD_BUCKET/* gs://$NEW_BUCKET/
    echo "✅ Images copied"
    
    echo "📝 Note: Firestore data will need to be exported/imported manually"
    echo "   Use the Firebase console or gcloud firestore export/import commands"
}

# Function to update configuration files
update_configs() {
    echo "🔧 Creating configuration update script..."
    cat > update_project_config.js << 'EOF'
const fs = require('fs');
const path = require('path');

const OLD_PROJECT = 'replace-with-your-project-id';
const NEW_PROJECT = process.argv[2];
const NEW_BUCKET = 'myparliament-images-us';

if (!NEW_PROJECT) {
    console.error('Usage: node update_project_config.js <new-project-id>');
    process.exit(1);
}

const files = [
    'cloud-run-api/src/index.ts',
    'scripts/upload-party-images.js',
    'scripts/update-member-photos.js',
    'scripts/ingest-data.js'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(new RegExp(OLD_PROJECT, 'g'), NEW_PROJECT);
        content = content.replace(/myparliament-images/g, NEW_BUCKET);
        fs.writeFileSync(file, content);
        console.log(`✅ Updated ${file}`);
    } else {
        console.log(`⚠️  File not found: ${file}`);
    }
});

console.log(`🎉 Configuration updated for project: ${NEW_PROJECT}`);
EOF

    node update_project_config.js $NEW_PROJECT
}

# Main execution
main() {
    check_auth
    
    echo "Starting migration process..."
    echo "Current project: $(gcloud config get-value project)"
    
    create_project
    enable_apis
    create_firestore
    create_storage
    copy_data
    update_configs
    
    echo ""
    echo "🎉 Migration setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Export Firestore data from old project"
    echo "2. Import Firestore data to new project"
    echo "3. Deploy services to new project"
    echo "4. Test all functionality"
    echo "5. Update DNS/domains"
    echo ""
    echo "New project: $NEW_PROJECT"
    echo "New bucket: gs://$NEW_BUCKET"
    echo "Region: $REGION"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
#!/bin/bash

# GCP Domain Setup Script for yourpublicrep.com
# This script guides you through setting up a custom domain with SSL on Cloud Run

set -e

PROJECT_ID="replace-with-your-project-id"
DOMAIN="yourpublicrep.com"
SERVICE_NAME="parliament-frontend"
REGION="us-west1"

echo "🚀 Setting up custom domain for Parliament Explorer"
echo "Domain: $DOMAIN"
echo "Service: $SERVICE_NAME"
echo "Project: $PROJECT_ID"
echo ""

# Step 1: Verify domain ownership
echo "📋 Step 1: Domain Verification"
echo "Before we can map the domain, you need to verify ownership."
echo ""
echo "Option A: Using Google Search Console (Recommended)"
echo "1. Go to: https://search.google.com/search-console"
echo "2. Add property: $DOMAIN"
echo "3. Verify using one of these methods:"
echo "   - HTML file upload"
echo "   - HTML tag in your site's <head>"
echo "   - Google Analytics"
echo "   - DNS TXT record"
echo ""
echo "Option B: Using gcloud (Alternative)"
echo "Run: gcloud domains verify $DOMAIN"
echo ""

read -p "Have you verified the domain? (y/n): " domain_verified

if [ "$domain_verified" != "y" ]; then
    echo "❌ Please verify the domain first, then run this script again."
    exit 1
fi

# Step 2: Create domain mapping
echo ""
echo "📍 Step 2: Creating domain mapping..."

# Check if domain mapping already exists
if gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION 2>/dev/null; then
    echo "⚠️  Domain mapping already exists. Updating..."
    gcloud run domain-mappings update $DOMAIN \
        --service=$SERVICE_NAME \
        --region=$REGION
else
    echo "Creating new domain mapping..."
    gcloud run domain-mappings create \
        --service=$SERVICE_NAME \
        --domain=$DOMAIN \
        --region=$REGION
fi

# Step 3: Get DNS configuration
echo ""
echo "📍 Step 3: DNS Configuration Required"
echo ""

# Get the domain mapping details
MAPPING_INFO=$(gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION --format="value(status.resourceRecords[].rrdata,status.resourceRecords[].type)")

echo "Configure the following DNS records with your domain registrar:"
echo ""

# Parse and display DNS records
while IFS=$'\t' read -r rrdata type; do
    if [ ! -z "$rrdata" ] && [ ! -z "$type" ]; then
        if [ "$type" = "A" ]; then
            echo "A Record:"
            echo "  Name: @ (or yourpublicrep.com)"
            echo "  Value: $rrdata"
            echo "  TTL: 300"
        elif [ "$type" = "AAAA" ]; then
            echo "AAAA Record:"
            echo "  Name: @ (or yourpublicrep.com)"
            echo "  Value: $rrdata"
            echo "  TTL: 300"
        elif [ "$type" = "CNAME" ]; then
            echo "CNAME Record:"
            echo "  Name: @ (or yourpublicrep.com)"
            echo "  Value: $rrdata"
            echo "  TTL: 300"
        fi
        echo ""
    fi
done <<< "$MAPPING_INFO"

# Step 4: SSL Certificate
echo "📍 Step 4: SSL Certificate"
echo "Google will automatically provision an SSL certificate for your domain."
echo "This usually takes 15-60 minutes after DNS propagation."
echo ""

# Step 5: Verification
echo "📍 Step 5: Verification Steps"
echo ""
echo "1. Update your DNS records with the values shown above"
echo "2. Wait 5-15 minutes for DNS propagation"
echo "3. Test your domain: https://$DOMAIN"
echo ""
echo "To check SSL certificate status:"
echo "gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION"
echo ""

# Step 6: Optional - Setup www redirect
echo "📍 Step 6: Optional - WWW Redirect"
echo ""
echo "To redirect www.$DOMAIN to $DOMAIN:"
echo "1. Create CNAME record:"
echo "   Name: www"
echo "   Value: $DOMAIN"
echo "   TTL: 300"
echo ""

echo "✅ Domain mapping setup complete!"
echo ""
echo "🔗 Service URLs:"
echo "  Cloud Run: https://$SERVICE_NAME-replace-with-your-project-number.us-west1.run.app"
echo "  Custom Domain: https://$DOMAIN (after DNS setup)"
echo ""
echo "📊 Monitoring:"
echo "  - Check DNS propagation: https://www.whatsmydns.net/#A/$DOMAIN"
echo "  - SSL certificate status in Google Cloud Console"
echo "  - Cloud Run metrics and logs"
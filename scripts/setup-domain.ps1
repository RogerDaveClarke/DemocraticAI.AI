# GCP Domain Setup Script for yourpublicrep.com
# PowerShell version for Windows

param(
    [string]$Domain = "yourpublicrep.com",
    [string]$ServiceName = "parliament-frontend",
    [string]$Region = "us-west1",
    [string]$ProjectId = "replace-with-your-project-id"
)

Write-Host "🚀 Setting up custom domain for Parliament Explorer" -ForegroundColor Green
Write-Host "Domain: $Domain"
Write-Host "Service: $ServiceName"
Write-Host "Project: $ProjectId"
Write-Host ""

# Step 1: Domain Verification
Write-Host "📋 Step 1: Domain Verification" -ForegroundColor Yellow
Write-Host "Before we can map the domain, you need to verify ownership."
Write-Host ""
Write-Host "Option A: Using Google Search Console (Recommended)" -ForegroundColor Cyan
Write-Host "1. Go to: https://search.google.com/search-console"
Write-Host "2. Add property: $Domain"
Write-Host "3. Verify using one of these methods:"
Write-Host "   - HTML file upload"
Write-Host "   - HTML tag in your site's <head>"
Write-Host "   - Google Analytics"
Write-Host "   - DNS TXT record"
Write-Host ""
Write-Host "Option B: Using gcloud (Alternative)" -ForegroundColor Cyan
Write-Host "Run: gcloud domains verify $Domain"
Write-Host ""

$domainVerified = Read-Host "Have you verified the domain? (y/n)"

if ($domainVerified -ne "y") {
    Write-Host "❌ Please verify the domain first, then run this script again." -ForegroundColor Red
    exit 1
}

# Step 2: Create domain mapping
Write-Host ""
Write-Host "📍 Step 2: Creating domain mapping..." -ForegroundColor Yellow

try {
    # Check if domain mapping already exists
    $existingMapping = gcloud run domain-mappings describe --domain=$Domain --region=$Region 2>$null
    
    if ($existingMapping) {
        Write-Host "⚠️  Domain mapping already exists. Updating..." -ForegroundColor Yellow
        gcloud run domain-mappings update $Domain --service=$ServiceName --region=$Region
    } else {
        Write-Host "Creating new domain mapping..." -ForegroundColor Green
        gcloud run domain-mappings create --service=$ServiceName --domain=$Domain --region=$Region
    }
} catch {
    Write-Host "Creating new domain mapping..." -ForegroundColor Green
    gcloud run domain-mappings create --service=$ServiceName --domain=$Domain --region=$Region
}

# Step 3: Get DNS configuration
Write-Host ""
Write-Host "📍 Step 3: DNS Configuration Required" -ForegroundColor Yellow
Write-Host ""

Write-Host "Getting DNS configuration..." -ForegroundColor Cyan
$mappingInfo = gcloud run domain-mappings describe --domain=$Domain --region=$Region --format="json" | ConvertFrom-Json

Write-Host "Configure the following DNS records with your domain registrar:" -ForegroundColor Green
Write-Host ""

if ($mappingInfo.status.resourceRecords) {
    foreach ($record in $mappingInfo.status.resourceRecords) {
        switch ($record.type) {
            "A" {
                Write-Host "A Record:" -ForegroundColor Cyan
                Write-Host "  Name: @ (or $Domain)"
                Write-Host "  Value: $($record.rrdata)"
                Write-Host "  TTL: 300"
            }
            "AAAA" {
                Write-Host "AAAA Record:" -ForegroundColor Cyan
                Write-Host "  Name: @ (or $Domain)"
                Write-Host "  Value: $($record.rrdata)"
                Write-Host "  TTL: 300"
            }
            "CNAME" {
                Write-Host "CNAME Record:" -ForegroundColor Cyan
                Write-Host "  Name: @ (or $Domain)"
                Write-Host "  Value: $($record.rrdata)"
                Write-Host "  TTL: 300"
            }
        }
        Write-Host ""
    }
} else {
    Write-Host "Standard Cloud Run domain mapping records:" -ForegroundColor Cyan
    Write-Host "Add these A records to your DNS:"
    Write-Host "  216.239.32.21"
    Write-Host "  216.239.34.21"
    Write-Host "  216.239.36.21"
    Write-Host "  216.239.38.21"
    Write-Host ""
    Write-Host "Add these AAAA records to your DNS:"
    Write-Host "  2001:4860:4802:32::15"
    Write-Host "  2001:4860:4802:34::15"
    Write-Host "  2001:4860:4802:36::15"
    Write-Host "  2001:4860:4802:38::15"
    Write-Host ""
}

# Step 4: SSL Certificate
Write-Host "📍 Step 4: SSL Certificate" -ForegroundColor Yellow
Write-Host "Google will automatically provision an SSL certificate for your domain."
Write-Host "This usually takes 15-60 minutes after DNS propagation."
Write-Host ""

# Step 5: Verification
Write-Host "📍 Step 5: Verification Steps" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update your DNS records with the values shown above"
Write-Host "2. Wait 5-15 minutes for DNS propagation"
Write-Host "3. Test your domain: https://$Domain"
Write-Host ""
Write-Host "To check SSL certificate status:"
Write-Host "gcloud run domain-mappings describe --domain=$Domain --region=$Region"
Write-Host ""

# Step 6: Optional - Setup www redirect
Write-Host "📍 Step 6: Optional - WWW Redirect" -ForegroundColor Yellow
Write-Host ""
Write-Host "To redirect www.$Domain to ${Domain}:"
Write-Host "1. Create CNAME record:"
Write-Host "   Name: www"
Write-Host "   Value: $Domain"
Write-Host "   TTL: 300"
Write-Host ""

Write-Host "✅ Domain mapping setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Service URLs:" -ForegroundColor Cyan
Write-Host "  Cloud Run: https://$ServiceName-replace-with-your-project-number.us-west1.run.app"
Write-Host "  Custom Domain: https://$Domain (after DNS setup)"
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor Cyan
Write-Host "  - Check DNS propagation: https://www.whatsmydns.net/#A/$Domain"
Write-Host "  - SSL certificate status in Google Cloud Console"
Write-Host "  - Cloud Run metrics and logs"
Write-Host ""

# Additional helpful commands
Write-Host "🔧 Helpful Commands:" -ForegroundColor Magenta
Write-Host "Check domain mapping status:"
Write-Host "  gcloud run domain-mappings list --region=$Region"
Write-Host ""
Write-Host "View service details:"
Write-Host "  gcloud run services describe $ServiceName --region=$Region"
Write-Host ""
Write-Host "View logs:"
Write-Host "  gcloud logs read 'resource.type=cloud_run_revision AND resource.labels.service_name=$ServiceName' --limit=50"
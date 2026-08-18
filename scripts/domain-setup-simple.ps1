# Quick Domain Setup for yourpublicrep.com

Write-Host "🚀 Parliament Explorer Domain Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "✅ CURRENT STATUS:" -ForegroundColor Green
Write-Host "Frontend deployed: http://localhost:5173"
Write-Host "API deployed: http://localhost:8080"
Write-Host ""

Write-Host "📋 NEXT STEPS TO GET https://yourpublicrep.com WORKING:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. VERIFY DOMAIN OWNERSHIP" -ForegroundColor Cyan
Write-Host "   Go to: https://search.google.com/search-console"
Write-Host "   Add property: yourpublicrep.com"
Write-Host "   Choose DNS TXT record verification (recommended)"
Write-Host ""

Write-Host "2. CONFIGURE DNS RECORDS" -ForegroundColor Cyan
Write-Host "   Add these A records to yourpublicrep.com DNS:"
Write-Host "   216.239.32.21"
Write-Host "   216.239.34.21"
Write-Host "   216.239.36.21"
Write-Host "   216.239.38.21"
Write-Host ""

Write-Host "3. CREATE DOMAIN MAPPING" -ForegroundColor Cyan
Write-Host "   Run this command after domain verification:"
Write-Host "   gcloud beta run domain-mappings create --service=parliament-frontend --domain=yourpublicrep.com --region=us-west1"
Write-Host ""

Write-Host "4. WAIT FOR SSL CERTIFICATE" -ForegroundColor Cyan
Write-Host "   Google will automatically provision SSL certificate (15-60 minutes)"
Write-Host ""

Write-Host "🔍 TESTING:" -ForegroundColor Magenta
Write-Host "   Check DNS propagation: https://www.whatsmydns.net/#A/yourpublicrep.com"
Write-Host "   Test your domain: https://yourpublicrep.com"
Write-Host ""

Write-Host "💡 HELPFUL COMMANDS:" -ForegroundColor Yellow
Write-Host "   Check domain mappings: gcloud beta run domain-mappings list --region=us-west1"
Write-Host "   Check service status: gcloud run services list --region=us-west1"
Write-Host "   View logs: gcloud logs read 'resource.type=cloud_run_revision' --limit=10"
Write-Host ""

Write-Host "🎉 Your Parliament Explorer is ready to go live!" -ForegroundColor Green
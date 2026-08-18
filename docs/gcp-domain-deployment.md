# GCP Website Deployment Plan

## Overview
Deploy the Parliament Explorer React application to GCP using Cloud Run with custom domain "yourpublicrep.com" and Google-managed SSL certificate.

## Deployment Architecture

### 1. Cloud Run Service
- **Service**: Frontend React application
- **Container**: Nginx serving built React app
- **Port**: 8080 (Cloud Run standard)
- **Region**: us-west1 (same as API)

### 2. Domain Mapping
- **Domain**: yourpublicrep.com
- **SSL**: Google-managed certificate (automatic)
- **DNS**: Cloud DNS for domain management

### 3. Load Balancer (Optional but Recommended)
- **Type**: Global External Application Load Balancer
- **Features**: 
  - CDN for static assets
  - Global availability
  - DDoS protection
  - Custom domain with SSL

## Implementation Steps

### Step 1: Build and Deploy to Cloud Run
```bash
# Build and deploy the frontend
gcloud run deploy parliament-frontend \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

### Step 2: Domain Setup
1. **Verify domain ownership** in Google Cloud Console
2. **Create domain mapping** for Cloud Run service
3. **Configure DNS** to point to Cloud Run

### Step 3: SSL Certificate
- Google automatically provisions SSL certificate for custom domains
- Certificate is managed and renewed automatically

## DNS Configuration Required

### If using Cloud DNS:
```
yourpublicrep.com.  300 IN A     216.239.32.21
yourpublicrep.com.  300 IN A     216.239.34.21
yourpublicrep.com.  300 IN A     216.239.36.21
yourpublicrep.com.  300 IN A     216.239.38.21
yourpublicrep.com.  300 IN AAAA  2001:4860:4802:32::15
yourpublicrep.com.  300 IN AAAA  2001:4860:4802:34::15
yourpublicrep.com.  300 IN AAAA  2001:4860:4802:36::15
yourpublicrep.com.  300 IN AAAA  2001:4860:4802:38::15
```

### If using external DNS provider:
Point CNAME record to: ghs.googlehosted.com

## Security Features
- Automatic HTTPS redirect
- Google-managed SSL certificate
- Security headers (already configured in nginx.conf)
- CORS configuration for API calls

## Performance Optimizations
- Gzip compression enabled
- Static asset caching (1 year)
- CDN distribution (if using Load Balancer)
- Container optimization for fast cold starts

## Monitoring
- Cloud Run request metrics
- Error rate monitoring
- SSL certificate expiration alerts
- Domain health checks

## Estimated Costs
- Cloud Run: ~$5-20/month (depending on traffic)
- Domain mapping: Free
- SSL certificate: Free (Google-managed)
- Load Balancer (optional): ~$20-50/month

## Benefits of This Approach
1. **Automatic SSL**: Google manages certificate lifecycle
2. **Global CDN**: Fast content delivery worldwide
3. **Auto-scaling**: Handles traffic spikes automatically
4. **High Availability**: 99.95% uptime SLA
5. **Cost Effective**: Pay only for requests served
6. **Easy Management**: Single command deployments
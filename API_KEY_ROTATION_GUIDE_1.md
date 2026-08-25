# API Key Rotation Guide for Parliament Explorer

## Overview

This guide provides step-by-step procedures for rotating API keys securely to maintain the security posture of the Parliament Explorer application.

## When to Rotate Keys

### Immediate Rotation Required:
- **Suspected compromise** - Key appears in logs, git history, or public repositories
- **Employee departure** - Team member with key access leaves
- **Security incident** - Any breach or suspicious activity detected
-**Accidental exposure** - Key shared via insecure channels

### Scheduled Rotation:
- **Every 90 days** - Regular security maintenance
- **Before major releases** - Ensure fresh keys for production deployments
- **After security audits** - Best practice following security reviews

## Rotation Procedures

### 1. Pre-Rotation Checklist

```bash
# Verify current key status
gcloud secrets versions list parliament-api-key --limit=5

# Check current services using the key
gcloud run services list --platform=managed

# Backup current configuration
gcloud secrets versions access latest --secret=parliament-api-key > current-key-backup.txt
```

### 2. Generate New API Key

```bash
# Method 1: Generate cryptographically secure key
NEW_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "Generated key: $NEW_KEY"

# Method 2: Use a specific pattern (recommended)
NEW_KEY="prod-parliament-$(date +%Y)-secure-key-v$(date +%m%d)"
echo "New key: $NEW_KEY"
```

### 3. Update Secret Manager

```bash
# Add new version to Secret Manager
echo "$NEW_KEY" | gcloud secrets versions add parliament-api-key --data-file=-

# Verify new version was created
gcloud secrets versions list parliament-api-key --limit=3
```

### 4. Update Environment Files

**Frontend (.env files):**
```bash
# Update .env.development
sed -i "s/VITE_API_KEY=.*/VITE_API_KEY=$NEW_KEY/" .env.development

# Update .env.production  
sed -i "s/VITE_API_KEY=.*/VITE_API_KEY=$NEW_KEY/" .env.production
```

**Backend (.env files):**
```bash
# Update cloud-run-api/.env.development
sed -i "s/VALID_API_KEYS=.*/VALID_API_KEYS=$NEW_KEY,old-backup-key/" cloud-run-api/.env.development

# Update cloud-run-api/.env.production
sed -i "s/VALID_API_KEYS=.*/VALID_API_KEYS=$NEW_KEY,old-backup-key/" cloud-run-api/.env.production
```

### 5. Deploy Updated Services

```bash
# Rebuild and deploy frontend
npm run build
gcloud builds submit --config cloudbuild-frontend.yaml .

# Rebuild and deploy backend
cd cloud-run-api
npm run build
gcloud builds submit --config ../cloudbuild-backend.yaml .
```

### 6. Verify Rotation

```bash
# Test API endpoints with new key
curl -H "X-API-Key: $NEW_KEY" https://your-api-endpoint.run.app/api/health

# Check application logs for successful authentication
gcloud logs read "projects/<YOUR_PROJECT_ID>/logs/run.googleapis.com" --limit=10 --format="table(timestamp,jsonPayload.message)"

# Verify frontend is using new key
curl -s https://your-frontend.run.app | grep -o "api.*key" || echo "Key not exposed (good)"
```

### 7. Clean Up Old Keys

```bash
# Wait 24-48 hours for all services to use new key, then disable old version
OLD_VERSION=$(gcloud secrets versions list parliament-api-key --limit=2 --format="value(name)" | tail -1)
gcloud secrets versions disable $OLD_VERSION

# After 7 days, destroy old version permanently
gcloud secrets versions destroy $OLD_VERSION
```

## Security Best Practices

### During Rotation:
- **Use secure channels** - Never share keys via email, Slack, or other insecure methods
- **Maintain overlap** - Keep old key valid until new key is fully deployed
- **Monitor closely** - Watch for authentication failures during transition
- **Document changes** - Update internal documentation with new key patterns

### Key Generation:
- **Use strong entropy** - Keys should be cryptographically random
- â**Minimum length** - At least 32 characters for production keys
- **Avoid patterns** - Don't use predictable sequences or common words
- **Include metadata** - Version and date information in key format

### Storage:
- **Secret Manager only** - Never store keys in code or configuration files
- **Least privilege** - Grant minimal required access to secret resources
- **Audit access** - Monitor who accesses secret values
- **Regular backups** - Maintain secure backups of critical secrets

## Emergency Rotation Procedure

If immediate rotation is required due to security incident:

```bash
#!/bin/bash
# Emergency key rotation script

set -e

# Generate emergency key
EMERGENCY_KEY="emergency-$(date +%Y%m%d%H%M)-$(openssl rand -hex 8)"

# Update Secret Manager immediately
echo "$EMERGENCY_KEY" | gcloud secrets versions add parliament-api-key --data-file=-

# Disable all previous versions
gcloud secrets versions list parliament-api-key --format="value(name)" | head -n -1 | while read version; do
    gcloud secrets versions disable $version
done

# Update Cloud Run services with emergency environment variable
gcloud run services update parliament-api --set-env-vars="EMERGENCY_API_KEY=$EMERGENCY_KEY" --region=us-central1
gcloud run services update parliament-api --set-env-vars="EMERGENCY_API_KEY=$EMERGENCY_KEY" --region=us-west1

echo "Emergency rotation complete. Key: $EMERGENCY_KEY"
echo "Update frontend immediately with new key!"
```

## Monitoring & Validation

### Automated Checks:
```bash
# Add to CI/CD pipeline or cron job
#!/bin/bash

# Check key age (rotate if older than 90 days)
LAST_ROTATION=$(gcloud secrets versions list parliament-api-key --limit=1 --format="value(createTime)")
DAYS_OLD=$(( ($(date +%s) - $(date -d "$LAST_ROTATION" +%s)) / 86400 ))

if [ $DAYS_OLD -gt 90 ]; then
    echo "âš ï¸  API key is $DAYS_OLD days old - rotation recommended"
    exit 1
fi

# Test key validity
curl -f -H "X-API-Key: $(gcloud secrets versions access latest --secret=parliament-api-key)" \
    https://your-api-endpoint.run.app/api/health || {
    echo "âŒ API key validation failed"
    exit 1
}

echo API key validation passed"
```

### Manual Validation:
```bash
# Check current key in use
gcloud secrets versions access latest --secret=parliament-api-key

# Test authentication
curl -H "X-API-Key: YOUR_KEY_HERE" https://your-api-endpoint.run.app/api/health

# Check security logs for authentication events
gcloud logs read "jsonPayload.eventType=AUTH_SUCCESS" --limit=5
```

## Incident Response

If keys are compromised:

1. **Immediate Actions (0-15 minutes):**
   - Run emergency rotation script
   - Disable all previous key versions
   - Update monitoring alerts

2. **Short-term Actions (15-60 minutes):**
   - Deploy updated frontend with new key
   - Verify all services are using new key
   - Document incident timeline

3. **Follow-up Actions (1-24 hours):**
   - Investigate compromise source
   - Update security procedures
   - Consider additional security measures

## References

- [GCP Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [NIST Key Management Guidelines](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [Parliament Explorer Security Documentation](./SECURITY_DOCUMENTATION_COMPLETE.md)

---

**Last Updated:** November 2025  
**Next Review:** February 2026  
**Owner:** Parliament Explorer Security Team

# Security Action Plan - Environment Files Removed from Git

## âœ… Actions Completed

1. **Removed from Git Tracking:**
   - `.env.development` âœ…
   - `.env.production` âœ…
   - `cloud-run-api/.env.development` âœ…
   - `cloud-run-api/.env.production` âœ…

2. **Files Staged for Deletion:**
   ```powershell
   git status
   # Shows: D .env.development, D .env.production, etc.
   ```

## ðŸ” Exposure Assessment

### What Was Exposed:

1. **API Keys (Need Rotation):**
   - `VITE_API_KEY=replace-with-rotated-api-key`
   - `VITE_API_KEY=replace-with-rotated-api-key`
   - `VALID_API_KEYS=replace-with-rotated-api-keys`
   - `VALID_API_KEYS=replace-with-rotated-api-keys`

2. **Infrastructure Info (Low Risk):**
   - API URL: `https://<YOUR_API_SERVICE_HOST>`
   - Project ID: `<YOUR_PROJECT_ID>`
   - CORS origins (public info)

3. **Placeholder Values (No Risk):**
   - `VITE_GOOGLE_CLIENT_ID=your-production-google-oauth-client-id` (not real)
   - `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (placeholder)

## âš ï¸ Required Actions Before Pushing to GitHub

### 1. Rotate API Keys (CRITICAL)

**Generate new API keys:**
```powershell
# Generate secure random keys
$devKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
$prodKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

Write-Host "New Development Key: dev-parliament-2025-$devKey"
Write-Host "New Production Key: prod-parliament-2025-$prodKey"
```

**Update your local .env files:**
```bash
# Update .env.development
VITE_API_KEY=replace-with-rotated-api-key

# Update .env.production  
VITE_API_KEY=replace-with-rotated-api-key

# Update cloud-run-api/.env.development
VALID_API_KEYS=replace-with-rotated-api-keys

# Update cloud-run-api/.env.production
VALID_API_KEYS=replace-with-rotated-api-keys
```

### 2. Update Cloud Run Environment Variables

```powershell
# Update production API service
gcloud run services update oireachtas-api `
  --region=us-west1 `
  --update-env-vars="VALID_API_KEYS=replace-with-rotated-api-keys

# Verify update
gcloud run services describe oireachtas-api --region=us-west1
```

### 3. Commit the Removal

```powershell
git commit -m "security: Remove sensitive environment files from git tracking

- Remove .env.development and .env.production from git
- Remove cloud-run-api environment files from git  
- API keys will be rotated separately
- Keep template files (.env.example) for reference

BREAKING CHANGE: Environment files now ignored. Use .env.local for development."
```

### 4. Verify .gitignore is Working

```powershell
# These should NOT appear in git status
git status | Select-String ".env.development"
git status | Select-String ".env.production"
git status | Select-String ".env.local"

# Should return nothing
```

## ðŸ” Additional Security Measures

### Option A: Purge Git History (Recommended if going public)

If this repo will be pushed to GitHub publicly:

```powershell
# Install git-filter-repo
pip install git-filter-repo

# Remove files from entire git history
git filter-repo --path .env.development --invert-paths --force
git filter-repo --path .env.production --invert-paths --force  
git filter-repo --path cloud-run-api/.env.development --invert-paths --force
git filter-repo --path cloud-run-api/.env.production --invert-paths --force

# This creates a fresh history without those files
```

**âš ï¸ WARNING:** This rewrites history. After this, you'll need to force push:
```powershell
git remote add origin <your-github-repo-url>
git push origin --force --all
```

### Option B: Keep History (If private repo)

If keeping the repo private:
1. Just commit the deletion âœ…
2. Rotate API keys âœ…
3. Push to private GitHub repo âœ…
4. Enable GitHub secret scanning âœ…

## ðŸ“‹ Pre-Push Checklist

Before pushing to GitHub:

- [ ] API keys have been rotated
- [ ] Cloud Run services updated with new keys
- [ ] `.env.local` contains your actual Firebase credentials (not in git)
- [ ] Committed the deletion of .env files
- [ ] Verified `.env.*` files don't appear in `git status`
- [ ] Tested application works with new API keys
- [ ] (Optional) Git history purged if going public
- [ ] GitHub secret scanning enabled

## ðŸŽ¯ Current Status

**Ready to commit:** âœ… Yes
**Ready to push:** âš ï¸ After rotating API keys
**Safe for public repo:** âš ï¸ After purging history OR rotating keys

## ðŸ“ Next Steps

1. **Run the commit command:**
   ```powershell
   git commit -m "security: Remove sensitive environment files from tracking"
   ```

2. **Generate and update new API keys**

3. **Push to GitHub:**
   ```powershell
   git push origin main
   ```

4. **Enable GitHub Security Features:**
   - Repository Settings â†’ Security â†’ Secret scanning
   - Repository Settings â†’ Security â†’ Dependabot alerts

## ðŸ†˜ If You've Already Pushed to Public GitHub

1. **IMMEDIATELY** rotate all API keys
2. Check GitHub security alerts
3. Review repository access logs  
4. Consider repository compromise
5. Purge git history and force push
6. Monitor Cloud Run logs for suspicious activity

---

## âœ… Files Now Protected

Your `.gitignore` protects:
```
.env*              # All .env files
!.env.example      # Except examples
!.env.template     # Except templates
```

This means `.env.local` (with Firebase keys) is automatically protected! âœ…



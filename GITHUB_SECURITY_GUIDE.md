# 🔐 GitHub Security Guide - Protecting Sensitive Data

## ⚠️ CRITICAL: Sensitive Files Currently in Git

The following files **ARE TRACKED** in git and may contain sensitive data:
- `.env.development`
- `.env.production`
- `cloud-run-api/.env.development`
- `cloud-run-api/.env.production`

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Remove Sensitive Files from Git History

Run these commands to remove sensitive files from git (but keep them locally):

```powershell
# Remove .env files from git tracking (keeps local files)
git rm --cached .env.development
git rm --cached .env.production
git rm --cached cloud-run-api/.env.development
git rm --cached cloud-run-api/.env.production

# Commit the removal
git commit -m "Remove sensitive environment files from git tracking"
```

### Step 2: Verify .gitignore is Working

Your `.gitignore` already has the correct patterns:
```
.env*
!.env.example
!.env.template
!.env.*.template
!.env.production.template
```

This means:
- ✅ `.env.local` is ignored
- ✅ `.env.development` should be ignored (but was already tracked)
- ✅ `.env.production` should be ignored (but was already tracked)
- ✅ Example/template files are allowed

### Step 3: Check for Exposed Secrets

```powershell
# View what's in the tracked files
git show HEAD:.env.development
git show HEAD:.env.production
```

**If these contain actual API keys or secrets, you MUST:**
1. **Rotate all exposed credentials immediately**
2. Generate new Firebase API keys
3. Regenerate GitHub OAuth secrets
4. Create new API keys

### Step 4: Purge Git History (If Secrets Were Exposed)

If sensitive data was already committed, you need to rewrite git history:

```powershell
# Install git-filter-repo (if not already installed)
# pip install git-filter-repo

# Remove files from entire git history
git filter-repo --path .env.development --invert-paths
git filter-repo --path .env.production --invert-paths
git filter-repo --path cloud-run-api/.env.development --invert-paths
git filter-repo --path cloud-run-api/.env.production --invert-paths

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

**⚠️ WARNING:** This rewrites git history. Only do this if you're the only developer or coordinate with your team.

---

## 📋 Files That ARE SAFE to Commit

✅ **Template/Example Files (already in git):**
- `.env.example`
- `.env.production.template`
- `cloud-run-api/.env.example`
- `terraform.tfvars.example`

✅ **Configuration Files:**
- `firebase.json` (no secrets)
- `package.json`
- All source code files

❌ **Files That MUST NEVER be Committed:**
- `.env.local` (Firebase credentials)
- `.env.development` (if contains real keys)
- `.env.production` (if contains real keys)
- `terraform.tfvars` (actual values)
- `credentials.json`
- `secrets.json`
- Any file with actual API keys, passwords, or tokens

---

## 🔑 Sensitive Data in Your Project

### 1. Firebase Configuration (.env.local)
Contains:
- `VITE_FIREBASE_API_KEY` - Public but shouldn't be in git
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Note:** Firebase API keys are technically "public" (used in frontend), but:
- Keep them out of git for security best practices
- Use Firebase Security Rules to protect your data
- Enable Application Restrictions in Firebase Console

### 2. GitHub OAuth Credentials
- Client ID (public, OK in environment variables)
- Client Secret (MUST be secret, server-side only)

### 3. API Keys
- `VITE_API_KEY` for backend API authentication
- Keep in `.env.local`, never commit

---

## 🛡️ Security Best Practices

### Before Pushing to GitHub:

1. **Verify .gitignore is working:**
   ```powershell
   git status
   # Should NOT show .env.local or .env.development
   ```

2. **Check what will be pushed:**
   ```powershell
   git diff --cached
   # Review all changes before pushing
   ```

3. **Scan for secrets:**
   ```powershell
   # Search for potential secrets in staged files
   git diff --cached | Select-String -Pattern "API_KEY|SECRET|PASSWORD|TOKEN"
   ```

### Setting Up New Environment Variables:

1. **Local Development:**
   - Copy `.env.example` to `.env.local`
   - Fill in actual values
   - `.env.local` is gitignored ✅

2. **Production Deployment:**
   - Use environment variables in Cloud Run
   - Use Google Secret Manager for sensitive data
   - Never hardcode in code

### Firebase Security:

1. **Enable Security Rules:**
   - Go to Firebase Console → Firestore/Storage
   - Set strict security rules
   - Validate user authentication

2. **Enable Application Restrictions:**
   - Firebase Console → Project Settings → General
   - Add authorized domains
   - Restrict API key usage

3. **Enable Identity Platform:**
   - Already done for 2FA
   - Adds additional security features

---

## 📝 Pre-Push Checklist

Before pushing to GitHub, verify:

- [ ] `.env.local` is NOT in `git status`
- [ ] `.env.development` is removed from git tracking
- [ ] `.env.production` is removed from git tracking
- [ ] No API keys in source code (use environment variables)
- [ ] `.gitignore` is properly configured
- [ ] All template files (`.example`, `.template`) are safe
- [ ] No `credentials.json` or `secrets.json` files
- [ ] Firebase Security Rules are enabled
- [ ] Reviewed `git diff --cached` before commit

---

## 🔄 If You Already Pushed Secrets

1. **Rotate ALL exposed credentials immediately:**
   - Firebase: Regenerate API keys
   - GitHub OAuth: Create new OAuth app
   - Any other exposed keys

2. **Rewrite git history** (use git-filter-repo)

3. **Force push** to overwrite remote history

4. **Enable secret scanning:**
   - GitHub → Repository Settings → Security → Secret Scanning

---

## 📚 Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Google Secret Manager](https://cloud.google.com/secret-manager)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

---

## 🆘 Emergency Response

**If secrets were exposed in a public repository:**

1. **IMMEDIATELY** rotate all credentials
2. Check GitHub for any secret scanning alerts
3. Review access logs in Firebase/GCP
4. Enable 2FA on all accounts
5. Consider the repository compromised
6. Start fresh with new credentials

---

## ✅ After Cleanup

Once you've removed sensitive files and rotated credentials:

```powershell
# Verify clean state
git status

# Should only show legitimate source code files
# No .env.local, no .env.development with real secrets

# Safe to push
git push origin main
```

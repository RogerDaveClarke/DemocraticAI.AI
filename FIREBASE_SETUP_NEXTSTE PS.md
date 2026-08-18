# Firebase Setup Next Steps

This file tracks the clean setup sequence for Firebase on a new cloned project.

## 1. Run bootstrap

```powershell
./scripts/bootstrap-gcp.ps1 -ProjectId "<YOUR_PROJECT_ID>" -Region "us-west1"
```

Bootstrap performs:

- Firebase enablement
- Firestore default database creation
- Web app creation
- SDK config extraction
- `.env.production` generation
- Firebase authorized domain update (best effort)

## 2. Confirm Firebase console settings

1. Open Firebase Console for `<YOUR_PROJECT_ID>`.
2. Open Authentication and verify at least one sign-in provider is enabled.
3. Confirm your deployed frontend domain is listed in authorized domains.

## 3. Optional provider setup

- Google provider: set client ID/secret in Firebase provider config.
- GitHub provider: set client ID/secret and callback URL.

## 4. Smoke tests

1. Load frontend URL.
2. Complete sign-in flow.
3. Confirm API calls succeed from authenticated UI.

## 5. Common fixes

- Re-run bootstrap if Firebase keys are missing from `.env.production`.
- If domain login is blocked, manually add frontend domain in Firebase Authentication settings.

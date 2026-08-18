# Single-User GCP Authentication Setup Guide

This setup is for a single trusted user while testing or running a private deployment.

## Recommended controls

- Use OAuth provider sign-in.
- Restrict access by allowed email list.
- Require MFA via Identity Platform TOTP.

## Environment variables

Backend example:

```env
SINGLE_USER_MODE=true
ALLOWED_EMAILS=you@example.com
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLOUD_PROJECT=<YOUR_PROJECT_ID>
JWT_SECRET=<LONG_RANDOM_SECRET>
```

Frontend example:

```env
VITE_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
VITE_API_BASE_URL=https://<YOUR_API_SERVICE_URL>
```

## Setup sequence

1. Deploy with bootstrap script.
2. Configure OAuth provider in Firebase.
3. Enable Identity Platform TOTP.
4. Set allowed email list in backend runtime config.
5. Test sign-in with allowed and non-allowed accounts.

## Validation checklist

- Allowed account can sign in.
- Non-allowed account is rejected.
- MFA challenge is shown when required.
- Protected API routes deny unauthenticated access.

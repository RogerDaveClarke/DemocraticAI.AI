# Google OAuth Setup Guide

This guide covers Google OAuth configuration for cloned deployments.

## 1. Create OAuth client

In Google Cloud Console for `<YOUR_PROJECT_ID>`:

1. Open APIs and Services.
2. Configure OAuth consent screen.
3. Create OAuth 2.0 Client ID (Web application).
4. Add authorized JavaScript origins and redirect URIs for your deployed frontend domain.

## 2. Configure Firebase provider

In Firebase Console for `<YOUR_PROJECT_ID>`:

1. Open Authentication.
2. Enable Google provider.
3. Paste OAuth client ID and secret.
4. Save provider settings.

## 3. Verify authorized domains

Ensure Firebase authorized domains includes:

- `<YOUR_FRONTEND_SERVICE_HOST>`
- Any custom production domain

## 4. Frontend configuration

Set in `.env.production`:

```env
VITE_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
```

## 5. Test flow

1. Load frontend URL.
2. Click Google sign-in.
3. Complete consent flow.
4. Confirm return to app and authenticated state.

## Troubleshooting

- `Unauthorized JavaScript origin`: update authorized origin list.
- `redirect_uri_mismatch`: update redirect URI list.
- `auth/invalid-api-key`: verify Firebase config values in `.env.production`.

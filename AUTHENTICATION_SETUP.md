# Authentication Setup

Parliament AI uses Firebase Identity Platform Email Link authentication as the first factor and Firebase-native TOTP as the required second factor. Password authentication is disabled.

## Canonical setup

Run the repository bootstrap with a GCP project ID and initial administrator email owned by the deployment operator. The bootstrap:

1. Enables Identity Platform and required APIs.
2. Creates or discovers the Firebase web application.
3. Enables Email Link authentication with passwords disabled.
4. Enables Firebase-native TOTP.
5. Creates the initial administrator without a password.
6. Sets `admin: true` and `approved: true` custom claims.
7. Adds the deployed frontend to Firebase authorized domains.
8. Configures the API continuation URL and CORS origin.

## Required frontend values

- `VITE_API_URL`
- `VITE_API_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Required API values

- `NODE_ENV`
- `PORT`
- `GOOGLE_CLOUD_PROJECT`
- `FIREBASE_WEB_API_KEY`
- `PASSWORDLESS_CONTINUE_URL`
- `CORS_ORIGIN`
- `VALID_API_KEYS`

If `RESEND_API_KEY` is configured, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`, and `SUPPORT_EMAIL` are also required. Resend is not part of authentication.

## Verification

1. Request a sign-in link for the initial administrator.
2. Complete the email-link first factor.
3. Enroll TOTP when prompted.
4. Sign out and complete a fresh email-link plus TOTP sign-in.
5. Confirm protected API requests succeed.
6. Confirm a token without second-factor evidence receives `403`.
7. Confirm known and unknown email addresses receive the same link-request response.

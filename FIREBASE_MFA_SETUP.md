# Firebase MFA Setup

This guide covers TOTP MFA setup for projects using Firebase Identity Platform.

## Prerequisites

- Firebase enabled in `<YOUR_PROJECT_ID>`
- Authentication providers configured
- Identity Platform enabled

## Enable MFA in Firebase

1. Open Firebase Console for `<YOUR_PROJECT_ID>`.
2. Go to Authentication.
3. Open Settings.
4. Open Multi-factor authentication.
5. Enable TOTP.
6. Choose enrollment policy (Optional or Required).

## Application behavior

When MFA is required:

- New users complete normal sign-in first.
- Users are prompted to enroll TOTP.
- Returning users must provide TOTP challenge.

## Deployment notes

- Keep provider settings and authorized domains synchronized with deployed frontend domain.
- Ensure backend token validation is enabled for protected endpoints.

## Validation checklist

- TOTP enrollment prompt appears.
- QR setup succeeds in authenticator app.
- TOTP challenge succeeds after sign-out/sign-in.
- Access is denied if second factor is missing when policy is required.

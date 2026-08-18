# Identity Platform Quick Setup

Use this when you need TOTP MFA support in Firebase Authentication.

## Steps

1. Open Google Cloud Console for `<YOUR_PROJECT_ID>`.
2. Search for Identity Platform.
3. Enable Identity Platform for the project.
4. Open Firebase Console for `<YOUR_PROJECT_ID>`.
5. Go to Authentication -> Settings -> Multi-factor authentication.
6. Enable TOTP.
7. Set enrollment policy (Optional or Required).

## Verify

- TOTP appears as an available factor type.
- Users can enroll authenticator apps.
- MFA challenge appears on subsequent sign-ins.

## Notes

- Identity Platform may require billing to be linked to the project.
- Bootstrap scripts do project scaffolding, but provider and MFA policy still need console confirmation.

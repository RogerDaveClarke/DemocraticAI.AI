// Enables TOTP MFA at the Firebase project level via Admin SDK.
// Run: node scripts/enable-totp-mfa.mjs
// Requires Application Default Credentials: run `gcloud auth application-default login` first.
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  console.error('GOOGLE_CLOUD_PROJECT is required');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ projectId });
}

await getAuth().projectConfigManager().updateProjectConfig({
  multiFactorConfig: {
    state: 'ENABLED',
    providerConfigs: [{
      state: 'ENABLED',
      totpProviderConfig: {
        adjacentIntervals: 5,
      },
    }],
  },
});

console.log('TOTP MFA enabled for configured project.');
console.log('Reload the app — the QR code enrollment step will now work.');

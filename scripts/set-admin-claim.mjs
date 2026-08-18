// Grants admin:true custom claim to a Firebase user by UID or email address.
// Run: node scripts/set-admin-claim.mjs <uid-or-email>
// Requires Application Default Credentials: run `gcloud auth application-default login` first.
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  console.error('GOOGLE_CLOUD_PROJECT is required');
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/set-admin-claim.mjs <uid-or-email>');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ projectId });
}

const adminAuth = getAuth();
const isEmail = arg.includes('@');
const user = isEmail
  ? await adminAuth.getUserByEmail(arg)
  : await adminAuth.getUser(arg);

await adminAuth.setCustomUserClaims(user.uid, { admin: true });
console.log(`admin:true set on ${user.uid} (${user.email})`);
console.log('Sign out and back in for the claim to take effect.');

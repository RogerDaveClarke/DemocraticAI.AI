// Marks a Firebase user's email as verified without sending an email.
// Run: node scripts/verify-email.mjs <uid-or-email>
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
  console.error('Usage: node scripts/verify-email.mjs <uid-or-email>');
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

if (user.emailVerified) {
  console.log(`Email already verified for ${user.email} — reload the app and try MFA setup again.`);
  process.exit(0);
}

await adminAuth.updateUser(user.uid, { emailVerified: true });
console.log(`Email verified for ${user.uid} (${user.email})`);
console.log('Reload the app — MFA setup should proceed to the QR code step.');

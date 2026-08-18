import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2]?.trim().toLowerCase();
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId || !email) {
  console.error('Usage: GOOGLE_CLOUD_PROJECT=<project> node scripts/bootstrap-admin.mjs <email>');
  process.exit(1);
}

if (!getApps().length) initializeApp({ projectId });
const auth = getAuth();
let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  user = await auth.createUser({ email, emailVerified: false });
}
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true, approved: true });
console.log(`Initial administrator configured in ${projectId}: ${email}`);

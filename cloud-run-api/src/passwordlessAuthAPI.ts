import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Firestore } from '@google-cloud/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT! });
}

const db = new Firestore();
const genericResponse = { message: 'If this email has an approved account, a sign-in link has been sent.' };

const emailLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: genericResponse,
});

function continueUrl(): string {
  return process.env.PASSWORDLESS_CONTINUE_URL!;
}

export async function generatePasswordlessLink(email: string): Promise<string> {
  return getAuth().generateSignInWithEmailLink(email, {
    url: continueUrl(),
    handleCodeInApp: true,
  });
}

export async function sendPasswordlessEmail(
  email: string,
  _link = '',
  _displayName = '',
  _approved = false,
): Promise<void> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY is not configured');

  const endpoint = 'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key='
    + encodeURIComponent(apiKey);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: 'EMAIL_SIGNIN',
      email,
      continueUrl: continueUrl(),
      canHandleCodeInApp: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firebase email error ${response.status}: ${body}`);
  }
}

async function approvedUser(email: string): Promise<UserRecord | null> {
  let user: UserRecord;
  try {
    user = await getAuth().getUserByEmail(email);
  } catch {
    return null;
  }

  if (user.disabled) return null;
  if (user.customClaims?.admin === true || user.customClaims?.approved === true) return user;

  const approvedRequest = await db.collection('access_requests')
    .where('email', '==', email)
    .where('status', '==', 'approved')
    .limit(1)
    .get();
  if (approvedRequest.empty) return null;

  await getAuth().setCustomUserClaims(user.uid, { ...user.customClaims, approved: true });
  return user;
}

async function requestEmailLink(req: Request, res: Response): Promise<void> {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.json(genericResponse);
    return;
  }

  try {
    const user = await approvedUser(email);
    if (user) await sendPasswordlessEmail(email);
  } catch (error) {
    console.error('[auth] Passwordless sign-in email failed:', error instanceof Error ? error.message : error);
  }

  res.json(genericResponse);
}

export function setupPasswordlessAuthRoutes(app: express.Application): void {
  app.post('/api/auth/email-link', emailLinkLimiter, requestEmailLink);
}

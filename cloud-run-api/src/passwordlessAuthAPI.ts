import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Firestore } from '@google-cloud/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT ?? process.env.VITE_FIREBASE_PROJECT_ID });
}

const db = new Firestore();
const genericResponse = { message: 'If this email has an approved account, a sign-in link has been sent.' };

function authTrace(message: string, details: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.info('[auth-trace]', message, details);
}

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

  authTrace('firebase-email-accepted');
}

/**
 * Raised when the identity backend itself is unreachable or misconfigured
 * (for example missing Application Default Credentials). This is distinct from
 * "this email has no account", which is a normal, expected outcome.
 */
class AuthBackendError extends Error {}

async function approvedUser(email: string): Promise<UserRecord | null> {
  let user: UserRecord;
  try {
    user = await getAuth().getUserByEmail(email);
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      authTrace('user-not-found');
      return null;
    }
    // Credential, network or project-config failures must not masquerade as
    // "no such user" - that silently drops the sign-in email with no signal.
    throw new AuthBackendError(
      `Identity lookup failed (${code ?? 'unknown'}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (user.disabled) {
    authTrace('user-disabled');
    return null;
  }
  if (user.customClaims?.admin === true || user.customClaims?.approved === true) {
    authTrace('user-approved-by-claim', {
      admin: user.customClaims?.admin === true,
      approved: user.customClaims?.approved === true,
    });
    return user;
  }

  const approvedRequest = await db.collection('access_requests')
    .where('email', '==', email)
    .where('status', '==', 'approved')
    .limit(1)
    .get();
  if (approvedRequest.empty) {
    authTrace('user-not-approved');
    return null;
  }

  await getAuth().setCustomUserClaims(user.uid, { ...user.customClaims, approved: true });
  authTrace('user-approved-by-request');
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
    if (error instanceof AuthBackendError) {
      // The identity backend is down/misconfigured for every caller, so this
      // reveals nothing about whether the address has an account.
      res.status(503).json({
        message: 'Sign-in is temporarily unavailable. Please try again shortly.',
      });
      return;
    }
  }

  res.json(genericResponse);
}

export function setupPasswordlessAuthRoutes(app: express.Application): void {
  app.post('/api/auth/email-link', emailLinkLimiter, requestEmailLink);
}

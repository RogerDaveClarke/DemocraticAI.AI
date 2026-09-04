import express, { Request, Response, NextFunction } from 'express';
import { BigQuery } from '@google-cloud/bigquery';
import { Firestore } from '@google-cloud/firestore';
import { initializeApp as adminInitApp, getApps as adminGetApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getRemoteConfig } from 'firebase-admin/remote-config';
import { generatePasswordlessLink, sendPasswordlessEmail } from './passwordlessAuthAPI';
// Uses native fetch (Node 18+) -- no SDK dependency required
async function resendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM!, to: [to], subject, html }),
  });
  if (!r.ok) { const body = await r.text(); throw new Error("Resend error " + r.status + ": " + body); }
  console.log("[email] Sent to", to);
}

async function sendRejectionEmail(toEmail: string): Promise<void> {
  await resendEmail(toEmail, "Your Democratic AI access request",
    '<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2>Access request update</h2><p>Thank you for your interest in Democratic AI. After reviewing your request, we are unable to approve access at this time.</p><p>If you believe this is an error, please contact support.</p></div>'
  );
}
async function sendSuspensionEmail(toEmail: string, _displayName: string): Promise<void> {
  await resendEmail(toEmail, "Your Democratic AI account has been suspended",
    '<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2>Account suspended</h2><p>Your Democratic AI account has been suspended. You will not be able to sign in until your account is reactivated.</p><p>If you believe this is an error, please contact support.</p></div>'
  );
}


if (!adminGetApps().length) {
  adminInitApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT ?? process.env.VITE_FIREBASE_PROJECT_ID });
}

const db = new Firestore({ projectId: process.env.GOOGLE_CLOUD_PROJECT ?? process.env.VITE_FIREBASE_PROJECT_ID });
const billingTable = process.env.GCP_BILLING_EXPORT_TABLE;
const bq = new BigQuery({ projectId: process.env.GOOGLE_CLOUD_PROJECT });

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Unauthorised' }); return; }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const isAdmin = decoded['admin'] === true;
    if (!isAdmin && decoded['approved'] !== true) { res.status(403).json({ error: 'Account not approved' }); return; }
    if (process.env.NODE_ENV !== 'development' && !decoded.firebase?.sign_in_second_factor) { res.status(403).json({ error: 'Two-factor authentication required', code: 'auth/mfa-required' }); return; }
    (req as any).uid = decoded.uid;
    (req as any).isAdmin = isAdmin;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  next();
}

class AdminAPI {
  // -- Access Requests --------------------------------------------------------

  async getAccessRequests(_req: Request, res: Response): Promise<void> {
    try {
      const snap = await db.collection('access_requests').orderBy('requestedAt', 'desc').limit(200).get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async updateAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: string };
      if (!['approved', 'rejected'].includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }
      const docRef = db.collection('access_requests').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) { res.status(404).json({ error: 'Request not found' }); return; }
      const email = doc.data()!.email as string;
      await docRef.update({ status, updatedAt: new Date() });
      if (status === 'approved') {
        try {
          let user;
          try { user = await getAdminAuth().getUserByEmail(email); }
          catch { user = await getAdminAuth().createUser({ email, emailVerified: false }); }
          await getAdminAuth().setCustomUserClaims(user.uid, { ...user.customClaims, approved: true });
          await docRef.update({ uid: user.uid });
          const signInLink = await generatePasswordlessLink(email);
          let emailSent = false; let emailError: string | undefined;
          try { await sendPasswordlessEmail(email, signInLink, user.displayName ?? '', true); emailSent = true; }
          catch (err: any) { emailError = err.message; console.error('[email] Approval email failed:', err.message); }
          res.json({ success: true, uid: user.uid, email, ...(emailSent ? {} : { signInLink }), emailSent, ...(emailError ? { emailError } : {}) });
        } catch (e: any) { res.status(400).json({ error: e.message ?? 'Failed to create user' }); }
      } else {
        sendRejectionEmail(email).catch(e => console.error('[email] Rejection email failed:', e));
        res.json({ success: true });
      }
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  // -- Users ------------------------------------------------------------------

  async listUsers(_req: Request, res: Response): Promise<void> {
    try {
      const result = await getAdminAuth().listUsers(1000);
      const profiles = await Promise.all(result.users.map((user) => db.collection('user_usage_limits').doc(user.uid).get()));
      res.json(result.users.map((u, index) => ({
        uid: u.uid,
        email: u.email ?? '',
        displayName: u.displayName ?? '',
        disabled: u.disabled,
        isAdmin: (u.customClaims as any)?.admin === true,
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime,
        dailyQueryLimit: profiles[index].data()?.dailyQueryLimit ?? 50,
        dailyTokenLimit: profiles[index].data()?.dailyTokenLimit ?? 100000,
      })));
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, displayName } = req.body as { email: string; displayName?: string };
      if (!email) { res.status(400).json({ error: 'Email required' }); return; }
      const normalizedEmail = email.trim().toLowerCase();
      const user = await getAdminAuth().createUser({ email: normalizedEmail, displayName: displayName ?? '', emailVerified: false });
      await getAdminAuth().setCustomUserClaims(user.uid, { approved: true });
      const signInLink = await generatePasswordlessLink(normalizedEmail);
      let emailSent = false; let emailError: string | undefined;
      try { await sendPasswordlessEmail(normalizedEmail, signInLink, displayName ?? '', true); emailSent = true; }
      catch (emailErr: any) { emailError = emailErr.message; console.error('[email] Invite failed:', emailErr.message); }
      res.json({ uid: user.uid, email: user.email, ...(emailSent ? {} : { signInLink }), emailSent, ...(emailError ? { emailError } : {}) });
    } catch (e: any) { res.status(400).json({ error: e.message ?? 'Failed' }); }
  }

  async deleteUserAdmin(req: Request, res: Response): Promise<void> {
    try {
      await getAdminAuth().deleteUser(req.params.uid);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async disableUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await getAdminAuth().getUser(req.params.uid);
      await getAdminAuth().updateUser(req.params.uid, { disabled: true });
      if (user.email) {
        sendSuspensionEmail(user.email, user.displayName ?? '').catch(e =>
          console.error('[email] Suspension email failed:', e)
        );
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async enableUser(req: Request, res: Response): Promise<void> {
    try {
      await getAdminAuth().updateUser(req.params.uid, { disabled: false });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async revokeUserTokens(req: Request, res: Response): Promise<void> {
    try {
      await getAdminAuth().revokeRefreshTokens(req.params.uid);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  // -- Usage ------------------------------------------------------------------

  async getUsage(_req: Request, res: Response): Promise<void> {
    try {
      const snap = await db.collection('chat_executions')
        .orderBy('startTime', 'desc')
        .limit(10000)
        .get();

      const byUser: Record<string, { queries: number; tokensIn: number; tokensOut: number; cost: number }> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.status !== 'completed') return;
        const uid = data.userId ?? 'unknown';
        if (!byUser[uid]) byUser[uid] = { queries: 0, tokensIn: 0, tokensOut: 0, cost: 0 };
        byUser[uid].queries++;
        byUser[uid].tokensIn += data.tokensInput ?? 0;
        byUser[uid].tokensOut += data.tokensOutput ?? 0;
        byUser[uid].cost += data.cost ?? 0;
      });
      const users = await getAdminAuth().listUsers(1000);
      const emails = new Map(users.users.map((user) => [user.uid, user.email ?? '']));
      res.json(Object.fromEntries(Object.entries(byUser).map(([uid, usage]) => [uid, { ...usage, email: emails.get(uid) || uid }])));
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async getFeedback(_req: Request, res: Response): Promise<void> {
    try {
      const [structuredSnapshot, chatSnapshot] = await Promise.all([
        db.collection('feedback').orderBy('timestamp', 'desc').limit(250).get(),
        db.collection('chat_feedback').orderBy('timestamp', 'desc').limit(250).get(),
      ]);
      const feedback = [
        ...structuredSnapshot.docs.map((document) => {
          const data = document.data();
          return { id: document.id, executionId: data.executionId ?? null, sentiment: data.sentiment ?? null, category: data.category ?? null, comment: data.verbatim ?? null, query: data.queryText ?? null, timestamp: data.timestamp, source: 'structured' };
        }),
        ...chatSnapshot.docs.map((document) => {
          const data = document.data();
          return { id: document.id, executionId: data.executionId ?? null, sentiment: data.thumbsUp ? 'up' : data.thumbsDown ? 'down' : null, category: null, comment: data.feedbackText ?? null, query: null, timestamp: data.timestamp, source: 'chat' };
        }),
      ].sort((left, right) => (right.timestamp?.toMillis?.() ?? 0) - (left.timestamp?.toMillis?.() ?? 0));
      res.json(feedback.slice(0, 250));
    } catch (error) {
      console.error('Failed to retrieve feedback:', error);
      res.status(500).json({ error: 'Could not load feedback.' });
    }
  }

  async findTrace(req: Request, res: Response): Promise<void> {
    const requestId = req.query.requestId;
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(requestId)) {
      res.status(400).json({ error: 'A valid request ID is required.' });
      return;
    }
    try {
      const snapshot = await db.collection('chat_executions').where('requestId', '==', requestId).limit(1).get();
      if (snapshot.empty) {
        res.json({ requestId, execution: null, message: 'No persisted chat execution matched this request ID. Check Cloud Run service logs for the API completion event.' });
        return;
      }
      const execution = snapshot.docs[0];
      res.json({ requestId, execution: { id: execution.id, ...execution.data() } });
    } catch (error) {
      console.error('Failed to find trace:', error);
      res.status(500).json({ error: 'Could not retrieve the request trace.' });
    }
  }

  async getTokenLimit(_req: Request, res: Response): Promise<void> {
    try {
      const doc = await db.collection('platform_config').doc('defaults').get();
      res.json({ dailyQueryLimit: doc.exists ? (doc.data()?.dailyQueryLimit ?? 50) : 50 });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async setUserUsageLimit(req: Request, res: Response): Promise<void> {
    const { dailyQueryLimit, dailyTokenLimit } = req.body as { dailyQueryLimit?: number; dailyTokenLimit?: number };
    if (!Number.isInteger(dailyQueryLimit) || dailyQueryLimit! < 1 || !Number.isInteger(dailyTokenLimit) || dailyTokenLimit! < 1000) {
      res.status(400).json({ error: 'Usage limits must be positive whole numbers.' });
      return;
    }
    await db.collection('user_usage_limits').doc(req.params.uid).set({ dailyQueryLimit, dailyTokenLimit, updatedAt: new Date() }, { merge: true });
    res.json({ success: true });
  }

  async getServiceCosts(_req: Request, res: Response): Promise<void> {
    if (!billingTable || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+$/.test(billingTable)) {
      res.status(503).json({ error: 'Billing export is not configured.', setup: 'Set GCP_BILLING_EXPORT_TABLE to your project.dataset.table Cloud Billing export.' });
      return;
    }
    try {
      const query = `
        SELECT
          SUM(IF(usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY), cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0), 0)) AS dayCost,
          SUM(IF(usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY), cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0), 0)) AS weekCost,
          SUM(IF(usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY), cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0), 0)) AS monthCost,
          currency
        FROM \`${billingTable}\`
        WHERE usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        GROUP BY currency
        ORDER BY monthCost DESC
        LIMIT 1`;
      const [rows] = await bq.query({ query, location: 'US' });
      const row = rows[0] || {};
      res.json({ day: Number(row.dayCost || 0), week: Number(row.weekCost || 0), month: Number(row.monthCost || 0), currency: row.currency || 'USD', source: 'Cloud Billing export', updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to retrieve billing export costs:', error);
      res.status(500).json({ error: 'Could not read Cloud Billing export costs.' });
    }
  }

  async setTokenLimit(req: Request, res: Response): Promise<void> {
    try {
      const { dailyQueryLimit } = req.body as { dailyQueryLimit: number };
      if (typeof dailyQueryLimit !== 'number' || dailyQueryLimit < 1) {
        res.status(400).json({ error: 'Invalid limit' }); return;
      }
      await db.collection('platform_config').doc('defaults').set({ dailyQueryLimit }, { merge: true });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  // -- Feature Flags ----------------------------------------------------------

  async getFeatureFlags(_req: Request, res: Response): Promise<void> {
    try {
      const template = await getRemoteConfig().getTemplate();
      const flags: Record<string, boolean> = {};
      for (const [key, param] of Object.entries(template.parameters ?? {})) {
        const val = (param.defaultValue as any)?.value;
        flags[key] = val === 'true' || val === true;
      }
      res.json(flags);
    } catch (e) { res.status(500).json({ error: 'Failed to load flags' }); }
  }

  async setFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const { key, value } = req.body as { key: string; value: boolean };
      if (!key || typeof value !== 'boolean') { res.status(400).json({ error: 'key and value required' }); return; }
      const rc = getRemoteConfig();
      const template = await rc.getTemplate();
      template.parameters[key] = { defaultValue: { value: String(value) } };
      await rc.publishTemplate(template);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message ?? 'Failed' }); }
  }

  // -- Per-user Flag Overrides ------------------------------------------------

  async getFlagUserOverrides(_req: Request, res: Response): Promise<void> {
    try {
      const snap = await db.collection('feature_overrides').get();
      const result: Record<string, { uid: string; email: string }[]> = {};
      snap.docs.forEach(d => { result[d.id] = (d.data().users as any[]) ?? []; });
      res.json(result);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }

  async setFlagUserOverride(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { uids } = req.body as { uids: string[] };
      if (!Array.isArray(uids)) { res.status(400).json({ error: 'uids array required' }); return; }
      const users = await Promise.all(uids.map(async uid => {
        try { const u = await getAdminAuth().getUser(uid); return { uid, email: u.email ?? uid }; }
        catch { return { uid, email: uid }; }
      }));
      await db.collection('feature_overrides').doc(key).set({ users });
      res.json({ success: true, users });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  }
}

export function setupAdminRoutes(app: express.Application): void {
  const api = new AdminAPI();
  const guard = [requireAuth, requireAdmin];

  app.get('/api/admin/access-requests',           ...guard, (req, res) => api.getAccessRequests(req, res));
  app.patch('/api/admin/access-requests/:id',      ...guard, (req, res) => api.updateAccessRequest(req, res));
  app.get('/api/admin/users',                      ...guard, (req, res) => api.listUsers(req, res));
  app.post('/api/admin/users',                     ...guard, (req, res) => api.createUser(req, res));
  app.delete('/api/admin/users/:uid',              ...guard, (req, res) => api.deleteUserAdmin(req, res));
  app.post('/api/admin/users/:uid/disable',        ...guard, (req, res) => api.disableUser(req, res));
  app.post('/api/admin/users/:uid/enable',         ...guard, (req, res) => api.enableUser(req, res));
  app.post('/api/admin/users/:uid/revoke-tokens',  ...guard, (req, res) => api.revokeUserTokens(req, res));
  app.get('/api/admin/usage',                      ...guard, (req, res) => api.getUsage(req, res));
  app.get('/api/admin/feedback',                   ...guard, (req, res) => api.getFeedback(req, res));
  app.get('/api/admin/observability',              ...guard, (req, res) => api.findTrace(req, res));
  app.patch('/api/admin/users/:uid/usage-limit',    ...guard, (req, res) => api.setUserUsageLimit(req, res));
  app.get('/api/admin/service-costs',                ...guard, (req, res) => api.getServiceCosts(req, res));
  app.get('/api/admin/token-limit',                ...guard, (req, res) => api.getTokenLimit(req, res));
  app.patch('/api/admin/token-limit',              ...guard, (req, res) => api.setTokenLimit(req, res));
  app.get('/api/admin/feature-flags',              ...guard, (req, res) => api.getFeatureFlags(req, res));
  app.patch('/api/admin/feature-flags',            ...guard, (req, res) => api.setFeatureFlag(req, res));
  app.get('/api/admin/feature-flag-users',         ...guard, (req, res) => api.getFlagUserOverrides(req, res));
  app.put('/api/admin/feature-flag-users/:key',    ...guard, (req, res) => api.setFlagUserOverride(req, res));
}

# Auth, Admin & Cost Control — Problem Statement and Analysis

_Updated: 2026-08-10_

---

## Problem Statement

The Parliament AI platform is ready for controlled user access, but three foundational gaps prevent safe, governed operation:

1. **Feature flags require a manual rebuild.** `VITE_FEEDBACK_ENABLED` is a Vite env var baked at build time. Changing it requires a Cloud Build run and a redeployment. Runtime toggling is not possible.

2. **Admin identity is not enforced.** `useIsAdmin` compares the signed-in user's email against `VITE_ADMIN_EMAIL` — a value baked into the client bundle. This is client-side only; the API has no way to verify admin identity on requests.

3. **There is no signup gate or cost control.** Firebase Auth is configured but inactive. If auth were enabled with default settings, any person with a Google account could sign up and call Vertex AI (Gemini) without limit.

---

## Context: What Already Exists

| Capability | Status | Notes |
|---|---|---|
| Firebase Auth SDK | Configured | `getAuth(app)` in `firebase.ts`; providers not yet enabled |
| Firebase Remote Config | Configured | `getRemoteConfig(app)` in `firebase.ts` |
| `useFeatureFlag` hook | Built | `fetchAndActivate` + `getValue` on mount; type-safe via `FeatureFlag` |
| `featureFlags.ts` | Built | Flag types and defaults defined; `ff_access_analytics_page` existing example |
| `useIsAdmin` hook | Partial | Reads Firebase Auth user but checks email against a build-time env var |
| Auth pages | Present | `AuthPage.tsx` exists but auth is not active in routing |
| Firestore | Deployed | Used for chat history, executions, feedback |
| Cloud Run API | Deployed | Node.js + TypeScript; firebase-admin available via Firestore dependency |

---

## Analysis

### Gap 1 — Feature Flags

The `useFeatureFlag` hook and Remote Config integration are already production-ready. The only missing piece is a write path: there is no way to update Remote Config parameters without going to the Firebase Console.

| Option | Write path | Admin UI possible? | Rebuild on change? |
|---|---|---|---|
| Current (env var) | Edit .env, redeploy | No | Yes |
| Firebase Console | Manual console edit | No in-app UI | No |
| Admin page via Cloud Run to Remote Config Admin SDK | HTTP call from browser | Yes | No |
| Admin page writing Firestore flags | Firestore write | Yes | No — but creates a second flag store |

**Decision:** Remote Config is already the flag store. Add a `PATCH /api/admin/feature-flags` endpoint to the Cloud Run API (Firebase Admin SDK publishes the updated template). The admin page calls this endpoint. One flag store, one read path, one write path.

The existing `VITE_FEEDBACK_ENABLED` env var migrates to Remote Config flag `ff_access_feedback`.

---

### Gap 2 — Admin Identity

The current check is client-side only:

```typescript
// current — email compared to a baked env var, API cannot verify this
setIsAdmin(Boolean(ADMIN_EMAIL && user?.email === ADMIN_EMAIL));
```

Firebase Custom Claims solve this correctly. `admin: true` is set once via the Firebase Admin SDK, embedded in every ID token the user receives, and verified server-side by `auth.verifyIdToken(token)`. It is cryptographically signed and cannot be forged by the client.

| Option | Server-enforced | Build dependency | Spoof-resistant |
|---|---|---|---|
| Email env var (current) | No | Yes | No |
| Firestore role field | Yes | No | Yes |
| Firebase Custom Claims (chosen) | Yes | No | Yes |

**Decision:** Custom Claims. Set once. Propagates to all sessions. Verified at the API. The `useIsAdmin` hook update is a 2-line change.

---

### Gap 3 — Signup Control and Cost Protection

**Signup gating:**

| Option | Complexity | Recommended? |
|---|---|---|
| Admin provisions users — no self-signup | Low — one Identity Platform setting | Yes |
| Email allowlist + Firebase blocking function | Medium — requires Cloud Functions | Later if needed |
| Email domain restriction | Not applicable | No |

**Decision:** Disable self-enrollment in Identity Platform. Admin creates accounts via Firebase Console or a bootstrap script. Zero code, zero Cloud Functions.

**Cost control:**

| Option | Enforcement point | Bypassable? |
|---|---|---|
| Frontend session limit | Client | Yes |
| Daily quota in Firestore, checked by Cloud Run API | Server | No |
| Cloud Run max-concurrency | Infrastructure | Partial |

**Decision:** Server-side daily quota. Before every `/api/chat` call, the API reads `usage/{uid}/{today}` from Firestore. If count >= limit, return 429. The quota limit is stored as a Remote Config parameter (`ff_quota_daily_limit`) so the admin can adjust it from the admin page without deploying code.

---

## Chosen Architecture

```
Firebase Auth
  Providers: Email/Password + Google Sign-In (enabled in Identity Platform)
  Self-enrollment: DISABLED — admin provisions users
  Custom Claims: admin: true on admin UID (one-time bootstrap)
  ID tokens verified by Cloud Run API on every protected request

Firebase Remote Config  (read path already wired)
  Read: useFeatureFlag() hook — unchanged
  Write: PATCH /api/admin/feature-flags — new, admin-only

Cloud Run API
  Auth middleware: verifyIdToken() on all protected routes
  Admin endpoints /api/admin/* — require admin claim
    GET/PATCH /api/admin/feature-flags
    GET/POST/DELETE /api/admin/users
    GET /api/admin/usage
  Quota: usage/{uid}/{today} checked before every /api/chat call

SPA /admin route — admin claim required
  Feature flag toggles
  User management table
  Daily usage dashboard
```

---

## Constraints

- Remote Config client fetch interval is 12 hours in production. Flag changes will not propagate to existing browser sessions until the next poll. Acceptable for admin toggles; not suitable for emergency shutoffs (use Cloud Run env vars for those).
- Firebase Admin SDK on Cloud Run inherits credentials from the service account. The service account must have `Firebase Admin SDK Administrator Service Agent` role.
- Custom Claims take effect on the next ID token refresh (up to 1 hour). After the bootstrap script, the admin must sign out and back in once.

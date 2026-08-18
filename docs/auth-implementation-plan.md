# Auth, Admin & Cost Control — Implementation Status

_Plan created: 2026-08-10_
_Implemented: 2026-08-12_

All phases are complete and deployed to `oireachtas-api-your-project-number.us-west1.run.app`.

---

## Status summary

| Phase | What | Status |
|---|---|---|
| 0 | Firebase Console setup | ✅ Complete |
| 1 | Bootstrap admin custom claim | ✅ Complete |
| 2 | `useIsAdmin` uses custom claim | ✅ Complete |
| 3 | Auth guard + TOTP MFA gate in SPA | ✅ Complete |
| 4 | Admin SDK endpoints on Cloud Run API | ✅ Complete — 15 endpoints |
| 5 | `/admin` page | ✅ Complete — 4 tabs |
| 6 | Feature flags (Remote Config + per-user Firestore) | ✅ Complete |
| 7 | Per-user quota enforcement | ⏳ Deferred |

---

## Phase 0 — Firebase Console setup ✅

- Email/Password sign-in enabled.
- Self-registration disabled (users must be provisioned by admin).
- TOTP MFA enabled at project level via `node scripts/enable-totp-mfa.mjs`.
- Admin account: `admin@example.com` (UID: `GVFtarU1SEMXoLsWJvTwwYyJ5lU2`).

---

## Phase 1 — Bootstrap admin custom claim ✅

Script: `scripts/set-admin-claim.mjs`

```bash
node scripts/set-admin-claim.mjs admin@example.com
# Output: admin:true set on GVFtarU1SEMXoLsWJvTwwYyJ5lU2
```

Sign out and back in after running for the new JWT to include the claim.

---

## Phase 2 — `useIsAdmin` ✅

`src/hooks/useIsAdmin.ts` reads `idTokenResult.claims.admin === true`. Email-based check removed.

---

## Phase 3 — Auth guard + TOTP MFA enforcement ✅

### Auth guard

`src/hooks/useAuth.ts` returns `{ state: 'loading' | 'unauthenticated' | 'authenticated', user }`.

`src/App.tsx`:
- `loading` → spinner
- `unauthenticated` → `<SignInPage />`
- `authenticated` but MFA not enrolled → `<MfaEnrollModal />` (blocking, cannot be dismissed)
- `authenticated` + MFA enrolled → app renders

### TOTP MFA enrollment modal

`src/components/MfaEnrollModal.tsx` — full-screen blocking modal on first login.

Steps:
1. Re-authenticates if session is stale (`auth/requires-recent-login`).
2. Checks email is verified; auto-sends verification if not (`auth/unverified-email`).
3. Generates TOTP secret via `TotpMultiFactorGenerator.generateSecret()`.
4. Displays QR code (react-qr-code) for authenticator app.
5. Verifies 6-digit code and enrolls the factor.

Utility scripts used during setup:
- `node scripts/verify-email.mjs <email>` — marks email verified via Admin SDK.
- `node scripts/enable-totp-mfa.mjs` — enables TOTP at project level.

### MFA sign-in challenge

`src/components/SignInPage.tsx` handles `auth/multi-factor-auth-required`:
- Extracts resolver via `getMultiFactorResolver(auth, error)`.
- Shows TOTP code input.
- Calls `TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code)` → `resolver.resolveSignIn(assertion)`.

---

## Phase 4 — Admin SDK endpoints ✅

**File:** `cloud-run-api/src/adminAPI.ts`

15 endpoints, all guarded by `requireAuth` + `requireAdmin` middleware.

### User provisioning flow (implemented)

`POST /api/admin/users` creates a user and sends an invite email:
1. Creates Firebase Auth account with a random never-shown password and `emailVerified: true`.
2. Calls `generatePasswordResetLink(email)` — link expires in 1 hour.
3. Sends invite email via Resend REST API (native `fetch`, no SDK).
4. Returns `{ uid, email, resetLink, emailSent }` — reset link is always returned even if email fails.

Email is sent from `noreply@example.com` via Resend (`RESEND_API_KEY` env var).

### Access request notification (implemented)

`POST /api/access-requests` (public endpoint in `chatAPI.ts`):
- Saves request to Firestore `access_requests` collection.
- Fires admin notification email to `admin@example.com` (fire-and-forget, never blocks response).
- Configurable via `ADMIN_NOTIFICATION_EMAIL` env var.

---

## Phase 5 — Admin page ✅

`src/components/sections/Admin.tsx` — 4 tabs:

| Tab | Contents |
|-----|---------|
| Users | List all Firebase Auth accounts. Create user → shows reset link card + copy button. Disable / enable / delete / revoke tokens actions. |
| Access Requests | List submissions from the sign-in page. Approve or deny. |
| Usage | Query usage stats from Firestore via `/api/admin/usage`. |
| Features | Global Remote Config toggles per flag. Per-user early-access overrides with searchable user picker. |

The admin page is only rendered when `useIsAdmin()` is true and is not linked in the main nav for non-admins.

---

## Phase 6 — Feature flags ✅

**File:** `src/config/featureFlags.ts`

Three flags:
```typescript
export type FeatureFlag =
  | 'ff_access_analytics_page'
  | 'ff_access_feedback'
  | 'ff_quota_daily_limit';
```

**`src/hooks/useFeatureFlag.ts`** — two-layer resolution:
1. Checks Firestore `feature_overrides/{flag}` — if the user UID is in the `users` array, returns `true` (override wins).
2. Falls back to Remote Config value.

**Admin API:**
- `GET /api/admin/feature-flags` — returns current Remote Config values.
- `PATCH /api/admin/feature-flags` — publishes an update for a single flag.
- `GET /api/admin/feature-flag-users` — returns per-flag user lists from Firestore.
- `PUT /api/admin/feature-flag-users/:key` — writes `feature_overrides/{key}` with `{ users: [{ uid, email }] }`.

---

## Phase 7 — Per-user quota enforcement ⏳ Deferred

Server-side quota check before the Vertex AI call is designed but not yet implemented.
The `ff_quota_daily_limit` flag exists in the type system and can be toggled; enforcement logic
is the remaining work.

Planned Firestore path: `usage/{uid}/{YYYY-MM-DD}/count → { n: number }`.
Admin account will be exempt.

---

## Open security items

See `security/security_review_08-12-2026.md` for the full findings list.

Priority fixes pending before public launch:

| Item | Finding |
|------|---------|
| C-1 | JWT fallback secrets in `/api/auth` routes — set via Secret Manager |
| C-2 | Auth rate limiter is a no-op |
| H-1 | `trust proxy` not set — rate limiting broken at scale |
| H-3 | Firebase ID token stored in `sessionStorage` — remove the line |
| M-2 | `APIUsageMonitor` writes `undefined` to Firestore on every request |

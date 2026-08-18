# Security Vulnerability Report — Parliament AI Platform

**Assessed:** `cloud-run-api/`, `src/` (frontend), deployed API at `the production Cloud Run API`
**Date:** 2026-08-12
**Reviewer:** GitHub Copilot (automated static analysis + live endpoint probing)
**Safe to publish current working tree:** CONDITIONAL — see C-1

---

## CRITICAL — Exploit immediately if exposed

---

### C-1 · Hardcoded JWT signing secrets in production
**File:** `cloud-run-api/src/routes/auth.ts` lines 33–34

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
```

The Cloud Run service has **only `RESEND_API_KEY` set as an env var**. That means `JWT_SECRET` and
`JWT_REFRESH_SECRET` are the literal fallback strings above. Anyone who reads this repository can
forge arbitrary JWT tokens for any user, bypass authentication, and gain admin access.

**Remediation:** Set secrets via Secret Manager immediately.
```powershell
gcloud run services update oireachtas-api --region us-west1 \
  --set-secrets "JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh-secret:latest"
```

---

### C-2 · Auth rate limiter is a no-op
**File:** `cloud-run-api/src/routes/auth.ts` lines 61–63

```typescript
const authRateLimit = (_req, _res, next) => {
  // Rate limiting implementation
  next();  // ← passes every request unconditionally
};
```

Applied to Google OAuth and Microsoft OAuth login endpoints. Zero rate protection on auth endpoints
allows unlimited login attempts, token exchange, and MFA verification.

**Remediation:** Apply the `generalLimiter` already defined in `index.ts` to the auth router, or
implement a real per-IP counter here.

---

## HIGH — Significant attack surface

---

### H-1 · `trust proxy` not configured — rate limiting broken in production
**File:** `cloud-run-api/src/index.ts`

Cloud Run routes all traffic through a Google load balancer. Without `app.set('trust proxy', 1)`,
`req.ip` returns the load balancer IP for every user. Rate limit buckets are shared across all
users. Effective limit = `configured limit × number of concurrent users`.

**Remediation:** Add `app.set('trust proxy', 1)` at the top of app setup.

---

### H-2 · `/health` endpoint leaks process memory metrics
**File:** `cloud-run-api/src/index.ts`

```typescript
res.json({ status: 'healthy', uptime: process.uptime(), memory: process.memoryUsage(), ... });
```

`process.memoryUsage()` is publicly accessible with no authentication. Exposes heap size, external
buffer sizes, and rss — aids targeting of memory exhaustion attacks.

**Remediation:** Remove `memory` from the public response body.

---

### H-3 · Firebase ID token stored in `sessionStorage`
**File:** `src/contexts/FirebaseAuthContext.tsx` line 319

```typescript
sessionStorage.setItem('authToken', token);
```

`sessionStorage` is accessible to any JavaScript executing on the page. Any XSS vector can
exfiltrate this token (valid 1 hour) and call authenticated API endpoints. The `adminFetch` helper
already calls `auth.currentUser.getIdToken()` at request time — the cached copy is redundant and
harmful.

**Remediation:** Remove this line entirely.

---

### H-4 · `innerHTML` mutation with data originating from the API
**File:** `src/components/quizzes/WhichMinisterQuiz.tsx` line 442

```typescript
target.parentElement!.innerHTML = `<div ...>${result.name.split(' ').map(n => n[0]).join('')}</div>`;
```

`result.name` comes from the Cloud Run API. If the parliamentary data source or API were ever
compromised, a crafted name value would execute as HTML (stored XSS).

**Remediation:** Use `textContent` or create a DOM node explicitly instead of `innerHTML`.

---

### H-5 · `axios` — 14+ HIGH CVEs (prototype pollution chain)
**Packages:** `axios` in both `cloud-run-api/` and `src/`

| CVE | Impact |
|-----|--------|
| GHSA-w9j2-pvgh-6h63 | Authentication bypass via prototype pollution in `validateStatus` |
| GHSA-3w6x-2g7m-8v23 | JSON response tampering via `parseReviver` prototype pollution |
| GHSA-6chq-wfr3-2hj9 | Header injection via prototype pollution |
| GHSA-fvcv-3m26-pcqx | Unrestricted cloud metadata exfiltration (SSRF) via header injection |
| GHSA-m7pr-hjqh-92cm | `no_proxy` bypass via IP alias (SSRF) |
| GHSA-35jp-ww65-95wh | Full MITM via prototype pollution in `config.proxy` |
| GHSA-pmwg-cvhr-8vh7 | NO_PROXY bypass via RFC 1122 loopback subnet |
| GHSA-xhjh-pmcv-23jw | Null byte injection via reverse-encoding |
| GHSA-445q-vr5w-6q77 | CRLF injection in multipart/form-data |
| GHSA-hfxv-24rg-xrqf | ReDoS via cookie name injection |
| GHSA-62hf-57xw-28j9 | DoS via unbounded recursion in `toFormData` |
| GHSA-3g43-6gmg-66jw | Credential theft via prototype pollution in config merge |
| GHSA-898c-q2cr-xwhg | DoS and header injection via prototype pollution read-side gadgets |
| GHSA-3p68-rc4w-qgx5 | SSRF via NO_PROXY hostname normalisation bypass |

**Remediation:** `npm install axios@latest` in both workspaces; run `npm audit fix`.

---

### H-6 · `basic-ftp` CRITICAL path traversal (GHSA-5rq4-664w-9x2c)
**Package:** transitive dependency, both workspaces

Path traversal in `downloadToDir()` allows arbitrary file read on the server.

**Remediation:** `npm audit fix` — fix is available without breaking changes.

---

### H-7 · `websocket-driver` CRITICAL resource limit bypass (GHSA-mp7j-qc5w-4988)
**Package:** transitive via `ws`, frontend workspace

Resource limit bypass via message compression causes memory exhaustion DoS.

**Remediation:** `npm audit fix`.

---

### H-8 · `@grpc/grpc-js` malformed message server crash
**CVEs:** GHSA-5375-pq7m-f5r2, GHSA-99f4-grh7-6pcq
**Package:** transitive via `@google-cloud/firestore`

A malformed compressed gRPC message can crash the Cloud Run server process. All Firestore
operations pass through this library.

**Remediation:** `npm audit fix` in `cloud-run-api/`.

---

## MEDIUM — Fix before public launch

---

### M-1 · `VALID_API_KEYS` not set on Cloud Run — chat endpoint returns 401
Only `RESEND_API_KEY` is set on the deployed service. The `validateApiKey` middleware guards
`POST /api/chat`. With `VALID_API_KEYS` unset, `validKeys = []` — every chat request fails.
Chat is likely completely broken in production.

**Remediation:**
```powershell
gcloud run services update oireachtas-api --region us-west1 --set-env-vars "VALID_API_KEYS=<key>"
```
Ensure `VITE_API_KEY=<same-key>` is set in the frontend build environment.

---

### M-2 · `APIUsageMonitor` writes `undefined` to Firestore on every unauthenticated request
**File:** `cloud-run-api/src/utils/APIUsageMonitor.ts` line 74

```typescript
apiKey: req.headers['x-api-key'] ? 'present' : undefined,
```

Firestore rejects `undefined` field values. This throws on every monitored request without an API
key, pollutes logs with unhandled rejections, and triggers the global error handler silently.

**Remediation:** Change `undefined` to `null`.

---

### M-3 · Dead `/api/auth` JWT system creates parallel attack surface
**File:** `cloud-run-api/src/routes/auth.ts`

A complete second auth system (JWT + speakeasy TOTP + Firestore `users` collection) is registered
at `/api/auth` alongside Firebase Auth. The main application uses Firebase Auth exclusively. These
routes expose login, MFA setup/verify, token refresh, and logout with the known-weak JWT secrets
from C-1.

**Remediation:** Remove `authRoutes` from `index.ts` or gate behind a feature-flag env var pending
formal removal.

---

### M-4 · In-memory rate limiting breaks under horizontal scaling
`express-rate-limit` without a shared backing store holds counters per Cloud Run instance.
Effective rate limit per user = `configured limit × instance count`.

**Remediation:** Pin to `--max-instances 1` for low-traffic deployment, or add a Firestore/Redis
rate limit store.

---

### M-5 · `brace-expansion` DoS (GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895)
Three separate DoS CVEs in `brace-expansion` in both workspaces. Exponential-time expansion on
crafted input causes out-of-memory crash or infinite loop.

**Remediation:** `npm audit fix`.

---

## LOW — Clean up when convenient

---

### L-1 · Google Analytics Measurement ID hardcoded in source
**File:** `src/utils/inject-ga.ts` line 2

`G-Z8N323380M` is visible in the compiled browser bundle. Anyone can send arbitrary events to
this GA property and pollute analytics data.

**Remediation:** Move to `VITE_GA_ID` env var.

---

### L-2 · `@babel/core` arbitrary file read (GHSA-4x5r-pxfx-6jf8)
Dev dependency only — not included in production bundle. No runtime risk, but should be updated.

---

## Findings summary

| ID | Severity | Area | Finding |
|----|----------|------|---------|
| C-1 | CRITICAL | Auth secrets | Hardcoded JWT fallback secrets active in production |
| C-2 | CRITICAL | Auth rate limiting | `authRateLimit` middleware is a no-op |
| H-1 | HIGH | Rate limiting | `trust proxy` not set — req.ip returns load balancer IP |
| H-2 | HIGH | Info disclosure | `/health` exposes `process.memoryUsage()` publicly |
| H-3 | HIGH | Token storage | Firebase ID token written to `sessionStorage` |
| H-4 | HIGH | XSS | `innerHTML` mutation with API-sourced data |
| H-5 | HIGH | Dependencies | `axios` 14+ prototype pollution CVEs |
| H-6 | HIGH | Dependencies | `basic-ftp` path traversal (CRITICAL CVE) |
| H-7 | HIGH | Dependencies | `websocket-driver` resource limit bypass (CRITICAL CVE) |
| H-8 | HIGH | Dependencies | `@grpc/grpc-js` server crash on malformed message |
| M-1 | MEDIUM | Configuration | `VALID_API_KEYS` unset — chat endpoint returns 401 |
| M-2 | MEDIUM | Reliability | `undefined` Firestore field on every monitored request |
| M-3 | MEDIUM | Attack surface | Dead JWT auth system active at `/api/auth` |
| M-4 | MEDIUM | Rate limiting | In-memory store breaks under horizontal scaling |
| M-5 | MEDIUM | Dependencies | `brace-expansion` DoS (3 CVEs) |
| L-1 | LOW | Privacy | GA Measurement ID hardcoded in source bundle |
| L-2 | LOW | Dependencies | `@babel/core` arbitrary file read (dev only) |

---

## Dependency totals

| Workspace | Critical | High | Moderate | Low |
|-----------|----------|------|----------|-----|
| `cloud-run-api/` | 0 | 18 | 17 | 3 |
| Frontend (`src/`) | 2 | 25 | 12 | 1 |

---

## Immediate action checklist (before any public users)

- [ ] **C-1** — Set `JWT_SECRET` and `JWT_REFRESH_SECRET` via GCP Secret Manager
- [ ] **C-2** — Apply real rate limiting to `/api/auth` endpoints
- [ ] **H-3** — Remove `sessionStorage.setItem('authToken', token)` from `FirebaseAuthContext.tsx`
- [ ] **M-2** — Fix `undefined` → `null` in `APIUsageMonitor.ts`
- [ ] **H-5 + M-5 + H-6 + H-7** — Run `npm audit fix` in both workspaces
- [ ] **M-1** — Set `VALID_API_KEYS` env var on Cloud Run
- [ ] **H-1** — Add `app.set('trust proxy', 1)` to `index.ts`


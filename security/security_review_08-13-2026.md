# Security Review — Parliament AI Platform
**Date:** 2026-08-13
**Reviewer:** GitHub Copilot (automated static analysis)
**Scope:** `cloud-run-api/src/`, `src/` (frontend), deployed services
**Previous review:** `security/security_review_08-12-2026.md`

---

## Executive Summary

Since the 2026-08-12 review, **all dependency vulnerabilities have been resolved** (0 CVEs in both workspaces). Six of the eight HIGH findings and both MEDIUM findings related to infrastructure have been fixed. The attack surface has meaningfully shrunk. Three findings from the previous report remain open; four new findings are identified in this review.

---

## Status of Previous Findings

| ID | Previous severity | Status |
|----|------------------|--------|
| C-1 | CRITICAL | **PARTIAL** — fallback strings still in code; Cloud Run secrets now set |
| C-2 | CRITICAL | **FIXED** — `authRateLimit` is now a real `express-rate-limit` instance |
| H-1 | HIGH | **FIXED** — `app.set('trust proxy', 1)` added |
| H-2 | HIGH | **FIXED** — `memoryUsage()` removed from both health endpoints |
| H-3 | HIGH | **FIXED** — `sessionStorage.setItem('authToken', ...)` removed |
| H-4 | HIGH | **FIXED** — `WhichMinisterQuiz` now uses `textContent` + `createElement` |
| H-5 | HIGH | **FIXED** — 0 vulnerabilities (axios updated) |
| H-6 | HIGH | **FIXED** — 0 vulnerabilities |
| H-7 | HIGH | **FIXED** — 0 vulnerabilities |
| H-8 | HIGH | **FIXED** — 0 vulnerabilities |
| M-1 | MEDIUM | **FIXED** — `VALID_API_KEYS` set on Cloud Run |
| M-2 | MEDIUM | **FIXED** — `undefined` → `null` in `APIUsageMonitor.ts` |
| M-3 | MEDIUM | **FIXED** — JWT auth routes now gated behind `LEGACY_AUTH_ROUTES=true` env var |
| M-4 | MEDIUM | **OPEN** — in-memory rate limiting still breaks under horizontal scaling |
| M-5 | MEDIUM | **FIXED** — 0 vulnerabilities |
| L-1 | LOW | **OPEN** — GA Measurement ID still hardcoded |
| L-2 | LOW | **FIXED** — 0 vulnerabilities |

---

## Open Findings from Previous Review

---

### C-1 (carry-forward) · Hardcoded JWT fallback secrets
**File:** `cloud-run-api/src/routes/auth.ts` lines 34–35
**Status:** Production risk reduced — Cloud Run secrets are now set. However, the fallback strings remain in source.

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
```

If a Cloud Run deployment ever drops the secret binding (redeploy without `--set-secrets`, scaling to a new region, etc.), the application will silently fall back to the well-known strings. Any token signed with the fallback secrets remains valid.

**Remediation:** Replace the fallbacks with a hard startup failure:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('JWT secrets not configured — refusing to start');
  process.exit(1);
}
```
The `/api/auth` routes are already disabled by default (`LEGACY_AUTH_ROUTES` gate), making this lower urgency than originally rated, but the strings should still be removed.

**Revised severity:** MEDIUM (was CRITICAL — production exposure now requires env var misconfiguration)

---

### M-4 (carry-forward) · In-memory rate limiting
**File:** `cloud-run-api/src/index.ts`
`express-rate-limit` without a Redis/Firestore store counts requests per Cloud Run instance. With `--max-instances=1` (current configuration) this is not exploitable, but a scale-up event would reset all counters.

**Remediation:** Keep `--max-instances=1` or add a Firestore rate limit store. No change required at current traffic.

**Severity:** LOW (was MEDIUM — `--max-instances=1` is confirmed set)

---

### L-1 (carry-forward) · Hardcoded GA Measurement ID
**File:** `src/utils/inject-ga.ts` line 2

`G-Z8N323380M` is in the compiled browser bundle. Anyone can send arbitrary events to this property.

**Remediation:** Move to `VITE_GA_ID` env var.

**Severity:** LOW

---

## New Findings

---

### N-1 · `APIUsageMonitor` retry logic doubles buffer exponentially
**File:** `cloud-run-api/src/utils/APIUsageMonitor.ts` lines 187–190
**Severity:** MEDIUM

```typescript
// Keep records in buffer for retry
this.usageBuffer.unshift(...this.usageBuffer); // ← BUG
```

After a Firestore batch write fails, the intent is to re-queue the records that failed. Instead `this.usageBuffer` (which was cleared two lines earlier to `[]`) is spread into itself — inserting nothing. The `records` variable (the actual failed batch) is silently dropped.

Separately: because `this.usageBuffer` was already reassigned to `[]` before this line, the spread produces zero items, meaning **failed usage records are silently discarded with no retry**.

**Remediation:**
```typescript
this.usageBuffer.unshift(...records); // restore the failed batch for retry
```

---

### N-2 · `/api/debug` is a public unauthenticated endpoint
**File:** `cloud-run-api/src/index.ts` lines 432–472
**Severity:** MEDIUM

```typescript
app.get('/api/debug', async (req, res) => { // no auth middleware
  const { party = 'Sinn_Féin' } = req.query;
  // ... runs Firestore queries, returns member data
```

The endpoint accepts arbitrary `?party=` values and runs Firestore queries against the members collection, returning names and party membership. No authentication is required. While the data is not confidential, the endpoint:

1. Was created for debugging and should not be permanently exposed in production.
2. Reveals the Firestore data model and query structure to unauthenticated callers.
3. Can be used to enumerate all parties and member counts.

**Remediation:** Add `validateApiKey` middleware and remove the endpoint before public launch:
```typescript
app.get('/api/debug', validateApiKey, async (req, res) => { ... });
```
Or gate behind `NODE_ENV !== 'production'`.

---

### N-3 · `resetLink` (password reset URL) written to Cloud Run request log
**File:** `cloud-run-api/src/adminAPI.ts` lines 100, 136
**Severity:** LOW

```typescript
res.json({ success: true, uid, email, resetLink, emailSent }); // line 100
res.json({ uid: user.uid, email: user.email, resetLink, emailSent }); // line 136
```

When an admin approves an access request or creates a user, the Firebase password reset link is returned in the JSON response body. Cloud Run captures full request/response bodies in its request log if detailed logging is enabled. The link is valid for 1 hour and allows the holder to set an arbitrary password for the target account.

The design is intentional (admin needs the link when email delivery fails). The risk is that GCP log access is broader than admin panel access.

**Remediation:** Either accept the risk and document it, or truncate the link in the log by sending it only via email and returning `{ emailSent: true }` without the raw URL. For now, ensure Cloud Run request logging does not capture response bodies (it does not by default).

---

### N-4 · Startup log misleads operators about CORS policy
**File:** `cloud-run-api/src/index.ts` line 790
**Severity:** LOW

```typescript
logInfo(`CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
```

This logs `CORS Origin: *` on every startup unless `CORS_ORIGIN` is set, implying CORS is open. In reality, CORS is enforced against a hardcoded `allowedOrigins` array regardless of `CORS_ORIGIN`. An operator reading the log could incorrectly conclude the API is open to all origins and take unnecessary action, or inversely trust a configured wildcard `CORS_ORIGIN` without realising the array also allows several fixed origins.

**Remediation:**
```typescript
logInfo(`CORS: ${allowedOrigins.length} allowed origins (CORS_ORIGIN env var: ${process.env.CORS_ORIGIN || 'not set'})`);
```

---

### N-5 · Weak email validation on access request endpoint
**File:** `cloud-run-api/src/chatAPI.ts` line 451
**Severity:** LOW

```typescript
if (!email || typeof email !== 'string' || !email.includes('@')) {
```

A value like `@` or `a@` passes this check and will be stored in Firestore as a pending access request. When an admin approves it, `getAdminAuth().createUser({ email: '@' })` will throw a Firebase error. The thrown error message is returned to the admin client. No data is corrupted, but malformed requests consume Firestore writes and admin attention.

**Remediation:** Apply the same regex used in `src/utils/security.ts`:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(normalised)) { res.status(400).json({ error: 'Valid email required' }); return; }
```

---

## Findings Summary

| ID | Severity | Area | Finding |
|----|----------|------|---------|
| C-1 ↓ | MEDIUM | Auth secrets | JWT fallback strings remain in source; production secrets now set |
| M-4 ↓ | LOW | Rate limiting | In-memory store; `--max-instances=1` mitigates for now |
| L-1 | LOW | Privacy | GA Measurement ID hardcoded in bundle |
| N-1 | MEDIUM | Reliability/Security | `APIUsageMonitor` retry logic silently discards failed records |
| N-2 | MEDIUM | Access control | `/api/debug` endpoint is public and unauthenticated |
| N-3 | LOW | Info disclosure | Password reset URL appears in API response (Cloud Run log risk) |
| N-4 | LOW | Operations | Startup CORS log misleads about actual policy |
| N-5 | LOW | Input validation | Weak email check on `/api/access-requests` |

---

## Dependency Audit

| Workspace | Critical | High | Moderate | Low |
|-----------|----------|------|----------|-----|
| `cloud-run-api/` | 0 | 0 | 0 | 0 |
| Frontend (`src/`) | 0 | 0 | 0 | 0 |

**Previous review totals:** 2 critical, 43 high, 29 moderate, 4 low. All resolved.

---

## Remediation Priority

1. **N-1** — Fix the `APIUsageMonitor` retry bug. One-line fix. Silent data loss under failure.
2. **N-2** — Gate `/api/debug` behind `validateApiKey` or remove it.
3. **C-1** — Remove the JWT fallback strings and fail hard on missing secrets.
4. **N-5** — Strengthen email validation regex on access request endpoint.
5. **N-4** — Fix the misleading CORS startup log.
6. **L-1** / **N-3** — Low priority, fix at convenience.

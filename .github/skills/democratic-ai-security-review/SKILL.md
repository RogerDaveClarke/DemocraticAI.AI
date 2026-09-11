---
name: democratic-ai-security-review
description: "Review Democratic AI or Parliament AI changes for security, privacy, authentication, authorization, AI/RAG safety, Oireachtas data integrity, GCP IAM, Terraform, dependencies, CI/CD, secrets, and release readiness. Use before commit, merge, deployment, or when fixing a security finding."
argument-hint: "Describe the change, review scope, or release candidate"
user-invocable: true
disable-model-invocation: false
---

# Democratic AI Security Review

## Purpose

Perform an evidence-based defensive review of this repository. Apply OWASP ASVS and API Security principles, NIST SSDF, Microsoft SDL-style secure engineering, CIS Google Cloud guidance, and NIST AI RMF where relevant. These are reference standards, not claims of certification or vendor endorsement.

## Canonical Context

Read these sources before reviewing:

1. `CLAUDE.md`
2. `docs/DEMOCRATIC_AI_DESIGN_GOVERNANCE_SYSTEM.md`, if present
3. `docs/platform-architecture.md`
4. `AI_SYSTEM_CARD.md`
5. `SECURITY.md`
6. `.gitignore`
7. Applicable files in `.github/workflows/`, Terraform, Dockerfiles, and deployment scripts

Report missing, contradictory, placeholder, or stale governance material. Official parliamentary records remain authoritative. Keep official facts distinct from AI-generated summaries and inference.

## Review Procedure

### 1. Establish Scope

- Inspect working-tree, staged, and branch changes without modifying them.
- Identify affected users, data, endpoints, identities, cloud resources, third parties, and deployment paths.
- Classify each changed surface using the matrix below.
- Identify whether generated `dist/` output or deployment artifacts must match changed source.
- Never print secrets or personal data found during inspection.

### 2. Review Applicable Domains

#### Repository and supply chain

- Scan staged content and Git history for credentials, private keys, tokens, tenant configuration, Terraform state, logs, exports, screenshots, and personal data.
- Review every package manifest and lockfile independently, including root, `cloud-run-api`, and `scripts`.
- Require immutable GitHub Action SHAs, least workflow permissions, pinned scanner versions, lockfile integrity, supported runtimes, and reproducible installs.
- Treat `scripts/verify-security.mjs` as an orchestrator. Placeholder tests remain non-evidence; report the result of each real command it executes.

#### Browser application

- Review XSS and unsafe Markdown rendering, redirects, token storage, OAuth callback handling, CSP, HSTS, clickjacking, MIME sniffing, referrer policy, permissions policy, CORS assumptions, exposed configuration, and sensitive telemetry.
- Confirm authorization is not enforced only through routes, feature flags, or hidden controls in the browser.

#### API, identity, and authorization

- Inventory public and protected Express routes and justify anonymous access.
- Verify Firebase ID-token signature, issuer, audience, expiry, revocation where required, approved/admin claims, and second-factor evidence.
- Review Google, Microsoft, and passwordless flows for account enumeration, identity-provider confusion, replay, open redirect, stale claims, disabled users, and incomplete account lifecycle handling.
- Require server-side object-level authorization for reports, prompts, feedback, chat history, feature overrides, access requests, and administrative actions.
- Test anonymous, malformed-token, expired/revoked-token, insufficient-role, missing-MFA, cross-user, valid-user, and valid-admin cases as applicable.
- Review request schemas, content types, size limits, throttling, idempotency, error disclosure, SSRF, injection, and cost-abuse controls.

#### Data protection and privacy

- Classify official Oireachtas public data separately from user email addresses, queries, feedback, reports, access requests, session identifiers, usage records, and security logs.
- Review minimization, purpose, notice, legal basis, retention, deletion, export, access control, backup scope, data residency, logging, and breach response under applicable Irish/EU requirements.
- Do not call pseudonymous data anonymous. Never claim legal compliance without qualified review.

#### AI and RAG

- Review prompt injection from users and retrieved parliamentary records, instruction hierarchy, data exfiltration, unsafe tool use, denial-of-wallet, model/version changes, and provider data handling.
- Require source provenance and citations that resolve to official records. Unsupported claims, fabricated quotations or votes, and uncalibrated confidence must not be presented as official fact.
- Verify sparse or conflicting evidence produces explicit uncertainty and that model output cannot overwrite authoritative records.
- Check AI disclosures, limitations, feedback handling, evaluation evidence, and system-card updates for material AI changes.

#### Oireachtas ingestion and data integrity

- Validate source allowlists, TLS use, schema validation, pagination and record limits, retry/backoff, idempotency, duplicate handling, partial failure, freshness markers, provenance, and safe XML parsing.
- Verify ingestion identities have write access only to required datasets or collections and that public source content cannot become executable instructions.

#### GCP and infrastructure

- Review Cloud Run frontend/API services, Cloud Run jobs, Scheduler, Firebase Identity Platform, Firestore, BigQuery, Vertex AI, Secret Manager, logging, monitoring, and service accounts found in repository configuration.
- Require dedicated workload identities, least privilege, no basic roles, secret-level grants, explicit ingress and authentication decisions, encryption, audit logs, alert delivery, quotas, rollback, backup/restore evidence, and documented RPO/RTO.
- Derive expected resources and runtimes from Terraform and deployment configuration. Never assume a fixed workload count or runtime version.
- Before any live check, verify the active GCP account, project, and region. Read-only checks are preferred; never apply Terraform or mutate production during review.

### 3. Run the Change-Impact Matrix

Run all checks applicable to the changed surface. Record the exact command, result, and limitation.

#### Every first-party code change

```text
npm run verify:repo-security
npm run check:clone-isolation
npm run typecheck
npm run lint
npm run build
npx playwright test
```

`npm run verify:repo-security` is the canonical repository gate and must fail closed when any required security check fails.

Run Snyk Code on changed first-party code when the tool is available. Run Semgrep using the repository's pinned configuration. Exclude dependencies, generated bundles, and vendored code from SAST; assess those with dependency scanning.

#### API, authentication, authorization, or Firestore behavior

```text
npm --prefix cloud-run-api ci
npm --prefix cloud-run-api run build
npm --prefix cloud-run-api run lint
npm --prefix cloud-run-api test -- --runInBand
```

Absence of real API tests is `NOT RUN` and blocks authentication or authorization changes. Do not use `--passWithNoTests` to manufacture a pass. Add behavioral tests in apply mode when requested.

#### Dependency or lockfile changes

```text
npm audit --audit-level=high
npm --prefix cloud-run-api audit --audit-level=high
npm --prefix scripts audit --audit-level=high
```

Run production-only audits as additional evidence. A development-only result may be risk-assessed but must not be silently dismissed.

#### Secrets and repository exposure

```text
gitleaks protect --staged --redact --no-banner
```

Also use the repository's CI-equivalent TruffleHog history scan when available. Never echo a detected value. If a committed secret is suspected, stop, redact the report, and instruct the user to revoke or rotate it; history rewriting requires explicit approval.

#### Python ingestion changes

Use the project virtual environment. Compile changed modules, run discovered Python tests, and run `pip-audit` against each applicable requirements file when available. A repository with no ingestion tests does not receive a test pass.

#### Terraform or cloud configuration changes

```text
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

Run policy or configuration scanners when available. Never run `terraform apply` as part of review.

#### Workflow changes

- Validate workflow syntax and permissions.
- Require immutable action SHAs and pinned scanner/tool versions.
- Check pull-request behavior, fork safety, secret exposure, artifact retention, cache poisoning, and deployment environment protection.

#### Release review

- Run all repository, frontend, API, ingestion, dependency, secret, IaC, and end-to-end checks that exist.
- Verify the deployed frontend and API headers and negative authorization behavior against the intended environment.
- Compare live read-only GCP inventory and IAM with repository-defined expectations after authenticating and confirming project scope.
- Require recent restore evidence, alert-delivery evidence, rollback instructions, incident contacts, and an accurate AI system card.

### 4. Evaluate Evidence

Use only these statuses:

- `PASS`: command or behavioral check completed successfully for the stated scope.
- `FAIL`: check completed and found a blocking defect.
- `NOT APPLICABLE`: explain why the surface is unaffected.
- `NOT RUN`: check was unavailable, unsafe, lacked prerequisites, timed out, had no real tests, or was skipped.

A required `NOT RUN` is a blocker. A successful scanner does not establish absence of vulnerabilities. A successful deployment command does not prove deployed posture.

### 5. Repair in Apply Mode

- Fix the root cause with the smallest change consistent with existing architecture.
- Rerun the narrow check that exposed the problem immediately after the edit.
- Then rerun every applicable broader check from the matrix.
- Do not suppress diagnostics, reduce test strength, loosen authentication, broaden IAM, or add exceptions merely to pass.
- Do not edit unrelated findings unless they are Critical/High and directly prevent safe completion; report them separately.

## Commit and Release Enforcement

The review can advise but cannot guarantee that every commit invokes it. Require deterministic enforcement through:

1. One repository-owned verification command that fails on any required check.
2. A checked-in pre-commit or pre-push hook calling that command.
3. CI running the same command from a clean checkout.
4. Branch protection requiring the CI result before merge.
5. A commit helper that fails closed and does not push by default.

In this repository, the expected command is `npm run verify:repo-security` and hooks are expected under `.githooks/` with `core.hooksPath` configured.

Until these controls exist and are verified, report commit enforcement as a finding. Do not commit or push from this skill.

## Accepted Risk

Accept a risk only when a repository record includes the owner, affected assets, rationale, compensating controls, approval, and review expiry. An expired or undocumented acceptance is unresolved.

## Report Format

1. **Decision:** `BLOCK`, `CONDITIONAL`, or `PASS FOR TESTED SCOPE`.
2. **Findings:** Critical to Low, each with asset, failure path, impact, evidence, root-cause repair, and validation.
3. **Evidence:** table of command/check, status, scope, and relevant output.
4. **Repairs:** files changed and checks rerun, if apply mode was requested.
5. **Accepted risks:** owner and expiry.
6. **Cloud changes:** explicitly state whether none were made.
7. **User-owned blockers and residual risk.**
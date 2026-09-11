# Security Policy

This repository supports a public-facing parliamentary research application and associated cloud services. Security reports are handled with priority, but no channel here guarantees immediate response.

## Supported Scope

Security fixes are provided for the current default branch and currently deployed services derived from it.

Out-of-scope for coordinated fixes in this repository:

- Local forks with unreviewed changes
- Historical branches/tags not used for deployment
- Third-party services outside this codebase

## How to Report a Vulnerability

Use one of these channels:

1. Preferred: GitHub Security Advisory draft for this repository (private by default)
2. Fallback: GitHub issue marked as a security concern (do not include exploit details or secrets)

When reporting, include:

- Affected component or path (for example, cloud-run-api endpoint, workflow, Terraform file)
- Reproduction steps and required preconditions
- Observed impact and expected behavior
- Logs or screenshots with credentials, tokens, and personal data redacted

## Report Handling Expectations

- Initial triage target: within 5 business days
- Severity assessment: Critical, High, Medium, Low
- Remediation target: based on severity and deployment risk
- Coordination: reporters may be asked to validate a fix before disclosure

If a report includes exposed credentials or tokens, revoke or rotate them outside chat immediately.

## Disclosure Guidelines

- Do not publish exploit details until a fix or mitigation is available.
- The project may publish a remediation summary after validation.
- No claim of absolute security or legal compliance is made by this policy.

## Safe Harbor

Good-faith testing that avoids privacy harm, service disruption, and data destruction will be treated as responsible disclosure.

Prohibited testing includes:

- Accessing, modifying, or exfiltrating non-public user data
- Denial-of-service or resource exhaustion attacks
- Social engineering, phishing, or physical intrusion attempts

## Security Verification Baseline

Repository-owned checks should be executed with:

```bash
npm run verify:repo-security
```

Commit-time enforcement is provided through checked-in hooks under `.githooks/`.

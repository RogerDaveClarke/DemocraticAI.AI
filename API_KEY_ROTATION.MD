# API Key Rotation Guide

## Purpose

Rotate application API keys without placing secrets in source control, documentation, logs, or chat transcripts.

## Before Rotation

1. Identify the key owner, service, environment, and intended scope.
2. Confirm the replacement key will be stored in a secret manager or protected environment configuration.
3. Confirm which services and clients must be updated.
4. Create a rollback plan that does not expose either key.

## Rotate a Runtime API Key

1. Generate a replacement key in the approved provider console or secret manager.
2. Store it as a protected secret, for example `VALID_API_KEYS` or `VITE_API_KEY` as appropriate for the environment.
3. Update the deployed service through the approved deployment pipeline.
4. Confirm health checks and authenticated requests succeed.
5. Revoke the old key after the replacement is verified.
6. Review logs and monitoring for rejected requests.

## Local Development

Keep populated environment files local and ignored by Git. Use placeholders in committed templates:

```text
VITE_API_KEY=replace-with-a-local-development-key
VALID_API_KEYS=replace-with-a-local-development-key
```

Never commit `.env.local`, `.env.production`, credentials files, private keys, or generated scan reports.

## Verification

Use a redacted scan before committing:

```powershell
gitleaks detect --source . --redact
```

A clean scan does not prove that a secret was never present in earlier commits. If a real secret was committed, revoke it first and coordinate any required history cleanup.

## Incident Response

If a secret may have been exposed:

1. Revoke or rotate it immediately.
2. Identify affected services and environments.
3. Inspect access logs for suspicious use.
4. Remove the value from the current tree and prevent recurrence with `.gitignore` and secret scanning.
5. Record the incident without copying the secret into tickets, logs, or documentation.

## Safe Documentation Pattern

Use placeholders such as `YOUR_API_KEY` or `replace-with-generated-api-key`. Do not include example values that resemble live credentials.

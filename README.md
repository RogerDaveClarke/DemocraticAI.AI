# Parliament AI

Parliament AI is a research platform for understanding democratic institutions. Each deployment must use infrastructure and third-party accounts owned by its operator.

## Safe deployment

A clean clone has no production tenant configuration and cannot build or start until it is configured. Use the canonical bootstrap script rather than the legacy deployment scripts.

### Prerequisites

- A GCP project and billing account owned by the operator
- `gcloud` authenticated with permission to provision that project
- Application Default Credentials: `gcloud auth application-default login`
- Node.js, `bq`, and either PowerShell 5.1 or Bash plus `jq`, `curl`, and Python 3

### Windows

```powershell
./scripts/bootstrap-gcp.ps1 `
  -ProjectId "your-gcp-project-id" `
  -AdminEmail "admin@example.com" `
  -BillingAccount "XXXXXX-XXXXXX-XXXXXX"
```

### Linux or macOS

```bash
PROJECT_ID=your-gcp-project-id \
ADMIN_EMAIL=admin@example.com \
BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX \
./scripts/bootstrap-gcp.sh
```

The bootstrap configures Cloud Run, Firebase Identity Platform passwordless Email Link authentication, Firebase-native TOTP, Firestore, BigQuery, Vertex AI access, an initial administrator, ingestion, and scheduling.

## Local development

Copy `.env.example` to `.env.local` and supply values from your own Firebase and API deployment. Populated environment files are ignored by Git.

```powershell
npm ci
npm run check:clone-isolation
npm run typecheck
npm run dev
```

The frontend build and API startup fail closed when required tenant configuration is absent.

## Optional services

Firebase sends authentication links. Resend is optional and is used only for non-authentication notifications. Google Analytics is also optional. Optional integrations remain disabled until the operator supplies their own configuration.

See [DEPLOYMENT.md](DEPLOYMENT.md) for provisioning, validation, migration, and clean-repository transfer details.

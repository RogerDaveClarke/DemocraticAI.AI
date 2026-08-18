# Platform Architecture
_Updated: 2026-08-16_

Parliament AI is a two-service Cloud Run application backed by BigQuery retrieval, Vertex AI generation, passwordless Firebase Identity Platform authentication, and a weekly ingestion pipeline.

---

## Standard deployment

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "fontFamily": "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "fontSize": "14px",
    "primaryColor": "#FFFFFF",
    "primaryTextColor": "#0F172A",
    "primaryBorderColor": "#E2E8F0",
    "lineColor": "#64748B",
    "clusterBkg": "#FFFFFF",
    "clusterBorder": "#E2E8F0",
    "edgeLabelBackground": "#FFFFFF"
  },
  "flowchart": {
    "curve": "basis",
    "htmlLabels": true,
    "nodeSpacing": 40,
    "rankSpacing": 55
  }
}}%%
flowchart TB
  classDef source fill:#F8FAFC,stroke:#0D3B66,color:#0F172A
  classDef pipeline fill:#ECFEFF,stroke:#14B8A6,color:#0F172A
  classDef ai fill:#EFF6FF,stroke:#2563EB,color:#0F172A
  classDef governance fill:#F5F3FF,stroke:#7C3AED,color:#0F172A
  classDef product fill:#ECFDF5,stroke:#16A34A,color:#0F172A
  classDef external fill:#F8FAFC,stroke:#64748B,color:#0F172A,stroke-dasharray:5 5

  subgraph People["Citizen, researcher, journalist, administrator"]
    User["Browser"]:::product
    Admin["Administrator"]:::product
  end

  subgraph Product["Parliament AI product"]
    Frontend["React SPA<br/>Cloud Run frontend"]:::product
    API["Express API<br/>Cloud Run"]:::pipeline
    AuthGuard["Authorization guard<br/>approved or admin claim<br/>Firebase MFA evidence"]:::governance
    Cache["Search cache<br/>10 minute TTL"]:::pipeline
  end

  subgraph Identity["Identity Platform"]
    EmailLink["Passwordless email link<br/>single-use first factor"]:::governance
    TOTP["Firebase-native TOTP<br/>required second factor"]:::governance
    Token["Signed Firebase ID token"]:::governance
  end

  subgraph State["Operational state"]
    Access["Firestore<br/>access requests and approvals"]:::pipeline
    Activity["Firestore<br/>chat activity, feedback, feature overrides"]:::pipeline
    Remote["Firebase Remote Config<br/>global feature flags"]:::pipeline
  end

  subgraph Intelligence["Retrieval and generation"]
    BigQuery["BigQuery<br/>parliamentary_data"]:::pipeline
    Gemini["Vertex AI Gemini"]:::ai
  end

  subgraph Ingestion["Official data ingestion"]
    Scheduler["Cloud Scheduler<br/>weekly trigger"]:::pipeline
    Job["Cloud Run ingester job"]:::pipeline
    Oireachtas["Houses of the Oireachtas<br/>Open Data API"]:::source
  end

  Mail["Email inbox"]:::external

  User --> Frontend
  Admin --> Frontend
  Frontend -->|"request sign-in link"| API
  API -->|"approved account check"| Access
  API -->|"request email action"| EmailLink
  EmailLink -. "deliver secure link" .-> Mail
  Mail -. "open link" .-> User
  User -->|"email link then authenticator code"| EmailLink
  EmailLink --> TOTP
  TOTP --> Token
  Frontend -->|"Bearer ID token"| AuthGuard
  AuthGuard -->|"verified request"| API
  API --> Cache
  Cache --> BigQuery
  API --> Gemini
  API --> Activity
  Frontend --> Remote
  Scheduler --> Job
  Job --> Oireachtas
  Job --> BigQuery
```

**Notes**
- NodeCache is in-process within the API Service; cache hits bypass BigQuery (10 min TTL).
- Firebase Identity Platform uses a single-use email link as the first factor and Firebase-native TOTP as the required second factor.
- Per-user feature flag overrides are stored in Firestore `feature_overrides/{flagKey}` and take precedence over Remote Config global values.
- Firebase delivers authentication links. Resend remains separate from the authentication trust boundary for non-authentication notifications.

---

## Authentication and access control

All users must be approved by an admin. Accounts are created without passwords, and the public email-link endpoint returns the same response for approved and unknown addresses.

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "fontFamily": "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "fontSize": "14px",
    "primaryTextColor": "#0F172A",
    "lineColor": "#64748B",
    "actorBkg": "#ECFDF5",
    "actorBorder": "#16A34A",
    "actorTextColor": "#0F172A",
    "signalColor": "#64748B",
    "signalTextColor": "#0F172A",
    "labelBoxBkgColor": "#F5F3FF",
    "labelBoxBorderColor": "#7C3AED",
    "labelTextColor": "#0F172A",
    "noteBkgColor": "#FFF7ED",
    "noteBorderColor": "#F59E0B",
    "noteTextColor": "#0F172A"
  }
}}%%
sequenceDiagram
  autonumber
  actor Admin as Administrator
  participant AdminUI as Admin panel
  participant API as Cloud Run API
  participant Store as Firestore
  participant Identity as Firebase Identity Platform
  participant Inbox as Email inbox
  actor User as Approved user

  rect rgb(245, 243, 255)
    Admin->>AdminUI: Approve access request
    AdminUI->>API: PATCH access request with admin ID token
    API->>Identity: Create user without password if needed
    API->>Identity: Set approved claim
    API->>Store: Record approved status and UID
    API->>Identity: Generate fallback link and request EMAIL_SIGNIN
    Identity-->>Inbox: Deliver single-use sign-in link
    API-->>AdminUI: Email status, fallback link only on failure
  end

  rect rgb(236, 253, 245)
    User->>API: POST email address to /api/auth/email-link
    API->>Identity: Find enabled Firebase user
    opt Approved claim is absent
      API->>Store: Confirm approved access request
      API->>Identity: Add approved claim
    end
    API->>Identity: Request Firebase EMAIL_SIGNIN message
    API-->>User: Generic response for every address
    Identity-->>Inbox: Deliver single-use sign-in link
    User->>Identity: Open link and complete email first factor
  end

  rect rgb(245, 243, 255)
    alt TOTP already enrolled
      Identity-->>User: Native MFA challenge
      User->>Identity: Submit authenticator code
      Identity-->>User: Signed ID token with second-factor evidence
    else First passwordless login
      Identity-->>User: Bootstrap authenticated session
      User->>Identity: Enroll Firebase-native TOTP
      User->>Identity: Sign out
      Note over User,Identity: A fresh email-link and TOTP sign-in is required
    end
  end

  rect rgb(239, 246, 255)
    User->>API: Protected request with Bearer ID token
    API->>Identity: Verify signature, expiry, and revocation
    API->>API: Require approved or admin claim
    API->>API: Require sign_in_second_factor evidence
    alt Both controls pass
      API-->>User: Authorized response
    else Either control fails
      API-->>User: 403 Forbidden
    end
  end
```

### Admin identity

- Admin identity is a Firebase custom claim: `{ admin: true }`.
- Set via `node scripts/set-admin-claim.mjs <email>`.
- Verified server-side on every `/api/admin/*` call by `requireAuth` + `requireAdmin` middleware in `adminAPI.ts`.
- Claim takes effect after sign-out and back in (new JWT required).

---

## Feature flags

Two-layer system: global defaults via Remote Config, per-user overrides via Firestore.

| Flag | Default | Controls |
|------|---------|----------|
| `ff_access_analytics_page` | false | Analytics page visible |
| `ff_access_feedback` | false | Feedback controls on Research page |
| `ff_quota_daily_limit` | false | Per-user daily query limit enforcement |

`useFeatureFlag(flag)` checks Firestore `feature_overrides/{flag}` first; if the user UID is in the `users` array, the override applies. Otherwise Remote Config value is used.

---

## Admin API endpoints

All endpoints require `Authorization: Bearer <Firebase ID token>` with `admin: true` custom claim.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/users` | List Firebase Auth accounts |
| POST | `/api/admin/users` | Create a passwordless user and send a sign-in link; return a fallback link only if delivery fails |
| DELETE | `/api/admin/users/:uid` | Delete account |
| POST | `/api/admin/users/:uid/disable` | Disable account |
| POST | `/api/admin/users/:uid/enable` | Re-enable account |
| POST | `/api/admin/users/:uid/revoke-tokens` | Force sign-out all sessions |
| GET | `/api/admin/access-requests` | List pending access requests |
| PATCH | `/api/admin/access-requests/:id` | Approve or deny request |
| GET | `/api/admin/feature-flags` | Current Remote Config values |
| PATCH | `/api/admin/feature-flags` | Toggle a global flag |
| GET | `/api/admin/feature-flag-users` | Per-user overrides for all flags |
| PUT | `/api/admin/feature-flag-users/:key` | Set user list for a flag override |
| GET | `/api/admin/usage` | Usage stats from Firestore |
| GET | `/api/admin/token-limit` | Current daily query limit |
| PATCH | `/api/admin/token-limit` | Update daily query limit |

---

## Firestore collections

| Collection | Purpose |
|-----------|---------|
| `chat_executions` | Per-query execution records (model, cost, timing, filters) |
| `chat_feedback` | Thumbs up/down feedback linked to executions |
| `feedback` | Structured feedback (sentiment, category, verbatim) |
| `feature_overrides` | Per-user early access overrides — document per flag |
| `access_requests` | Access request submissions from the sign-in page |
| `api_usage` | Aggregated API usage records from APIUsageMonitor |

---

## CORS policy

The API allows cross-origin requests only from the comma-separated `CORS_ORIGIN` configuration:

```
https://your-frontend-service-url.run.app
https://your-frontend-service-url.run.app
https://your-project-id.web.app
https://your-project-id.firebaseapp.com
http://localhost:5173
http://localhost:3000
```

The canonical bootstrap sets this value to the deployed frontend URL. Changing origins requires an explicit Cloud Run configuration update.

---

## Hardened edge variant

Optional edge hardening for production deployments where DDoS protection and CDN caching are required.

```mermaid
flowchart TB
  classDef source   fill:#F8FAFC,stroke:#0D3B66,color:#0F172A
  classDef pipeline fill:#ECFEFF,stroke:#14B8A6,color:#0F172A
  classDef ai       fill:#EFF6FF,stroke:#2563EB,color:#0F172A
  classDef product  fill:#ECFDF5,stroke:#16A34A,color:#0F172A
  classDef infra    fill:#F8FAFC,stroke:#475569,color:#0F172A
  classDef edge     fill:#FFF7ED,stroke:#F59E0B,color:#0F172A
  classDef cache    fill:#FEF9C3,stroke:#CA8A04,color:#0F172A

  subgraph Client["Citizen / Researcher"]
    U["Browser"]:::product
  end

  subgraph EdgeLayer["Optional Edge Hardening"]
    LB["HTTPS Load Balancer"]:::edge
    CA["Cloud Armor - WAF and DDoS"]:::edge
    CDN["Cloud CDN"]:::edge
  end

  subgraph Run["Cloud Run"]
    FE["Frontend Service"]:::product
    API["API Service"]:::infra
    NC["NodeCache - search cache (10 min TTL)"]:::cache
  end

  subgraph Data["Data and AI"]
    BQ["BigQuery - parliamentary_data"]:::pipeline
    FS["Firestore"]:::infra
    GEM["Vertex AI Gemini"]:::ai
  end

  subgraph Jobs["Background Jobs"]
    SCH["Cloud Scheduler"]:::infra
    JOB["Cloud Run Job - ingester"]:::pipeline
    SRC["Parliament source API"]:::source
  end

  U --> LB --> CA --> CDN --> FE
  FE --> API
  API -->|"search"| NC
  NC -->|"miss"| BQ
  API --> FS
  API --> GEM
  SCH --> JOB
  JOB --> SRC
  JOB --> BQ
```

**Notes**
- This variant does not change the application or runtime model; only the ingress path differs.
- Cloud Armor rules and CDN cache policies are configured separately from the bootstrap scripts.
- See `docs/deployment-guide.md` for the standard deployment path.

# Parliament Explorer - Architecture Diagram
_Updated: 2026-08-16_

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

## Notes

- Retrieval is BigQuery-first for cost efficiency.
- Adapter settings are environment driven (`PARLIAMENT_ADAPTER`, `PARLIAMENT_API_BASE_URL`, `PARLIAMENT_NAME`).
- Current ingestion adapter implementation is `oireachtas`.
- Authentication uses Firebase email links plus native TOTP; protected API requests require approval and second-factor evidence.
- Authentication uses Firebase email links plus native TOTP; protected API requests require approval and second-factor evidence.

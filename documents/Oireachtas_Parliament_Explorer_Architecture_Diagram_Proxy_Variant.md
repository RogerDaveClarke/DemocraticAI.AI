# Parliament Explorer - Architecture Diagram (Hardened Edge Variant)
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

  User["Browser"]:::product

  subgraph Edge["Optional edge hardening"]
    LoadBalancer["HTTPS load balancer"]:::governance
    Armor["Cloud Armor"]:::governance
    CDN["Cloud CDN"]:::pipeline
  end

  subgraph Runtime["Cloud Run"]
    Frontend["Frontend service"]:::product
    API["API service"]:::pipeline
    Guard["ID token guard<br/>approval and MFA evidence"]:::governance
  end

  subgraph Identity["Identity Platform"]
    EmailLink["Passwordless email link"]:::governance
    TOTP["Firebase-native TOTP"]:::governance
  end

  subgraph DataAI["Data and AI"]
    Firestore["Firestore"]:::pipeline
    BigQuery["BigQuery<br/>parliamentary_data"]:::pipeline
    Gemini["Vertex AI Gemini"]:::ai
  end

  subgraph Jobs["Official data pipeline"]
    Scheduler["Cloud Scheduler"]:::pipeline
    Job["Cloud Run ingester job"]:::pipeline
    Source["Oireachtas Open Data API"]:::source
  end

  Inbox["Email inbox"]:::external

  User --> LoadBalancer --> Armor --> CDN --> Frontend
  Frontend -->|"request sign-in link"| API
  API -->|"approved account check"| Firestore
  API --> EmailLink
  EmailLink -. "single-use link" .-> Inbox
  Inbox -. "open link" .-> User
  User -->|"email link and TOTP"| EmailLink
  EmailLink --> TOTP
  Frontend -->|"Bearer ID token"| Guard
  Guard --> API
  API --> Firestore
  API --> BigQuery
  API --> Gemini
  Scheduler --> Job
  Job --> Source
  Job --> BigQuery
```

## Notes

- This variant adds edge controls while preserving the same app/runtime model.
- Retrieval remains BigQuery based.
- Edge controls supplement, but do not replace, Firebase email-link authentication, native TOTP, or API claim enforcement.
- Edge controls supplement, but do not replace, Firebase email-link authentication, native TOTP, or API claim enforcement.

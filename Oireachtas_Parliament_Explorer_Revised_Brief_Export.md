# Oireachtas Parliament Explorer – Revised Brief (with New Sections)
_Export snapshot: 2025-10-14 03:33 UTC_

> This export compiles the **revised/added sections** you requested (Prompt Library,
> instrumentation and storage guidance, API access controls, privacy checklist,
> Web Experience with screenshots, and Home Page descriptions). It’s ready to share
> as a standalone document.

---

## 18) Prompt Library (New)

**Goal:** Curated, versioned set of pre‑canned prompts for the chat experience. Each prompt has a **stable GUID**,
descriptive metadata, and is instrumented for **runs, failures, and user feedback** (thumbs up/down). Users cannot add prompts in MVP.

### 18.1 Recommended Storage (low‑cost, observable)
- **Prompts (authoritative catalog):** **Firestore (Native)** – collection `prompts`, doc ID = **GUID** (UUIDv4).
  Fields: `title, description, template, variables[], version, is_active, tags[], created_at, updated_at`.
- **Prompt runs & feedback events:** **Firestore** (`prompt_runs`, `prompt_feedback`) → optional **BigQuery export** for analytics.
- **Dashboards & counters:** **Cloud Monitoring** custom metrics (run/fail/thumb counters, latency), plus historical trend analysis in **BigQuery**.

### 18.2 Event Schemas (conceptual)
- **prompt_runs**: `prompt_id, prompt_version, session_id, inputs, status (ok|fail), error, duration_ms, tokens_in/out, retrieved, created_at`
- **prompt_feedback**: `run_id, prompt_id, thumb (up|down), reason[], comment, created_at`

### 18.3 Instrumentation (Cloud Monitoring metrics)
- `custom/prompt/run_count{prompt_id}` (+1 success)
- `custom/prompt/fail_count{prompt_id,code}`
- `custom/prompt/thumb_up{prompt_id}`, `custom/prompt/thumb_down{prompt_id}`
- `custom/prompt/latency_ms{prompt_id}` (distribution or gauge)

### 18.4 Governance & Versioning
Curated prompts only; edits bump `version` (same GUID). Use `is_active` to roll out/retire. Review → activate → monitor.

### 18.5 Prompt Library (initial 15)

| GUID | Title | Description | Template | Variables | Tags |
|---|---|---|---|---|---|
| 9e2c1f2e-9b9a-4f2c-87da-2d5a4a49c3d8 | Daily Debate Summary | Summarize key points from debates on a date. | Summarize key points from **{date}**. Include top speakers, motions, and citations. | date | summary, debates, daily |
| 2f6a7d3c-0c54-4e8c-9b2d-6c1f7b3a1e29 | Member Profile Brief | Neutral profile of a member over recent months. | Create a neutral profile of **{member}** (last **{months}** months). | member, months | member, profile |
| 4b1e8a90-3b35-4f29-97db-7a2c5de4b1f0 | Compare Members on Topic | Compare two members on a topic (debates & votes). | Compare **{member_a}** vs **{member_b}** on **{topic}** ({date_range}). Add citations. | member_a, member_b, topic, date_range | compare, members, votes |
| 0a7f3d2b-6c5f-4a11-8eaf-5f4b7b2c9a11 | Party Position Summary | Summarize a party’s position on a topic. | Summarize **{party}** on **{topic}** with debates & votes ({date_range}). | party, topic, date_range | party, summary |
| f3a5c2d1-8e7b-41a6-9c14-5c6f2a9b0d77 | Constituency Issues Overview | Top issues discussed for a constituency. | List issues for **{constituency}** in **{date_range}** with citations. | constituency, date_range | constituency, issues |
| b27f0a5c-0a4d-4c8b-9c71-3d0c8f2a1b35 | Legislation Timeline | Timeline and key steps for a bill. | Timeline of **{bill_name}**: stages, amendments, sponsors, votes. | bill_name | legislation, timeline |
| a4c0e5d2-3b7a-4a8f-8c2e-0f5d1a7c9b22 | Minister Q&A Digest | Summarize questions to a minister/department. | Questions to **{minister_or_department}** about **{topic}** in **{date_range}**. | minister_or_department, topic, date_range | questions, minister |
| d1c7e9b3-5f2a-4a1b-8c6e-2e9f0b6a3d14 | Voting Pattern Insight | A member’s voting pattern on a topic. | Analyze **{member}** votes on **{topic}** ({date_range}). | member, topic, date_range | votes, analysis |
| c6e1a2b3-4d5f-4f6a-8b7c-9a0b1c2d3e4f | Notable Quotes Finder | Notable quotes on a topic. | Find notable quotes on **{topic}** in **{date_range}**. | topic, date_range | quotes, debates |
| e8b2c1d3-7a5f-4c6e-9f0a-1b2c3d4e5f6a | Procedure Explainer | Explain a procedure or motion. | Explain **{procedure_or_motion}** with citations. | procedure_or_motion | procedure, explain |
| 1f2e3d4c-5b6a-7a8b-9c0d-1e2f3a4b5c6d | Party Activity Scorecard | Party activity metrics. | Scorecard for **{party}** in **{date_range}**. | party, date_range | party, metrics |
| ab12cd34-ef56-7890-ab12-cd34ef567890 | Constituency Briefing | Neutral briefing for a constituency. | Briefing for **{constituency}** with links. | constituency | constituency, briefing |
| 0f1e2d3c-4b5a-6978-89ab-cdef01234567 | Division Outcomes on Date | Divisions for a date. | List divisions & outcomes on **{date}** with roll‑call links. | date | votes, daily |
| 7b6c5d4e-3f2a-1b0a-9c8d-7e6f5a4b3c2d | Bill Sponsors & Opposers | Sponsors/opposers and arguments. | Identify sponsors/opposers of **{bill_name}** with citations. | bill_name | legislation, positions |
| 345e67ab-89cd-01ef-23ab-45cd67ef89ab | Neutral Topic Brief | Evidence‑based topic brief. | Neutral brief on **{topic}** using debates & votes ({date_range}). | topic, date_range | briefing, neutral |

### 18.6 UI & Event Flow (Prompt Picker)
- **Entry:** Home/Chat “Start with a prompt” → modal; entity pages can prefill variables.
- **Picker:** Search + tag filters, cards with runs/thumbs, preview panel.
- **Variables:** Autocomplete (members/parties), date pickers; validation.
- **Run:** Show token estimate; on run → log `run_attempt`; on complete → `run_success`/`run_fail`.
- **Feedback:** Thumbs up/down with reasons; write event + metrics.

### 18.7–18.12 (Summary)
- **Retention:** 90‑day hot window; archive to GCS; BigQuery for trends.
- **Metrics & SLOs:** volume, failure %, p95 latency; thumbs ratio; failure <5% p95<800ms.
- **Storage rationale:** Firestore for catalog/events; BigQuery export; Monitoring for real‑time.
- **Governance:** owners, versioning, promotion/deprecation; weekly review.
- **Privacy:** anonymous by default; redact PII in comments; least‑privilege writes.

---

## 20) API Access Controls (Prevent Direct Use Outside the Website)

**Objective:** Ensure only traffic from your site reaches the API; hard‑gate admin/internal paths.

**Controls**
- **Backend‑proxy pattern (preferred):** SPA → **BFF (public)** → **RAG (private)**.
- **Session‑bound tokens:** short‑lived (2–5 min) JWT/nonce issued by BFF and validated server‑side.
- **Origin/CORS + Referer checks:** allow only your domain(s); reject others.
- **Cloud Armor:** WAF + rate limits; optional geo/IP rules (especially on BFF).
- **IAP for Admin:** curator routes only.
- **Replay protection:** nonce tied to session.
- **Telemetry:** anomaly counters & alerts (401/403 spikes, origin mismatches).

**Outcome:** Direct calls to RAG fail; only BFF‑mediated requests succeed.

---

## 21) Privacy & Cookie Notice Checklist (DPIA‑lite)

- **Data collected:** public content; anonymous telemetry for prompt runs and feedback; web analytics (opt‑in).
- **Lawful basis:** Legitimate interest (operations); **Consent** for non‑essential analytics.
- **Minimization:** anonymous session ID; truncate IPs; warn users about PII in free‑text feedback; scrub where feasible.
- **Retention:** 90 days for event docs; aggregate to BigQuery; archive raw to GCS; purge originals.
- **Security:** least‑privilege IAM; server‑side writes; HTTPS; exports/backups.
- **Disclosures:** privacy notice; user rights and contact; licensing banners already handled.

---

## 23) Web Experience

### Cookie Consent Modal
![Cookie Consent modal](sandbox:/mnt/data/55abbdf6-18c7-4be4-a475-ff0cc3ba7d7d.png)
*Alt text:* Modal titled “Cookie Consent” with explanatory text, two choice blocks (Accept/Decline), and primary buttons “Accept All Cookies” and “Decline Non‑Essential,” plus links to Cookie and Privacy policies.

### Location Detected Modal (language preference)
![Location Detected modal](sandbox:/mnt/data/a744dda3-839b-4eca-8670-b2587796955f.png)
*Alt text:* Modal titled “Location Detected” stating the country (United States) with a flag and a dropdown to choose preferred language (English by default), and guidance text about changing later.

#### Consent Mode – Behavior Checklist (no code)
- **Order:** Cookie Consent first; then Location modal depending on choice.
- **Storage keys:** `consent.choice`, `consent.version`, `consent.timestamp`, `consent.region`, `pref.language`, `pref.location_confirmed`.
- **Flags:** analytics (`granted/denied`), personalization (`granted/session`), functionality (`granted`), ads (`denied`).
- **Events:** `consent_shown/accept/decline`, `location_modal_shown`, `language_selected`, `consent_changed`.
- **Re‑prompt:** on version change, region change, 6–12 months, or missing choice.
- **Decline:** no non‑essential tags; use sessionStorage for locale; reduce telemetry detail.

**Copy block (YAML):**
```yaml
consent:
  choice: "unset"          # accept_all | decline_non_essential | unset
  version: "1"             # bump when policy/vendors change
  timestamp: ""            # ISO 8601 set on user action
  region: ""               # ISO code (IE, US)
pref:
  language: "en"
  location_confirmed: "false"
flags:
  analytics_storage: "denied"
  personalization_storage: "session"
  functionality_storage: "granted"
  ads_storage: "denied"
```

---

## 24) Home Page (Part 1 of 2) – Hero, Neutrality Banner, Announcements
![Home Page – Hero & Announcements](sandbox:/mnt/data/31dabe40-ede6-4be7-aec0-3a8248469f0c.png)
*Alt text:* Home page top section with site header, large welcome headline, mission paragraph, country detection line with change link, political neutrality disclaimer banner, and three announcement cards.

---

## 25) Home Page (Part 2 of 2) – Platform Features Grid & Footer
![Home Page – Features & Footer](sandbox:/mnt/data/174d56ea-da6d-401d-9384-d30fa06c43d0.png)
*Alt text:* Grid of six feature cards (Find Representative, Constituency Explorer, Bilingual Support, Civic Education, Email Alerts, How‑to Guides) followed by a dark footer with mission blurb, quick links, and legal links.

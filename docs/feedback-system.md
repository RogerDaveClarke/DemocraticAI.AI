# Feedback System

_Updated: 2026-08-10_

---

## How feedback works

Each AI response in the Research Assistant shows three controls in the message footer:

| Control | Action |
|---|---|
| 👍 Thumbs up | One-click positive signal. Stored immediately; no panel opens. |
| 👎 Thumbs down | One-click negative signal. Stored immediately; no panel opens. |
| 💬 Give feedback (person icon) | Toggles an inline panel beneath the message. Select a category (mutually exclusive), add optional verbatim text, and submit. Click the icon again to dismiss without submitting. |

### Feedback panel categories

- Response didn't seem relevant
- Sources were unclear or missing
- Response seemed biased or one-sided
- Response seemed factually questionable
- Other

All categories use uncertainty language ("seemed", "unclear") — they record the user's perception, not a factual assertion about AI correctness.

### Privacy

The verbatim text field carries the notice _"Don't include personal information."_ The field is capped at 500 characters server-side. Verbatim content is never displayed to other users and is never used to retrain models without a separate governance review.

---

## Feature gate

The entire feedback UI is hidden behind an environment variable. Set it in your `.env` or Cloud Run service environment:

```
VITE_FEEDBACK_ENABLED=true
```

Omitting the variable or setting it to any value other than `true` hides all three controls and disables all API calls. The feature is off by default.

---

## Data storage

### Firestore collection: `feedback`

Each submission writes one document:

| Field | Type | Description |
|---|---|---|
| `sessionId` | string | Client-generated session ID |
| `messageId` | string | ID of the bot message being rated |
| `executionId` | string \| null | Links to the `chat_executions` document if available |
| `queryText` | string | The user's original question |
| `sentiment` | `"up"` \| `"down"` | Thumbs direction |
| `category` | string \| null | Selected category chip, or null for thumbs-only signals |
| `verbatim` | string \| null | Free-text comment, or null if not provided |
| `timestamp` | Timestamp | Server write time |

### API endpoint

```
POST /api/feedback
```

Body (JSON):
```json
{
  "sessionId": "session_...",
  "messageId": "1234567890",
  "executionId": "exec_...",
  "queryText": "How has the Dáil voted on housing?",
  "sentiment": "down",
  "category": "Sources were unclear or missing",
  "verbatim": "The debate cited was from 2022, not 2025."
}
```

Response:
```json
{ "success": true }
```

---

## Accessing feedback data in GCP

### 1. Firestore Console (quickest)

1. Open [console.cloud.google.com](https://console.cloud.google.com)
2. Select project **your-project-id**
3. Navigate to **Firestore** → **Data**
4. Open collection **`feedback`**

Each document is a single feedback submission. You can filter by field in the console, but this is not suitable for aggregate analysis.

### 2. gcloud CLI

List recent documents (requires `gcloud` authenticated):

```bash
gcloud firestore documents list \
  --collection-id=feedback \
  --project=your-project-id
```

### 3. BigQuery (recommended for analysis)

Export the `feedback` collection to BigQuery for SQL analysis. One-time setup:

#### a. Enable the Firestore → BigQuery export (Managed Export)

```bash
gcloud firestore export gs://your-project-id-exports/feedback-$(date +%Y%m%d) \
  --collection-ids=feedback \
  --project=your-project-id
```

#### b. Load the export into BigQuery

```bash
bq load \
  --source_format=DATASTORE_BACKUP \
  --project_id=your-project-id \
  parliamentary_data.feedback \
  gs://your-project-id-exports/feedback-YYYYMMDD/all_namespaces/kind_feedback/all_namespaces_kind_feedback.export_metadata
```

#### c. Query examples

**Sentiment breakdown:**
```sql
SELECT
  sentiment,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM `your-project-id.parliamentary_data.feedback`
GROUP BY sentiment
ORDER BY count DESC;
```

**Top negative categories:**
```sql
SELECT
  category,
  COUNT(*) AS count
FROM `your-project-id.parliamentary_data.feedback`
WHERE sentiment = 'down'
  AND category IS NOT NULL
GROUP BY category
ORDER BY count DESC;
```

**Verbatim comments (most recent 50):**
```sql
SELECT
  timestamp,
  sentiment,
  category,
  verbatim,
  queryText
FROM `your-project-id.parliamentary_data.feedback`
WHERE verbatim IS NOT NULL
ORDER BY timestamp DESC
LIMIT 50;
```

**Daily submission volume:**
```sql
SELECT
  DATE(timestamp) AS day,
  COUNT(*) AS submissions,
  COUNTIF(sentiment = 'up') AS thumbs_up,
  COUNTIF(sentiment = 'down') AS thumbs_down
FROM `your-project-id.parliamentary_data.feedback`
GROUP BY day
ORDER BY day DESC;
```

### 4. Automated export (Phase 2)

For continuous analysis, set up a Firestore-triggered Cloud Function that streams each new `feedback` document to the BigQuery table via streaming inserts. This avoids the manual export step and provides near-real-time data in BigQuery.

---

## When to enable the feature gate

The recommended path:

1. **Now (off):** Feature gate is `false`. No feedback data collected. Monitor the codebase for issues.
2. **Internal test:** Set `VITE_FEEDBACK_ENABLED=true` in a staging Cloud Run revision. Verify data appears in Firestore.
3. **Production rollout:** Update the production Cloud Run service environment variable. No code deployment required — the same build reads the env at runtime via Vite's env injection.

To update the Cloud Run service environment variable without a full redeploy:

```bash
gcloud run services update oireachtas-frontend \
  --region=us-west1 \
  --update-env-vars=VITE_FEEDBACK_ENABLED=true \
  --project=your-project-id
```

> **Note:** Vite bakes `import.meta.env.*` values into the static bundle at build time. Changing a Cloud Run env var after deployment does **not** affect an already-built frontend. You must rebuild and redeploy the frontend service with the new value set.

The correct workflow is:
1. Set `VITE_FEEDBACK_ENABLED=true` in your build environment (Cloud Build substitution or `.env.production`)
2. Trigger a new build and deploy

---

## Responsible AI notes

- Verbatim field is never logged to Cloud Run stdout (PII risk)
- Feedback is stored anonymously — no user identity is captured unless Auth is explicitly added
- Categories use uncertainty language; they are user perception signals, not factual QA verdicts
- Feedback data must not be used to retrain models without a formal governance review

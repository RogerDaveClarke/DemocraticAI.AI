# Instrumentation

## What was built

A lightweight product analytics layer that sends structured events to GA4 and exports to BigQuery for analysis in Looker Studio.

### Files

| File | Purpose |
|---|---|
| `src/utils/analytics.ts` | Core tracking utilities. Exports `pageView()`, `event()`, `trackWebVitals()`, and the new typed `track()` function |
| `src/utils/inject-ga.ts` | Injects the GA4 script tag at runtime after initial render |

---

## Taxonomy

All product interactions use a single GA4 event name: `feature_interaction`.

Parameters are structured dimensions, not free text, so they are filterable and groupable in BigQuery without string parsing.

### TypeScript types (`src/utils/analytics.ts`)

`Feature` � the section of the platform where the interaction occurred:

`home`, `enquire`, `research-library`, `saved-research`, `officials`, `personas`, `debates`, `voting`, `qa`, `ai-integrity`, `advanced-ai-analytics`, `attendance`, `statistics`, `platform-status`, `architecture`, `responsible-ai`, `about`, `analytics`, `fun`

`Control` � the type of UI element that was interacted with:

`search`, `filter`, `tab`, `sort`, `view-toggle`, `card-expand`, `export`, `nav`, `pagination`, `date-range`, `modal-open`, `modal-close`, `prompt-select`, `save`, `share`, `mode-switch`

`TrackAction` � the nature of the interaction:

`click`, `submit`, `select`, `toggle`, `expand`, `apply`

### Calling `track()`

`	ypescript
import { track } from '@/utils/analytics';

track('voting', 'filter', 'select', 'Fianna F�il');
//     feature   control   action    label (optional)
`

`label` is a free-text qualifier � use it for the selected value, query text (trimmed), or item identifier. Never include PII.

---

## Instrumented controls

| Section | Control | Action | Label |
|---|---|---|---|
| Voting | Party filter select | select | party name |
| Voting | Chamber filter select | select | chamber name |
| Voting | Result filter select | select | result value |
| Voting | Topic filter select | select | topic name |
| Voting | Search input | submit | query text |
| Debates | Tab buttons | click | tab id |
| Debates | Sort dropdown | select | sort value |
| Personas | Party filter select | select | party name |
| Personas | Search input (on blur) | submit | query text |
| Enquire | Message submit | submit | � |
| Enquire | Prompt template select | click | prompt id |

Page views are tracked automatically on every route change via `pageView()` in `App.tsx`.

Web vitals (CLS, INP, FCP, LCP, TTFB) are reported via `trackWebVitals()` in `main.tsx`.

---

## Configuration

### Step 1 � Set your GA4 Measurement ID

Add to `.env.local`:

`
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
`

Get this from GA4 Admin ? Data Streams ? your web stream ? Measurement ID.

### Step 2 � Link GA4 to BigQuery

1. Go to [analytics.google.com](https://analytics.google.com) ? Admin (gear icon)
2. Property column ? **BigQuery Linking** ? **Link**
3. Select project `your-project-id`
4. Dataset location: **United States (US)**
5. Enable **Daily export**
6. Select your web data stream
7. Click **Submit**

GA4 will write `events_YYYYMMDD` tables into the `analytics_events` dataset. The first export lands the following day.

### Step 3 � Verify data is flowing

After 24 hours:

`sql
SELECT event_name, COUNT(*) AS count
FROM your-project-id.analytics_events.events_*
WHERE event_name = 'feature_interaction'
GROUP BY event_name
`

---

## Exploring data in BigQuery

### Top features by interaction count

`sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'feature') AS feature,
  COUNT(*) AS interactions
FROM your-project-id.analytics_events.events_*
WHERE event_name = 'feature_interaction'
  AND _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
GROUP BY feature
ORDER BY interactions DESC
`

### Top controls within a feature

`sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'control') AS control,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'action') AS action,
  COUNT(*) AS count
FROM your-project-id.analytics_events.events_*
WHERE event_name = 'feature_interaction'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'feature') = 'voting'
  AND _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
GROUP BY control, action
ORDER BY count DESC
`

### Daily active sections (page views)

`sql
SELECT
  event_date,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_path') AS page,
  COUNT(DISTINCT user_pseudo_id) AS users
FROM your-project-id.analytics_events.events_*
WHERE event_name = 'page_view'
  AND _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY))
GROUP BY event_date, page
ORDER BY event_date DESC, users DESC
`

### Most common search queries in Enquire

`sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'label') AS query,
  COUNT(*) AS submissions
FROM your-project-id.analytics_events.events_*
WHERE event_name = 'feature_interaction'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'feature') = 'enquire'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'control') = 'search'
  AND _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
GROUP BY query
ORDER BY submissions DESC
LIMIT 50
`

---

## Setting up a Looker Studio dashboard

1. Go to [lookerstudio.google.com](https://lookerstudio.google.com)
2. **Create** ? **Report** ? **BigQuery** connector
3. Connect to `your-project-id` ? `analytics_events` ? select any `events_*` table, then switch to **Custom Query** mode

Use this base query as your data source:

`sql
SELECT
  event_date,
  user_pseudo_id,
  event_name,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'feature') AS feature,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'control') AS control,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'action') AS action,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'label') AS label,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_path') AS page_path
FROM your-project-id.analytics_events.events_*
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
`

### Recommended panels

| Panel | Chart type | Dimensions | Metric |
|---|---|---|---|
| Feature engagement | Bar chart | feature | COUNT interactions |
| Top controls | Ranked table | feature, control, action | COUNT |
| Searches over time | Line chart | event_date | COUNT (filter: control=search) |
| Sessions trend | Line chart | event_date | COUNT DISTINCT user_pseudo_id |
| Feature � action matrix | Pivot table | feature (rows), action (cols) | COUNT |

Set the dashboard to **private** (default). Do not publish publicly � it contains usage patterns.

---

## Adding instrumentation to a new section

1. Import `track`:
   `	ypescript
   import { track } from '@/utils/analytics';
   `

2. Wrap the relevant state setter at the event handler:
   `	ypescript
   onChange={(e) => {
     setFilter(e.target.value);
     track('my-section', 'filter', 'select', e.target.value);
   }}
   `

3. For search submit, use `onKeyDown` (Enter) or `onBlur` with a non-empty guard:
   `	ypescript
   onBlur={(v) => { if (v.trim()) track('my-section', 'search', 'submit', v.trim()); }}
   `

4. If the section is new, add it to the `Feature` type in `src/utils/analytics.ts`.

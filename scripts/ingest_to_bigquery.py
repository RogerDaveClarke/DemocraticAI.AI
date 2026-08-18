"""
Oireachtas -> BigQuery Ingestion Script
Fetches bills, debates (with speech text), votes, and questions from the
Oireachtas API and loads them into BigQuery for RAG-powered chat search.

Usage:
    python scripts/ingest_to_bigquery.py                 # incremental from last run
    python scripts/ingest_to_bigquery.py --full-refresh  # reload from 2020-01-01
    python scripts/ingest_to_bigquery.py --days-back 30  # explicit lookback window

Prerequisites:
    pip install google-cloud-bigquery requests
    gcloud auth application-default login
"""

import argparse
import logging
import os
import re
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import requests
from google.cloud import bigquery
from google.api_core.exceptions import NotFound

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────
PROJECT_ID   = os.environ["GOOGLE_CLOUD_PROJECT"]
DATASET_ID   = os.getenv("BQ_DATASET", "parliamentary_data")
LOCATION     = os.getenv("BQ_LOCATION", "US")
API_BASE     = os.getenv("PARLIAMENT_API_BASE_URL", "https://api.oireachtas.ie/v1")
DATA_BASE    = "https://data.oireachtas.ie"
AKN_NS       = {"akn": "http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD13"}
DEFAULT_DATE = "2020-01-01"          # absolute floor for full-refresh
API_PAGE_SIZE = 50                   # Oireachtas API max page size
API_SLEEP     = 0.15                 # seconds between pages (rate-limit courtesy)
XML_SLEEP     = 0.25                 # seconds between XML fetches
PARLIAMENT_ADAPTER = os.getenv("PARLIAMENT_ADAPTER", "oireachtas").lower()


# ── BigQuery table schemas ─────────────────────────────────────────────────────
SCHEMAS: dict[str, list[bigquery.SchemaField]] = {
    "bills": [
        bigquery.SchemaField("bill_id",        "STRING",    mode="REQUIRED"),
        bigquery.SchemaField("bill_no",         "STRING"),
        bigquery.SchemaField("bill_year",       "STRING"),
        bigquery.SchemaField("title",           "STRING"),
        bigquery.SchemaField("short_title",     "STRING"),
        bigquery.SchemaField("status",          "STRING"),
        bigquery.SchemaField("uri",             "STRING"),
        bigquery.SchemaField("date_introduced", "DATE"),
        bigquery.SchemaField("ingested_at",     "TIMESTAMP"),
    ],
    "debates": [
        bigquery.SchemaField("speech_id",    "STRING",    mode="REQUIRED"),
        bigquery.SchemaField("debate_id",    "STRING"),
        bigquery.SchemaField("date",         "DATE"),
        bigquery.SchemaField("show_as",      "STRING"),
        bigquery.SchemaField("chamber",      "STRING"),
        bigquery.SchemaField("speaker",      "STRING"),
        bigquery.SchemaField("speech_text",  "STRING"),
        bigquery.SchemaField("section_name", "STRING"),
        bigquery.SchemaField("uri",          "STRING"),
        bigquery.SchemaField("ingested_at",  "TIMESTAMP"),
    ],
    "votes": [
        bigquery.SchemaField("division_id", "STRING",    mode="REQUIRED"),
        bigquery.SchemaField("subject",     "STRING"),
        bigquery.SchemaField("date",        "DATE"),
        bigquery.SchemaField("outcome",     "STRING"),
        bigquery.SchemaField("uri",         "STRING"),
        bigquery.SchemaField("ingested_at", "TIMESTAMP"),
    ],
    "questions": [
        bigquery.SchemaField("question_id",   "STRING",    mode="REQUIRED"),
        bigquery.SchemaField("question_type", "STRING"),
        bigquery.SchemaField("date",          "DATE"),
        bigquery.SchemaField("subject",       "STRING"),
        bigquery.SchemaField("asked_by",      "STRING"),
        bigquery.SchemaField("directed_to",   "STRING"),
        bigquery.SchemaField("uri",           "STRING"),
        bigquery.SchemaField("ingested_at",   "TIMESTAMP"),
    ],
    "members": [
        bigquery.SchemaField("member_code",   "STRING",    mode="REQUIRED"),
        bigquery.SchemaField("full_name",     "STRING"),
        bigquery.SchemaField("show_as",       "STRING"),
        bigquery.SchemaField("uri",           "STRING"),
        bigquery.SchemaField("is_active",     "BOOL"),
        bigquery.SchemaField("current_party", "STRING"),
        bigquery.SchemaField("current_house", "STRING"),
        bigquery.SchemaField("ingested_at",   "TIMESTAMP"),
    ],
    "ingestion_metadata": [
        bigquery.SchemaField("table_name",          "STRING",    mode="REQUIRED"),
        bigquery.SchemaField("last_ingested_date",  "STRING"),
        bigquery.SchemaField("last_run_at",         "TIMESTAMP"),
        bigquery.SchemaField("record_count",        "INT64"),
    ],
}


# ── BigQuery helpers ───────────────────────────────────────────────────────────
class BQManager:
    def __init__(self) -> None:
        self.client = bigquery.Client(project=PROJECT_ID)
        self._ensure_dataset()
        self._ensure_tables()

    def _ensure_dataset(self) -> None:
        dataset_ref = f"{PROJECT_ID}.{DATASET_ID}"
        try:
            self.client.get_dataset(dataset_ref)
            logger.info("Dataset %s already exists.", dataset_ref)
        except NotFound:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = LOCATION
            self.client.create_dataset(dataset, exists_ok=True)
            logger.info("Created dataset %s.", dataset_ref)

    def _ensure_tables(self) -> None:
        for table_name, schema in SCHEMAS.items():
            table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
            try:
                self.client.get_table(table_ref)
                logger.info("Table %s already exists.", table_name)
            except NotFound:
                table = bigquery.Table(table_ref, schema=schema)
                self.client.create_table(table)
                logger.info("Created table %s.", table_name)

    def get_last_ingested_date(self, table_name: str) -> Optional[str]:
        """Return ISO date string of last ingestion for this table, or None."""
        query = f"""
            SELECT last_ingested_date
            FROM `{PROJECT_ID}.{DATASET_ID}.ingestion_metadata`
            WHERE table_name = @table_name
            ORDER BY last_run_at DESC
            LIMIT 1
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("table_name", "STRING", table_name)
            ]
        )
        try:
            rows = list(self.client.query(query, job_config=job_config).result())
            if rows:
                return rows[0]["last_ingested_date"]
        except Exception as exc:
            logger.warning("Could not read metadata for %s: %s", table_name, exc)
        return None

    def batch_insert(self, table_name: str, rows: list[dict]) -> None:
        """Insert rows using the BigQuery streaming insert API."""
        if not rows:
            return
        table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
        errors = self.client.insert_rows_json(table_ref, rows)
        if errors:
            logger.error("Insert errors for %s: %s", table_name, errors[:5])
        else:
            logger.info("Inserted %d rows into %s.", len(rows), table_name)

    def upsert_metadata(self, table_name: str, last_date: str, count: int) -> None:
        """Record the result of this ingestion run."""
        now = datetime.now(timezone.utc).isoformat()
        rows = [{
            "table_name": table_name,
            "last_ingested_date": last_date,
            "last_run_at": now,
            "record_count": count,
        }]
        self.batch_insert("ingestion_metadata", rows)

    def delete_date_range(self, table_name: str, date_col: str,
                          date_from: str, date_to: str) -> None:
        """Remove rows in [date_from, date_to] to allow clean re-insertion."""
        query = f"""
            DELETE FROM `{PROJECT_ID}.{DATASET_ID}.{table_name}`
            WHERE {date_col} BETWEEN @date_from AND @date_to
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("date_from", "STRING", date_from),
                bigquery.ScalarQueryParameter("date_to",   "STRING", date_to),
            ]
        )
        self.client.query(query, job_config=job_config).result()
        logger.info("Deleted existing rows in %s from %s to %s.",
                    table_name, date_from, date_to)

    def truncate_table(self, table_name: str) -> None:
        query = f"DELETE FROM `{PROJECT_ID}.{DATASET_ID}.{table_name}` WHERE TRUE"
        self.client.query(query).result()
        logger.info("Truncated table %s.", table_name)


# ── Oireachtas API helpers ─────────────────────────────────────────────────────
def paginated_fetch(endpoint: str, params: dict, max_records: int = 50_000) -> list[dict]:
    """Fetch all pages from an Oireachtas API endpoint."""
    params = dict(params)
    params["limit"] = API_PAGE_SIZE
    all_results: list[dict] = []
    skip = 0

    while len(all_results) < max_records:
        params["skip"] = skip
        try:
            resp = requests.get(f"{API_BASE}/{endpoint}", params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as exc:
            logger.error("API error at %s skip=%d: %s", endpoint, skip, exc)
            break

        # Different endpoints wrap results differently
        results = (
            data.get("results")
            or data.get("houses")
            or data.get("parties")
            or data.get("constituencies")
            or []
        )
        if not results:
            break

        all_results.extend(results)
        if len(results) < API_PAGE_SIZE:
            break  # last page

        skip += len(results)
        if skip % 500 == 0:
            logger.info("  … %d records from /%s so far", len(all_results), endpoint)
        time.sleep(API_SLEEP)

    return all_results


# ── XML / Akoma Ntoso speech parser ───────────────────────────────────────────
def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_speeches_from_xml(xml_url: str, debate_id: str,
                               date_str: str, show_as: str,
                               chamber: str, uri: str) -> list[dict]:
    """Download and parse debate XML; return one row per speech."""
    speeches: list[dict] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        full_url = xml_url if xml_url.startswith("http") else f"{DATA_BASE}{xml_url}"
        resp = requests.get(full_url, timeout=60)
        if resp.status_code != 200:
            return speeches
        root = ET.fromstring(resp.text)
    except Exception as exc:
        logger.warning("XML fetch/parse failed for %s: %s", debate_id, exc)
        return speeches

    debate_body = root.find(".//akn:debateBody", AKN_NS)
    if debate_body is None:
        return speeches

    for sec_idx, section in enumerate(
            debate_body.findall(".//akn:debateSection", AKN_NS)):
        section_name = section.get("name", "")
        for sp_idx, sp_elem in enumerate(
                section.findall(".//akn:speech", AKN_NS)):
            # Speaker
            from_elem = sp_elem.find(".//akn:from", AKN_NS)
            raw_speaker = _clean_text("".join(from_elem.itertext())) if from_elem is not None else ""
            speaker = re.sub(r"\([^)]*\)", "", raw_speaker).strip() or "Unknown"

            # Content
            paras = [_clean_text("".join(p.itertext()))
                     for p in sp_elem.findall(".//akn:p", AKN_NS)]
            speech_text = " ".join(p for p in paras if p)
            if not speech_text or len(speech_text) < 20:
                continue

            speech_id = f"{debate_id}_{sec_idx}_{sp_idx}"
            speeches.append({
                "speech_id":    speech_id,
                "debate_id":    debate_id,
                "date":         date_str,
                "show_as":      show_as,
                "chamber":      chamber,
                "speaker":      speaker,
                "speech_text":  speech_text[:8000],  # cap for BQ row size
                "section_name": section_name,
                "uri":          uri,
                "ingested_at":  now_iso,
            })

    return speeches


# ── Per-content-type ingestion ─────────────────────────────────────────────────
def ingest_bills(bq: BQManager, date_from: str, date_to: str) -> int:
    logger.info("Fetching bills from %s to %s …", date_from, date_to)
    raw = paginated_fetch("legislation", {"date_start": date_from, "date_end": date_to})
    now_iso = datetime.now(timezone.utc).isoformat()
    rows: list[dict] = []

    for item in raw:
        b = item.get("bill", {})
        bill_no   = b.get("billNo", "")
        bill_year = b.get("billYear", "")
        bill_id   = f"{bill_year}-{bill_no}" if bill_no and bill_year else b.get("uri", "").split("/")[-1]
        if not bill_id:
            continue

        # date_introduced: try shortTitle date first, then uri-based year
        date_introduced = None
        if bill_year:
            date_introduced = f"{bill_year}-01-01"

        rows.append({
            "bill_id":         bill_id,
            "bill_no":         bill_no,
            "bill_year":       bill_year,
            "title":           b.get("longTitleEn", ""),
            "short_title":     b.get("shortTitleEn", ""),
            "status":          b.get("status", ""),
            "uri":             b.get("uri", ""),
            "date_introduced": date_introduced,
            "ingested_at":     now_iso,
        })

    if rows:
        bq.delete_date_range("bills", "date_introduced", date_from, date_to)
        bq.batch_insert("bills", rows)
    logger.info("Bills: %d records.", len(rows))
    return len(rows)


def ingest_votes(bq: BQManager, date_from: str, date_to: str) -> int:
    logger.info("Fetching votes from %s to %s …", date_from, date_to)
    raw = paginated_fetch("divisions", {"date_start": date_from, "date_end": date_to})
    now_iso = datetime.now(timezone.utc).isoformat()
    rows: list[dict] = []

    for item in raw:
        d = item.get("division", {})
        div_id = d.get("divisionId") or d.get("uri", "").split("/")[-1]
        if not div_id:
            continue

        # subject may be a dict {"showAs": "...", "uri": "..."} from the API
        subject_raw = d.get("subject", "")
        if isinstance(subject_raw, dict):
            subject = subject_raw.get("showAs", "") or subject_raw.get("uri", "").split("/")[-1]
        else:
            subject = str(subject_raw) if subject_raw else ""

        rows.append({
            "division_id": div_id,
            "subject":     subject,
            "date":        d.get("date", ""),
            "outcome":     d.get("outcome", ""),
            "uri":         d.get("uri", ""),
            "ingested_at": now_iso,
        })

    if rows:
        bq.delete_date_range("votes", "date", date_from, date_to)
        bq.batch_insert("votes", rows)
    logger.info("Votes: %d records.", len(rows))
    return len(rows)


def ingest_questions(bq: BQManager, date_from: str, date_to: str) -> int:
    logger.info("Fetching questions from %s to %s …", date_from, date_to)
    raw = paginated_fetch("questions", {"date_start": date_from, "date_end": date_to})
    now_iso = datetime.now(timezone.utc).isoformat()
    rows: list[dict] = []

    for item in raw:
        q = item.get("question", {})
        q_id = q.get("questionId") or q.get("uri", "").split("/")[-1]
        if not q_id:
            continue

        asked_by    = ""
        directed_to = ""
        by_info = q.get("by", {})
        to_info = q.get("to", {})
        if isinstance(by_info, dict):
            asked_by    = by_info.get("showAs", "") or by_info.get("memberCode", "")
        if isinstance(to_info, dict):
            directed_to = to_info.get("showAs", "") or to_info.get("departmentCode", "")

        rows.append({
            "question_id":   q_id,
            "question_type": q.get("questionType", ""),
            "date":          q.get("date", ""),
            "subject":       q.get("subject", "") or q.get("showAs", ""),
            "asked_by":      asked_by,
            "directed_to":   directed_to,
            "uri":           q.get("uri", ""),
            "ingested_at":   now_iso,
        })

    if rows:
        bq.delete_date_range("questions", "date", date_from, date_to)
        bq.batch_insert("questions", rows)
    logger.info("Questions: %d records.", len(rows))
    return len(rows)


def ingest_debates(bq: BQManager, date_from: str, date_to: str,
                   max_xml_workers: int = 4) -> int:
    """Fetch debate metadata, then pull XML for each debate to extract speeches."""
    logger.info("Fetching debates from %s to %s …", date_from, date_to)
    raw = paginated_fetch("debates", {"date_start": date_from, "date_end": date_to})
    logger.info("Got %d debate records; extracting speeches from XML …", len(raw))

    all_speeches: list[dict] = []

    def _process_one(item: dict) -> list[dict]:
        dr = item.get("debateRecord", {})
        debate_id = (
            dr.get("debateId")
            or dr.get("uri", "").split("/")[-1]
            or dr.get("debateSectionId", "")
        )
        if not debate_id:
            return []

        date_str  = dr.get("date", "")
        show_as   = dr.get("showAs", "") or dr.get("chamber", {}).get("showAs", "")
        chamber   = dr.get("chamber", {}).get("showAs", "") if isinstance(dr.get("chamber"), dict) else ""
        uri       = dr.get("uri", "")
        formats   = dr.get("formats", {})
        xml_uri   = (formats.get("xml") or {}).get("uri", "")

        if xml_uri:
            time.sleep(XML_SLEEP)
            return extract_speeches_from_xml(xml_uri, debate_id, date_str, show_as, chamber, uri)

        # No XML available – store a placeholder row so the debate is searchable
        now_iso = datetime.now(timezone.utc).isoformat()
        return [{
            "speech_id":    f"{debate_id}_0",
            "debate_id":    debate_id,
            "date":         date_str,
            "show_as":      show_as,
            "chamber":      chamber,
            "speaker":      "",
            "speech_text":  show_as,
            "section_name": "",
            "uri":          uri,
            "ingested_at":  now_iso,
        }]

    with ThreadPoolExecutor(max_workers=max_xml_workers) as pool:
        futures = {pool.submit(_process_one, item): i for i, item in enumerate(raw)}
        done = 0
        for future in as_completed(futures):
            try:
                speeches = future.result()
                all_speeches.extend(speeches)
            except Exception as exc:
                logger.warning("Debate processing error: %s", exc)
            done += 1
            if done % 50 == 0:
                logger.info("  … %d/%d debates processed (%d speeches so far)",
                            done, len(raw), len(all_speeches))

    if all_speeches:
        bq.delete_date_range("debates", "date", date_from, date_to)
        # Insert in chunks to avoid payload limits
        chunk_size = 500
        for i in range(0, len(all_speeches), chunk_size):
            bq.batch_insert("debates", all_speeches[i:i + chunk_size])
    logger.info("Debates: %d speech rows.", len(all_speeches))
    return len(all_speeches)


def ingest_members(bq: BQManager) -> int:
    """Members are not date-scoped; always do a full refresh."""
    logger.info("Fetching members (full refresh) …")
    raw = paginated_fetch("members", {"date_start": "1900-01-01"})
    now_iso = datetime.now(timezone.utc).isoformat()
    rows: list[dict] = []

    for item in raw:
        m = item.get("member", {})
        code = m.get("memberCode", "")
        if not code:
            continue
        rows.append({
            "member_code":   code,
            "full_name":     m.get("fullName", ""),
            "show_as":       m.get("showAs", ""),
            "uri":           m.get("uri", ""),
            "is_active":     bool(m.get("memberships")),
            "current_party": "",
            "current_house": "",
            "ingested_at":   now_iso,
        })

    if rows:
        bq.truncate_table("members")
        bq.batch_insert("members", rows)
    logger.info("Members: %d records.", len(rows))
    return len(rows)


# ── Main ───────────────────────────────────────────────────────────────────────
def main() -> None:
    if PARLIAMENT_ADAPTER != "oireachtas":
        raise NotImplementedError(
            f"Adapter '{PARLIAMENT_ADAPTER}' is not implemented yet. "
            "Current ingestion supports PARLIAMENT_ADAPTER=oireachtas only."
        )

    parser = argparse.ArgumentParser(description="Ingest Oireachtas data into BigQuery")
    parser.add_argument("--full-refresh",  action="store_true",
                        help="Reload everything from DEFAULT_DATE to today")
    parser.add_argument("--days-back",     type=int, default=None,
                        help="Explicit lookback window in days (overrides metadata check)")
    parser.add_argument("--skip-debates",  action="store_true",
                        help="Skip debate XML extraction (faster, less content)")
    args = parser.parse_args()

    today     = datetime.now(timezone.utc).date()
    today_str = today.isoformat()

    bq = BQManager()

    # ── Determine date range ───────────────────────────────────────────────────
    if args.full_refresh:
        date_from = DEFAULT_DATE
        logger.info("Full refresh from %s.", date_from)
    elif args.days_back:
        date_from = (today - timedelta(days=args.days_back)).isoformat()
        logger.info("Explicit lookback: %d days from %s.", args.days_back, date_from)
    else:
        # Use the oldest last_ingested_date across the content tables
        dates = []
        for tbl in ("bills", "votes", "questions", "debates"):
            d = bq.get_last_ingested_date(tbl)
            if d:
                dates.append(d)

        if dates:
            date_from = min(dates)
            # Overlap by 2 days to catch any late-arriving records
            date_from = (
                datetime.strptime(date_from, "%Y-%m-%d").date() - timedelta(days=2)
            ).isoformat()
            logger.info("Incremental update from %s (last ingestion date - 2 days).", date_from)
        else:
            date_from = (today - timedelta(days=365)).isoformat()
            logger.info("No previous ingestion found; defaulting to 1 year back: %s.", date_from)

    logger.info("Date range: %s → %s", date_from, today_str)

    total_start = time.time()
    counts: dict[str, int] = {}

    # ── Run ingestion in parallel where safe ──────────────────────────────────
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {
            pool.submit(ingest_bills,     bq, date_from, today_str): "bills",
            pool.submit(ingest_votes,     bq, date_from, today_str): "votes",
            pool.submit(ingest_questions, bq, date_from, today_str): "questions",
        }
        for future in as_completed(futures):
            tbl = futures[future]
            try:
                counts[tbl] = future.result()
                bq.upsert_metadata(tbl, today_str, counts[tbl])
            except Exception as exc:
                logger.error("Failed to ingest %s: %s", tbl, exc)

    if not args.skip_debates:
        try:
            counts["debates"] = ingest_debates(bq, date_from, today_str)
            bq.upsert_metadata("debates", today_str, counts["debates"])
        except Exception as exc:
            logger.error("Failed to ingest debates: %s", exc)

    # Members are always a full refresh (small dataset)
    try:
        counts["members"] = ingest_members(bq)
        bq.upsert_metadata("members", today_str, counts["members"])
    except Exception as exc:
        logger.error("Failed to ingest members: %s", exc)

    duration = time.time() - total_start
    logger.info(
        "Ingestion complete in %.1fs. Counts: %s",
        duration,
        {k: f"{v:,}" for k, v in counts.items()},
    )


if __name__ == "__main__":
    main()

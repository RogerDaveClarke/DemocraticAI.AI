FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir google-cloud-bigquery requests

COPY ingest_to_bigquery.py .

ENTRYPOINT ["python", "ingest_to_bigquery.py"]

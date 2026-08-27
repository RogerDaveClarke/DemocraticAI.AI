FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1

RUN pip install --no-cache-dir google-cloud-bigquery requests

RUN groupadd --system app && useradd --system --gid app --home-dir /app --no-create-home app

COPY --chown=app:app ingest_to_bigquery.py .

USER app

ENTRYPOINT ["python", "ingest_to_bigquery.py"]

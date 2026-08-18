# Data Update Cycle - Parliament Explorer

## Overview
This document describes the production data update strategy for maintaining fresh parliamentary data while minimizing costs.

## Current Implementation Status

### âœ… Deployed Features
- **Full Ingestion Function**: Complete data refresh from 2020 onwards
- **Incremental Update Function**: Fast updates for last 7 days
- **Dual-mode Support**: Single Cloud Function handles both update types
- **Cost Optimization**: 190x faster incremental updates vs full refresh

### ðŸ“Š Performance Metrics

| Update Type | Duration | Records Updated | Cost per Run | API Calls |
|-------------|----------|-----------------|--------------|-----------|
| **Full Refresh** | 8+ minutes | ~18,000 | $0.20 | ~800 |
| **Incremental (7 days)** | 2-3 seconds | ~10-100 | $0.01 | ~50 |
| **Members Only** | 2 minutes | ~2,000 | $0.03 | ~50 |

### ðŸ’° Cost Analysis

**Monthly Cost Scenarios:**

| Strategy | Frequency | Monthly Cost | Data Freshness |
|----------|-----------|--------------|----------------|
| **Manual Only** | On-demand | ~$0.20 | As needed |
| **Daily Incremental** | 1x/day | ~$0.30 | 24 hours |
| **Recommended** | Daily + Weekly full | ~$1.10 | 24 hours |
| **High Activity** | 2x/day + Weekly | ~$1.40 | 12 hours |

## Production Setup (Recommended)

### 1. Daily Incremental Updates
**Purpose**: Capture all new parliamentary activity  
**Schedule**: Daily at 2:00 AM Dublin time  
**Scope**: Last 7 days of data

```bash
# Setup Cloud Scheduler
.\scripts\setup-scheduler.ps1

# This creates a job that runs:
gcloud scheduler jobs create http daily-parliament-update \
    --location=us-west1 \
    --schedule="0 2 * * *" \
    --uri=https://us-west1-<YOUR_PROJECT_ID>.cloudfunctions.net/ingest-oireachtas-data \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body='{"type":"incremental","days_back":7}' \
    --time-zone="Europe/Dublin"
```

**What it updates:**
- âœ… New votes and divisions
- âœ… Parliamentary questions (written & oral)
- âœ… Debate records
- âœ… Bill status changes
- âŒ Member profiles (updated monthly)

**Cost**: ~$0.01/day = **$0.30/month**

### 2. Weekly Full Refresh
**Purpose**: Ensure data consistency and catch corrections  
**Schedule**: Sunday at 3:00 AM Dublin time  
**Scope**: Complete data from 2020 onwards

```bash
gcloud scheduler jobs create http weekly-parliament-full-refresh \
    --location=us-west1 \
    --schedule="0 3 * * 0" \
    --uri=https://us-west1-<YOUR_PROJECT_ID>.cloudfunctions.net/ingest-oireachtas-data \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body='{"type":"full"}' \
    --time-zone="Europe/Dublin"
```

**What it updates:**
- âœ… All votes from 2020
- âœ… All questions (up to 10,000 limit)
- âœ… All debates
- âœ… All bills from 2020
- âœ… Members, parties, houses, constituencies

**Cost**: ~$0.20/week = **$0.80/month**

### 3. Monthly Member Updates (Optional)
**Purpose**: Update member profiles, photos, and appointments  
**Schedule**: 1st of month at 4:00 AM  
**Scope**: Members, parties, houses, constituencies only

This can be added if member data changes frequently, but currently covered by weekly full refresh.

## Total Monthly Cost: ~$1.10

Breakdown:
- Daily incremental updates: $0.30
- Weekly full refresh: $0.80
- Cloud Scheduler: $0.00 (free tier covers this)
- Firestore reads/writes: Included in estimates

## Manual Operations

### Test Incremental Update
```powershell
# Test the fast incremental update (2-3 seconds)
.\scripts\trigger-incremental-update.ps1
```

### Trigger Full Refresh
```powershell
# Full data refresh (8+ minutes)
.\scripts\trigger-ingestion.ps1
```

### Check Last Update
```powershell
# View metadata about last ingestion
.\scripts\query-firestore-rest.ps1 -Collection metadata
```

### View Recent Data
```powershell
# Check recent votes
.\scripts\query-firestore-rest.ps1 -Collection votes -Limit 5

# Check recent questions
.\scripts\query-firestore-rest.ps1 -Collection questions -Limit 5

# Check recent debates
.\scripts\query-firestore-rest.ps1 -Collection debates -Limit 5
```

## Monitoring

### View Function Logs
```bash
# Last 50 log entries
gcloud functions logs read ingest-oireachtas-data --gen2 --region=us-west1 --limit=50

# Real-time log streaming
gcloud functions logs tail ingest-oireachtas-data --gen2 --region=us-west1
```

### Check Scheduler Status
```bash
# View all scheduled jobs
gcloud scheduler jobs list --location=us-west1

# View specific job details
gcloud scheduler jobs describe daily-parliament-update --location=us-west1

# View recent executions
gcloud scheduler jobs describe daily-parliament-update --location=us-west1 --format="value(state,lastAttemptTime)"
```

### Manual Scheduler Trigger
```bash
# Trigger incremental update now
gcloud scheduler jobs run daily-parliament-update --location=us-west1

# Trigger full refresh now
gcloud scheduler jobs run weekly-parliament-full-refresh --location=us-west1
```

### Pause/Resume Schedulers
```bash
# Pause daily updates (e.g., during development)
gcloud scheduler jobs pause daily-parliament-update --location=us-west1

# Resume daily updates
gcloud scheduler jobs resume daily-parliament-update --location=us-west1
```

## Data Collection Details

### Current Data Coverage

| Collection | Count | Date Range | Update Frequency |
|------------|-------|------------|------------------|
| **Members** | 1,927 | 1982 - Present | Weekly |
| **Parties** | 11 | All | Weekly |
| **Houses** | 68 | All | Weekly |
| **Constituencies** | 8 | Current | Weekly |
| **Bills** | 975 | 2020 - Present* | Daily |
| **Votes** | 2,018 | Feb 2020 - Present | Daily |
| **Questions** | 10,000 | Recent** | Daily |
| **Debates** | 4,043 | Recent | Daily |

*Note: Bills endpoint doesn't fully respect date filters, may include some historical data  
**Questions hit the 10,000 API limit - contains most recent parliamentary questions

### API Limitations
- **Maximum skip**: 10,000 records per endpoint
- **Page size**: 50 records (API limit)
- **Rate limits**: Not specified by Oireachtas API
- **Timeout**: 540 seconds (9 minutes) function timeout

## Adaptive Scheduling

### High Activity Periods
During budget debates, major legislation, or election campaigns:
```bash
# Increase to twice-daily updates
gcloud scheduler jobs update http daily-parliament-update \
    --schedule="0 2,14 * * *" \
    --location=us-west1
```
**Cost increase**: ~$0.30/month â†’ ~$0.60/month

### Recess Periods
During DÃ¡il recess (summer, Christmas):
```bash
# Reduce to weekly updates only
gcloud scheduler jobs pause daily-parliament-update --location=us-west1
```
**Cost savings**: ~$1.10/month â†’ ~$0.80/month

### Election Periods
During elections when member data changes frequently:
```bash
# Add daily member updates
# (Implement by modifying incremental function to include members)
```

## Troubleshooting

### Update Failed
```powershell
# Check recent logs for errors
gcloud functions logs read ingest-oireachtas-data --gen2 --region=us-west1 --limit=20

# Check function status
gcloud functions describe ingest-oireachtas-data --gen2 --region=us-west1

# Manually trigger to test
.\scripts\trigger-incremental-update.ps1
```

### Stale Data
```powershell
# Force a full refresh
.\scripts\trigger-ingestion.ps1

# Check when last update occurred
.\scripts\query-firestore-rest.ps1 -Collection metadata
```

### High Costs
```bash
# Check function invocation count
gcloud functions describe ingest-oireachtas-data --gen2 --region=us-west1 --format="value(serviceConfig.revision)"

# View billing dashboard
# https://console.cloud.google.com/billing/<YOUR_PROJECT_ID>
```

### Scheduler Not Running
```bash
# Verify scheduler job exists
gcloud scheduler jobs describe daily-parliament-update --location=us-west1

# Check if paused
gcloud scheduler jobs describe daily-parliament-update --location=us-west1 --format="value(state)"

# Resume if paused
gcloud scheduler jobs resume daily-parliament-update --location=us-west1
```

## Future Enhancements

### Potential Improvements
1. **Webhook Support**: If Oireachtas adds webhooks, implement event-driven updates
2. **Smart Scheduling**: Detect parliamentary sitting days and adjust frequency
3. **Change Detection**: Only update records that have actually changed
4. **Batch Optimization**: Further optimize API calls by detecting empty periods
5. **Member Photo Updates**: Dedicated endpoint for photo-only updates

### Cost Optimization Ideas
1. **Conditional Updates**: Skip updates when parliament is not sitting
2. **Delta Detection**: Compare checksums before updating records
3. **CDN Caching**: Cache static member data at CDN level
4. **Longer Intervals**: Reduce to weekly during known quiet periods

## Architecture Benefits

### Why This Approach Works
- âœ… **Separation of Concerns**: Incremental vs full refresh logic separated
- âœ… **Cost Effective**: 190x faster for daily updates
- âœ… **Reliable**: Weekly full refresh ensures data consistency
- âœ… **Flexible**: Easy to adjust frequency based on needs
- âœ… **Monitorable**: CloudWatch/GCP logs for all operations
- âœ… **Scalable**: Can handle increased parliamentary activity

### Comparison to Alternatives

| Approach | Cost/Month | Data Freshness | Maintenance |
|----------|------------|----------------|-------------|
| **Manual Updates** | $0.20 | Variable | High |
| **Full Refresh Daily** | $6.00 | 24 hours | Low |
| **Current (Hybrid)** | $1.10 | 24 hours | Low |
| **Real-time Polling** | $30+ | Real-time | Medium |
| **Webhook (if available)** | $0.50 | Real-time | Low |

## Deployment Checklist

- [x] Deploy Cloud Function with incremental support
- [x] Test incremental update manually
- [ ] Create daily scheduler job
- [ ] Create weekly full refresh job
- [ ] Set up monitoring alerts (optional)
- [ ] Document in team wiki/runbook
- [ ] Train team on manual operations
- [ ] Set up cost alerts in GCP billing

## Quick Reference

```powershell
# Deploy function
gcloud functions deploy ingest-oireachtas-data --gen2 --runtime=python311 --region=us-west1 --source=./cloud-functions/oireachtas-ingester --entry-point=ingest_oireachtas_data --trigger-http --allow-unauthenticated --timeout=540s --memory=1024MB --set-env-vars=GOOGLE_CLOUD_PROJECT=<YOUR_PROJECT_ID>

# Setup schedulers
.\scripts\setup-scheduler.ps1

# Test incremental
.\scripts\trigger-incremental-update.ps1

# Test full refresh
.\scripts\trigger-ingestion.ps1

# Check logs
gcloud functions logs read ingest-oireachtas-data --gen2 --region=us-west1 --limit=20

# View metadata
.\scripts\query-firestore-rest.ps1 -Collection metadata
```

---

**Last Updated**: November 4, 2025  
**Function Version**: ingest-oireachtas-data-00009-zux  
**Deployment Region**: us-west1  
**Memory Allocation**: 1024MB  
**Timeout**: 540 seconds


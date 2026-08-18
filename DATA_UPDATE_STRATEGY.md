# Cost-Effective Data Update Strategy for Parliament Explorer

## Current Data Volume
- **Members**: 1,927 (relatively static, update monthly)
- **Votes**: 2,018 from 2020
- **Questions**: 10,000 (very active)
- **Debates**: 4,043
- **Bills**: 975

## Recommended Update Strategy

### 1. **Daily Incremental Updates** (Primary)
**Cost**: ~$0.05/day = ~$1.50/month

- **Schedule**: Daily at 2 AM Dublin time
- **Scope**: Last 7 days of data
- **Collections**: Votes, Questions, Debates, Bill status changes
- **Execution time**: ~30-60 seconds (vs 8+ minutes for full refresh)
- **Benefits**: 
  - Fresh data for active parliamentary activity
  - Minimal API calls and function execution time
  - Catches all new votes, questions, debates
  - Updates bill status changes

### 2. **Weekly Full Refresh** (Backup)
**Cost**: ~$0.20/week = ~$0.80/month

- **Schedule**: Sunday at 3 AM
- **Scope**: Full data fetch with 2020 date filter
- **Purpose**: Catch any corrections or missed updates
- **Benefits**: Ensures data consistency

### 3. **Monthly Member Update** (Static Data)
**Cost**: ~$0.10/month

- **Schedule**: 1st of each month
- **Scope**: Members, Parties, Houses, Constituencies
- **Purpose**: Update member information, new TDs, ministers
- **Benefits**: Keeps profiles and photos current

## Total Monthly Cost
- **Daily incremental**: $1.50
- **Weekly full refresh**: $0.80
- **Monthly member update**: $0.10
- **Cloud Scheduler**: $0.10
- **Cloud Functions**: $0.50 (generous estimate)
- **Firestore writes**: ~$1.00
- **Total**: **~$4.00/month**

## Setup Commands

### 1. Deploy Updated Function
```powershell
gcloud functions deploy ingest-oireachtas-data `
    --gen2 --runtime=python311 --region=us-west1 `
    --source=./cloud-functions/oireachtas-ingester `
    --entry-point=ingest_oireachtas_data --trigger-http --allow-unauthenticated `
    --timeout=540s --memory=1024MB `
    --set-env-vars=GOOGLE_CLOUD_PROJECT=<YOUR_PROJECT_ID>
```

### 2. Create Daily Scheduler
```bash
.\scripts\setup-scheduler.ps1
```

### 3. Test Incremental Update
```powershell
.\scripts\trigger-incremental-update.ps1
```

## Alternative Approaches

### A. **On-Demand Only** (Lowest Cost)
- **Cost**: ~$0.20/month
- Trigger updates manually when needed
- Good for development, not production

### B. **Event-Driven Updates**
- **Cost**: Variable, potentially free
- Use webhooks if Oireachtas API provides them (they don't currently)
- Monitor RSS feeds or change notifications

### C. **Hybrid Approach** (Recommended for Production)
- Daily incremental (Mon-Fri)
- Weekend-only for debates/questions
- Monthly full refresh
- **Cost**: ~$2.50/month

## Performance Comparison

| Update Type | Duration | API Calls | Records Updated | Cost per Run |
|-------------|----------|-----------|-----------------|--------------|
| Full Refresh | 8+ min | ~800 | ~18,000 | $0.20 |
| Incremental (7 days) | 30-60 sec | ~50 | ~100-500 | $0.05 |
| Members Only | 2 min | ~50 | ~2,000 | $0.03 |

## Monitoring

Check update logs:
```powershell
gcloud functions logs read ingest-oireachtas-data --gen2 --region=us-west1 --limit=20
```

Check scheduler status:
```bash
gcloud scheduler jobs describe daily-parliament-update --location=us-west1
```

View last update metadata:
```powershell
.\scripts\query-firestore-rest.ps1 -Collection metadata
```

## Scaling Considerations

As parliamentary activity increases:
- **High Activity Periods** (budget day, major votes): Increase to twice-daily
- **Recess Periods** (summer, Christmas): Reduce to weekly
- **Election Campaigns**: Daily or twice-daily
- **Off-Season**: Weekly or bi-weekly

## Implementation Priority

1. âœ… **Deploy updated function** with incremental support
2. âœ… **Test incremental update** manually
3. **Set up daily scheduler** for automated updates
4. **Monitor costs** for first month
5. **Adjust frequency** based on usage patterns


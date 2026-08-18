# Oireachtas Members API - Cloud Run Service

A high-performance Node.js/TypeScript API service that serves the ingested Oireachtas data from Firestore.

## Clone-Friendly Bootstrap

This API is now designed to run in a cloner's own GCP project.

Key runtime env vars:
- `GOOGLE_CLOUD_PROJECT`
- `BQ_DATASET` (default `parliamentary_data`)
- `PARLIAMENT_ADAPTER` (default `oireachtas`)
- `PARLIAMENT_NAME`
- `PARLIAMENT_API_BASE_URL`
- `PARLIAMENT_DATA_SOURCE`

Use the repository bootstrap scripts from project root:
- Windows: `scripts/bootstrap-gcp.ps1`
- Linux/macOS: `scripts/bootstrap-gcp.sh`

These scripts provision Firebase/Firestore, BigQuery, Cloud Run services, ingestion job, and scheduler in the target project.

## API Endpoints

### GET /api/filters
Returns all available filter options for the frontend.

**Response:**
```typescript
{
  parties: Array<{partyCode: string, showAs: string, memberCount: number}>,
  houses: Array<{houseCode: string, houseNo: string, showAs: string, memberCount: number}>,
  constituencies: Array<{representCode: string, showAs: string, memberCount: number}>,
  lastUpdated: string
}
```

### GET /api/members
Returns filtered members with pagination.

**Query Parameters:**
- `party` (optional): Filter by party code
- `house` (optional): Filter by house code-number
- `constituency` (optional): Filter by constituency code  
- `search` (optional): Search in member names
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `active_only` (optional): Only active members (default: true)

**Response:**
```typescript
{
  members: Array<{
    memberCode: string,
    fullName: string,
    photoUrl: string | null,
    currentParty: string | null,
    currentHouse: string | null,
    currentConstituency: string | null,
    isActive: boolean
  }>,
  total: number,
  hasMore: boolean,
  filters: {
    applied: object,
    available: object
  }
}
```

### GET /api/members/:memberCode
Returns detailed information for a specific member.

**Response:**
```typescript
{
  member: {
    memberCode: string,
    fullName: string,
    photoUrl: string | null,
    currentParty: string | null,
    currentHouse: string | null,
    currentConstituency: string | null,
    isActive: boolean,
    memberships: Array<object>,
    lastUpdated: string
  }
}
```

### GET /api/health
Health check endpoint.

## Performance Features

- **Firestore Caching**: Efficient queries with composite indexes
- **Response Caching**: 5-minute cache for filter data, 1-minute for member lists
- **Connection Pooling**: Optimized Firestore connections
- **Pagination**: Cursor-based pagination for large datasets
- **Compression**: Gzip compression for all responses
- **CORS**: Configured for your frontend domain

## Deployment

```bash
# Preferred: deploy from repository root bootstrap scripts
# Windows: ./scripts/bootstrap-gcp.ps1
# Linux/macOS: ./scripts/bootstrap-gcp.sh

# Manual fallback (from repository root)
gcloud run deploy parliament-api \
  --source ./cloud-run-api \
  --platform managed \
  --region us-west1 \
  --project <YOUR_PROJECT_ID> \
  --allow-unauthenticated
```
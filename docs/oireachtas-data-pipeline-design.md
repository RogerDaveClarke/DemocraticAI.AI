# Oireachtas Data Pipeline - GCP Architecture

## Overview
Design for a comprehensive data ingestion, storage, and serving solution for Irish Oireachtas data using Google Cloud Platform.

## Current Problem
- Direct API calls from frontend are slow (multiple endpoints, pagination)
- No relationship establishment between entities
- Missing member photos from API
- 50-item pagination limits require multiple requests
- Poor user experience with loading times

## Proposed Solution Architecture

### 1. Data Ingestion (Cloud Functions)

#### Primary Ingestion Function
**Function Name**: `oireachtas-data-ingester`
**Runtime**: Python 3.11
**Trigger**: Cloud Scheduler (daily at 6 AM UTC)
**Memory**: 1GB
**Timeout**: 15 minutes

**Data Sources to Consume**:
1. **Members API**: `https://api.oireachtas.ie/v1/members?skip={skip}&limit=50`
2. **Parties API**: `https://api.oireachtas.ie/v1/parties?limit=50`
3. **Houses API**: `https://api.oireachtas.ie/v1/houses?limit=100`
4. **Constituencies API**: `https://api.oireachtas.ie/v1/constituencies?chamber=dail&skip={skip}&limit=50`
5. **Member Photos**: `https://data.oireachtas.ie/ie/oireachtas/member/id/{memberCode}/image/thumb`

#### Photo Enrichment Function
**Function Name**: `oireachtas-photo-enricher`
**Runtime**: Python 3.11
**Trigger**: Pub/Sub (triggered after main ingestion)
**Memory**: 512MB
**Timeout**: 10 minutes

### 2. Data Storage Strategy

#### Primary Database: Cloud Firestore
```
Collection Structure:
â”œâ”€â”€ members/
â”‚   â”œâ”€â”€ {memberCode}/
â”‚   â”‚   â”œâ”€â”€ fullName: string
â”‚   â”‚   â”œâ”€â”€ memberCode: string
â”‚   â”‚   â”œâ”€â”€ photoUrl: string
â”‚   â”‚   â”œâ”€â”€ memberships: array
â”‚   â”‚   â”œâ”€â”€ currentParty: string (denormalized)
â”‚   â”‚   â”œâ”€â”€ currentConstituency: string (denormalized)
â”‚   â”‚   â”œâ”€â”€ currentHouse: string (denormalized)
â”‚   â”‚   â”œâ”€â”€ isActive: boolean
â”‚   â”‚   â”œâ”€â”€ lastUpdated: timestamp
â”‚   â”‚   â””â”€â”€ metadata: object
â”œâ”€â”€ parties/
â”‚   â”œâ”€â”€ {partyCode}/
â”‚   â”‚   â”œâ”€â”€ partyCode: string
â”‚   â”‚   â”œâ”€â”€ showAs: string
â”‚   â”‚   â”œâ”€â”€ memberCount: number (computed)
â”‚   â”‚   â””â”€â”€ lastUpdated: timestamp
â”œâ”€â”€ houses/
â”‚   â”œâ”€â”€ {houseCode}-{houseNo}/
â”‚   â”‚   â”œâ”€â”€ houseCode: string
â”‚   â”‚   â”œâ”€â”€ houseNo: string
â”‚   â”‚   â”œâ”€â”€ showAs: string
â”‚   â”‚   â”œâ”€â”€ memberCount: number (computed)
â”‚   â”‚   â””â”€â”€ lastUpdated: timestamp
â”œâ”€â”€ constituencies/
â”‚   â”œâ”€â”€ {representCode}/
â”‚   â”‚   â”œâ”€â”€ representCode: string
â”‚   â”‚   â”œâ”€â”€ showAs: string
â”‚   â”‚   â”œâ”€â”€ chamber: string
â”‚   â”‚   â”œâ”€â”€ memberCount: number (computed)
â”‚   â”‚   â””â”€â”€ lastUpdated: timestamp
â””â”€â”€ sync_metadata/
    â”œâ”€â”€ last_sync: timestamp
    â”œâ”€â”€ sync_status: string
    â””â”€â”€ error_log: array
```

#### Photo Storage: Cloud Storage
```
Bucket: {project-id}-oireachtas-photos
Structure:
â”œâ”€â”€ members/
â”‚   â”œâ”€â”€ {memberCode}/
â”‚   â”‚   â”œâ”€â”€ thumb.jpg (64x64)
â”‚   â”‚   â”œâ”€â”€ medium.jpg (256x256)
â”‚   â”‚   â””â”€â”€ large.jpg (512x512)
```

### 3. API Layer (Cloud Run)

#### Members API Service
**Service Name**: `oireachtas-members-api`
**Runtime**: Node.js 18 / TypeScript
**Scaling**: 0-10 instances
**Memory**: 1GB CPU

**Endpoints**:
```typescript
// GET /api/members
// Query params: party, house, constituency, limit, offset, search
interface MembersResponse {
  members: Member[];
  total: number;
  hasMore: boolean;
  filters: {
    parties: Party[];
    houses: House[];
    constituencies: Constituency[];
  };
}

// GET /api/members/{memberCode}
interface MemberDetailResponse {
  member: Member;
  memberships: Membership[];
  photoUrl: string;
}

// GET /api/filters
interface FiltersResponse {
  parties: Party[];
  houses: House[];
  constituencies: Constituency[];
  lastUpdated: string;
}
```

### 4. Frontend Integration

#### Updated Officials.tsx Structure
```typescript
// Replace direct API calls with single endpoint
const API_BASE = process.env.REACT_APP_API_BASE || '/api';

// Single call to get all filter data
const filtersResponse = await fetch(`${API_BASE}/filters`);

// Efficient member fetching with combined filters
const membersResponse = await fetch(
  `${API_BASE}/members?${new URLSearchParams({
    party: selectedParty,
    house: selectedHouse,
    constituency: selectedConstituency,
    limit: '50',
    offset: '0'
  })}`
);
```

### 5. Cloud Function Implementation

#### Main Ingestion Function (Python)
```python
import functions_framework
import requests
import json
from google.cloud import firestore
from google.cloud import storage
from google.cloud import pubsub_v1
import concurrent.futures
from datetime import datetime
import logging

@functions_framework.http
def ingest_oireachtas_data(request):
    """Main data ingestion function"""
    
    db = firestore.Client()
    publisher = pubsub_v1.PublisherClient()
    
    try:
        # 1. Ingest Parties (single call, <50 results)
        parties = ingest_parties(db)
        
        # 2. Ingest Houses (single call, <100 results)  
        houses = ingest_houses(db)
        
        # 3. Ingest Constituencies (paginated)
        constituencies = ingest_constituencies_paginated(db)
        
        # 4. Ingest Members (heavily paginated)
        members = ingest_members_paginated(db)
        
        # 5. Trigger photo enrichment
        topic_path = publisher.topic_path(PROJECT_ID, 'photo-enrichment')
        message = json.dumps({'member_codes': [m['memberCode'] for m in members]})
        publisher.publish(topic_path, message.encode('utf-8'))
        
        # 6. Update sync metadata
        update_sync_metadata(db, 'success')
        
        return {'status': 'success', 'members': len(members)}
        
    except Exception as e:
        logging.error(f"Ingestion failed: {str(e)}")
        update_sync_metadata(db, 'error', str(e))
        return {'status': 'error', 'message': str(e)}, 500

def ingest_members_paginated(db):
    """Ingest all members with pagination"""
    members = []
    skip = 0
    limit = 50
    
    while True:
        url = f"https://api.oireachtas.ie/v1/members?skip={skip}&limit={limit}"
        response = requests.get(url, timeout=30)
        data = response.json()
        
        if not data.get('results'):
            break
            
        batch = db.batch()
        batch_members = []
        
        for item in data['results']:
            member = process_member_data(item['member'])
            members.append(member)
            batch_members.append(member)
            
            # Add to Firestore batch
            doc_ref = db.collection('members').document(member['memberCode'])
            batch.set(doc_ref, member)
        
        # Commit batch
        batch.commit()
        
        # Check if we've got all results
        if len(data['results']) < limit:
            break
            
        skip += limit
        
    return members

def process_member_data(member_data):
    """Process and enrich member data"""
    
    # Extract current membership info for denormalization
    current_party = None
    current_constituency = None
    current_house = None
    is_active = False
    
    if member_data.get('memberships'):
        for membership in member_data['memberships']:
            membership_data = membership.get('membership', {})
            
            # Check if this is current membership (you'd need to implement date logic)
            if is_current_membership(membership_data):
                is_active = True
                
                # Extract party
                parties = membership_data.get('parties', [])
                if parties:
                    current_party = parties[0]['party']['partyCode']
                
                # Extract house
                house = membership_data.get('house', {})
                if house:
                    current_house = f"{house['houseCode']}-{house.get('houseNo', '')}"
                
                # Extract constituency would need additional logic
                break
    
    return {
        'memberCode': member_data['memberCode'],
        'fullName': member_data['fullName'],
        'memberships': member_data.get('memberships', []),
        'currentParty': current_party,
        'currentConstituency': current_constituency,
        'currentHouse': current_house,
        'isActive': is_active,
        'photoUrl': None,  # Will be populated by photo enrichment function
        'lastUpdated': datetime.utcnow(),
        'metadata': {
            'source': 'oireachtas_api',
            'version': '1.0'
        }
    }
```

#### Photo Enrichment Function
```python
@functions_framework.cloud_event
def enrich_member_photos(cloud_event):
    """Download and store member photos"""
    
    db = firestore.Client()
    storage_client = storage.Client()
    bucket = storage_client.bucket(f"{PROJECT_ID}-oireachtas-photos")
    
    # Parse member codes from Pub/Sub message
    member_codes = json.loads(cloud_event.data['message']['data'])['member_codes']
    
    # Process photos concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        
        for member_code in member_codes:
            future = executor.submit(download_and_store_photo, member_code, db, bucket)
            futures.append(future)
        
        # Wait for all downloads to complete
        concurrent.futures.wait(futures)

def download_and_store_photo(member_code, db, bucket):
    """Download and store a single member's photo"""
    
    try:
        # Download photo from Oireachtas
        photo_url = f"https://data.oireachtas.ie/ie/oireachtas/member/id/{member_code}/image/thumb"
        response = requests.get(photo_url, timeout=10)
        
        if response.status_code == 200:
            # Store in Cloud Storage
            blob_path = f"members/{member_code}/thumb.jpg"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(response.content, content_type='image/jpeg')
            
            # Update Firestore with photo URL
            public_url = f"https://storage.googleapis.com/{bucket.name}/{blob_path}"
            db.collection('members').document(member_code).update({
                'photoUrl': public_url
            })
            
            logging.info(f"Photo stored for {member_code}")
        else:
            logging.warning(f"No photo found for {member_code}")
            
    except Exception as e:
        logging.error(f"Failed to process photo for {member_code}: {str(e)}")
```

### 6. Deployment Scripts

#### Cloud Function Deployment
```bash
# Deploy ingestion function
gcloud functions deploy oireachtas-data-ingester \
    --runtime python311 \
    --trigger-http \
    --memory 1GB \
    --timeout 900s \
    --env-vars-file .env.yaml \
    --region europe-west1

# Deploy photo enrichment function  
gcloud functions deploy oireachtas-photo-enricher \
    --runtime python311 \
    --trigger-topic photo-enrichment \
    --memory 512MB \
    --timeout 600s \
    --region europe-west1

# Create Cloud Scheduler job
gcloud scheduler jobs create http oireachtas-daily-sync \
    --schedule="0 6 * * *" \
    --uri="https://europe-west1-{project-id}.cloudfunctions.net/oireachtas-data-ingester" \
    --http-method=POST \
    --time-zone="UTC"
```

### 7. Cost Estimation

**Monthly Costs (estimated)**:
- **Cloud Functions**: ~$5-15 (daily execution)
- **Firestore**: ~$10-25 (reads/writes/storage)  
- **Cloud Storage**: ~$1-5 (photo storage)
- **Cloud Run**: ~$5-15 (API serving)
- **Cloud Scheduler**: ~$0.10
- **Pub/Sub**: ~$1

**Total**: ~$22-60/month depending on usage

### 8. Performance Improvements

**Before (Current)**:
- Multiple API calls: 4+ requests
- Pagination handling: Multiple round trips
- No caching: Fresh API calls every time
- No photos: Missing visual data
- Response time: 2-5 seconds

**After (Proposed)**:
- Single API call: 1 request for filtered data
- Pre-computed relationships: Instant filtering
- Cached in Firestore: Sub-second responses
- Photos included: Rich visual experience  
- Response time: 200-500ms

### 9. Implementation Steps

1. **Phase 1**: Set up GCP project and basic Cloud Functions
2. **Phase 2**: Implement data ingestion pipeline
3. **Phase 3**: Build Cloud Run API service
4. **Phase 4**: Update frontend to use new API
5. **Phase 5**: Add photo enrichment
6. **Phase 6**: Optimize and monitor

This architecture provides:
- âœ… Fast frontend performance (single API call)
- âœ… Rich data relationships  
- âœ… Member photos included
- âœ… Scalable and cost-effective
- âœ… Automated daily updates
- âœ… Error handling and monitoring

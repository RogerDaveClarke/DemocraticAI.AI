# Parliament Project - US Region Migration Plan

## Current State Analysis
- **Current Project**: `<YOUR_PROJECT_ID>`
- **Issue**: Firestore database in `europe-west2` (cannot be moved)
- **Goal**: Migrate to new project with all resources in US regions

## Migration Strategy

### Phase 1: Create New Project & Setup
1. **Create new Google Cloud project**
   - Project ID: `myparliament-us` (or similar)
   - Default region: `us-west1`

2. **Enable required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable cloudfunctions.googleapis.com
   ```

3. **Create Firestore database in US region**
   ```bash
   gcloud firestore databases create --location=us-west1
   ```

4. **Create Cloud Storage bucket in US**
   ```bash
   gsutil mb -l us-west1 gs://<YOUR_IMAGES_BUCKET_SOURCE>-us
   ```

### Phase 2: Data Migration
1. **Export current Firestore data**
   - Export collections: members, parties, sessions, etc.
   - Use Firestore export/import tools

2. **Copy Cloud Storage images**
   ```bash
   gsutil -m cp -r gs://<YOUR_IMAGES_BUCKET_SOURCE>/* gs://<YOUR_IMAGES_BUCKET_SOURCE>-us/
   ```

3. **Import data to new Firestore**
   - Import all collections to new database
   - Verify data integrity

### Phase 3: Service Migration
1. **Update configuration files**
   - Update project ID in all config files
   - Update bucket names
   - Update service URLs

2. **Deploy services to new project**
   - Cloud Run API service
   - Cloud Run frontend service
   - Cloud Functions (ingester)

3. **Update domain/DNS**
   - Point custom domains to new services
   - Update CORS settings

### Phase 4: Testing & Validation
1. **Test all functionality**
   - API endpoints
   - Frontend features
   - Data ingestion
   - Image serving

2. **Performance validation**
   - Latency improvements from US hosting
   - Verify all features work correctly

### Phase 5: Cleanup
1. **Gradually reduce old project usage**
2. **Monitor for 48 hours**
3. **Delete old project resources**

## Files Requiring Updates

### Configuration Files
- `cloud-run-api/src/index.ts` - Project ID, bucket names
- `scripts/upload-party-images.js` - Bucket name
- `scripts/update-member-photos.js` - Project/bucket config
- `scripts/ingest-data.js` - Project ID
- Any other scripts with hardcoded project references

### Environment Variables
- `GOOGLE_CLOUD_PROJECT`
- `STORAGE_BUCKET_NAME` 
- `FIRESTORE_PROJECT_ID`

## Timeline
- **Day 1**: Project setup, Firestore creation
- **Day 2**: Data migration and validation
- **Day 3**: Service deployment and testing
- **Day 4**: DNS updates and final validation
- **Day 5**: Cleanup old resources

## Risk Mitigation
- Keep old project running during migration
- Test extensively before switching DNS
- Have rollback plan ready
- Export all data before starting

## Cost Considerations
- Temporary duplicate resources during migration
- Data transfer costs (minimal for this project size)
- Improved latency for US users

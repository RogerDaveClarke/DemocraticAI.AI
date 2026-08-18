"""
Oireachtas Data Ingestion Cloud Function - Simplified Version
Python implementation for ingesting Oireachtas API data without photo storage
"""

import functions_framework
import requests
import json
from google.cloud import firestore
import concurrent.futures
from datetime import datetime, timezone
import logging
import time
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OireachtasIngester:
    def __init__(self):
        self.firestore_client = firestore.Client()
        self.base_url = "https://api.oireachtas.ie/v1"
        
    def paginated_fetch(self, endpoint, params=None):
        """Fetch all pages from a paginated endpoint"""
        if params is None:
            params = {}
        
        all_results = []
        params['limit'] = 50  # API max limit
        skip = 0
        
        while True:
            params['skip'] = skip
            try:
                response = requests.get(f"{self.base_url}/{endpoint}", params=params)
                response.raise_for_status()
                data = response.json()
                
                # Handle different response structures
                if 'results' in data:
                    results = data['results']
                elif 'houses' in data:
                    results = data['houses']
                elif 'parties' in data:
                    results = data['parties']
                elif 'constituencies' in data:
                    results = data['constituencies']
                else:
                    logger.warning(f"Unknown response structure for {endpoint}")
                    break
                
                if not results:
                    break
                    
                all_results.extend(results)
                
                # Check if we got fewer results than requested (last page)
                if len(results) < params['limit']:
                    break
                    
                skip += params['limit']
                
            except requests.RequestException as e:
                logger.error(f"Error fetching {endpoint}: {e}")
                break
                
        return all_results
    
    def fetch_members(self):
        """Fetch all members with their details"""
        logger.info("Fetching members...")
        
        # Fetch members from multiple houses
        all_members = []
        
        # Dáil members
        dail_members = self.paginated_fetch("members", {
            "chamber_type": "house",
            "chamber_id": "dail",
            "date_start": "1900-01-01"
        })
        
        # Seanad members
        seanad_members = self.paginated_fetch("members", {
            "chamber_type": "house", 
            "chamber_id": "seanad",
            "date_start": "1900-01-01"
        })
        
        all_members = dail_members + seanad_members
        
        logger.info(f"Fetched {len(all_members)} members")
        return all_members
    
    def fetch_parties(self):
        """Fetch all political parties"""
        logger.info("Fetching parties...")
        parties = self.paginated_fetch("parties")
        logger.info(f"Fetched {len(parties)} parties")
        return parties
    
    def fetch_houses(self):
        """Fetch all houses"""
        logger.info("Fetching houses...")
        houses = self.paginated_fetch("houses")
        logger.info(f"Fetched {len(houses)} houses")
        return houses
    
    def fetch_constituencies(self):
        """Fetch all constituencies"""
        logger.info("Fetching constituencies...")
        constituencies = self.paginated_fetch("constituencies")
        logger.info(f"Fetched {len(constituencies)} constituencies")
        return constituencies
    
    def store_data(self, collection_name, data, doc_id_field):
        """Store data in Firestore"""
        logger.info(f"Storing {len(data)} documents in {collection_name}")
        
        batch = self.firestore_client.batch()
        batch_count = 0
        
        for item in data:
            if doc_id_field in item:
                doc_id = str(item[doc_id_field])
                doc_ref = self.firestore_client.collection(collection_name).document(doc_id)
                
                # Add metadata
                item['updated_at'] = datetime.now(timezone.utc)
                item['ingested_at'] = datetime.now(timezone.utc)
                
                batch.set(doc_ref, item)
                batch_count += 1
                
                # Commit batch every 500 operations (Firestore limit)
                if batch_count >= 500:
                    batch.commit()
                    batch = self.firestore_client.batch()
                    batch_count = 0
        
        # Commit remaining operations
        if batch_count > 0:
            batch.commit()
            
        logger.info(f"Successfully stored {len(data)} documents in {collection_name}")
    
    def run_ingestion(self):
        """Run the complete data ingestion process"""
        logger.info("Starting Oireachtas data ingestion...")
        start_time = time.time()
        
        try:
            # Fetch all data
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                futures = {
                    executor.submit(self.fetch_members): 'members',
                    executor.submit(self.fetch_parties): 'parties', 
                    executor.submit(self.fetch_houses): 'houses',
                    executor.submit(self.fetch_constituencies): 'constituencies'
                }
                
                results = {}
                for future in concurrent.futures.as_completed(futures):
                    data_type = futures[future]
                    try:
                        results[data_type] = future.result()
                    except Exception as e:
                        logger.error(f"Error fetching {data_type}: {e}")
                        results[data_type] = []
            
            # Store all data
            storage_tasks = [
                (results['members'], 'members', 'memberCode'),
                (results['parties'], 'parties', 'partyCode'),
                (results['houses'], 'houses', 'houseCode'),
                (results['constituencies'], 'constituencies', 'constituencyCode')
            ]
            
            for data, collection, id_field in storage_tasks:
                if data:
                    self.store_data(collection, data, id_field)
            
            # Store ingestion metadata
            metadata = {
                'last_ingestion': datetime.now(timezone.utc),
                'duration_seconds': time.time() - start_time,
                'counts': {
                    'members': len(results['members']),
                    'parties': len(results['parties']),
                    'houses': len(results['houses']),
                    'constituencies': len(results['constituencies'])
                }
            }
            
            self.firestore_client.collection('metadata').document('last_ingestion').set(metadata)
            
            logger.info(f"Ingestion completed in {metadata['duration_seconds']:.2f} seconds")
            return metadata
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            raise

@functions_framework.http
def ingest_oireachtas_data(request):
    """HTTP Cloud Function entry point"""
    
    # Enable CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        ingester = OireachtasIngester()
        result = ingester.run_ingestion()
        
        return (json.dumps({
            'success': True,
            'message': 'Data ingestion completed successfully',
            'metadata': result
        }), 200, headers)
        
    except Exception as e:
        logger.error(f"Function execution failed: {e}")
        return (json.dumps({
            'success': False,
            'error': str(e)
        }), 500, headers)
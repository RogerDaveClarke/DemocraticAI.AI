"""
Comprehensive Oireachtas Legislation Ingestion Script
Extracts bills, acts, and their relationships for complete legislative data
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging
import firebase_admin
from firebase_admin import credentials, firestore
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OireachtasLegislationIngester:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        
        # Initialize Firebase
        self.init_firebase()
        
    def init_firebase(self):
        """Initialize Firebase connection"""
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            self.db = firestore.client()
            logger.info("Firebase initialized successfully")
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            raise
    
    def ingest_legislation(self, limit=50, bill_status=None):
        """Main ingestion function for legislation"""
        logger.info(f"Starting legislation ingestion, limit: {limit}, status: {bill_status}")
        
        start_time = time.time()
        bills_count = 0
        acts_count = 0
        stages_count = 0
        debates_count = 0
        
        try:
            # Build parameters
            params = {
                'limit': limit
            }
            
            if bill_status:
                params['bill_status'] = bill_status
            
            response = requests.get(f"{self.base_url}/legislation", params=params)
            response.raise_for_status()
            data = response.json()
            
            bills = data.get('results', [])
            logger.info(f"Found {len(bills)} bills to process")
            
            for i, bill_wrapper in enumerate(bills):
                logger.info(f"\nProcessing bill {i+1}/{len(bills)}")
                
                bill_data = bill_wrapper.get('bill', {})
                if not bill_data:
                    continue
                
                # Process main bill data
                bill_id = self.process_bill(bill_data)
                if bill_id:
                    bills_count += 1
                    
                    # Process associated act if it exists
                    if bill_data.get('act'):
                        act_id = self.process_act(bill_data['act'], bill_id)
                        if act_id:
                            acts_count += 1
                    
                    # Process stages
                    stages = bill_data.get('stages', [])
                    for stage_wrapper in stages:
                        stage_data = stage_wrapper.get('event', {})
                        if stage_data:
                            self.process_bill_stage(stage_data, bill_id)
                            stages_count += 1
                    
                    # Process related debates
                    debates = bill_data.get('debates', [])
                    for debate in debates:
                        self.process_bill_debate(debate, bill_id)
                        debates_count += 1
                    
                    # Process sponsors
                    sponsors = bill_data.get('sponsors', [])
                    for sponsor_wrapper in sponsors:
                        sponsor_data = sponsor_wrapper.get('sponsor', {})
                        if sponsor_data:
                            self.process_bill_sponsor(sponsor_data, bill_id)
                    
                    # Process amendment lists
                    amendment_lists = bill_data.get('amendmentLists', [])
                    for amendment_wrapper in amendment_lists:
                        amendment_data = amendment_wrapper.get('amendmentList', {})
                        if amendment_data:
                            self.process_amendment_list(amendment_data, bill_id)
            
            # Store ingestion metadata
            duration = time.time() - start_time
            self.store_ingestion_metadata('legislation', {
                'bills': bills_count,
                'acts': acts_count,
                'stages': stages_count,
                'debates': debates_count
            }, duration, limit)
            
            logger.info(f"Legislation ingestion completed: {bills_count} bills, {acts_count} acts, {stages_count} stages, {debates_count} debates in {duration:.2f}s")
            
        except Exception as e:
            logger.error(f"Error in legislation ingestion: {e}")
            raise
    
    def process_bill(self, bill_data):
        """Process main bill data"""
        try:
            # Generate bill ID
            bill_no = bill_data.get('billNo')
            bill_year = bill_data.get('billYear')
            
            if not bill_no or not bill_year:
                logger.warning("Missing bill number or year")
                return None
            
            bill_id = f"bill_{bill_year}_{bill_no}"
            
            # Process bill information
            processed_bill = {
                'bill_no': bill_no,
                'bill_year': bill_year,
                'bill_type': bill_data.get('billType'),
                'bill_type_uri': bill_data.get('billTypeURI'),
                'short_title_en': bill_data.get('shortTitleEn'),
                'short_title_ga': bill_data.get('shortTitleGa'),
                'long_title_en': self.clean_html_content(bill_data.get('longTitleEn', '')),
                'long_title_ga': self.clean_html_content(bill_data.get('longTitleGa', '')),
                'status': bill_data.get('status'),
                'status_uri': bill_data.get('statusURI'),
                'source': bill_data.get('source'),
                'source_uri': bill_data.get('sourceURI'),
                'method': bill_data.get('method'),
                'method_uri': bill_data.get('methodURI'),
                'uri': bill_data.get('uri'),
                'last_updated': bill_data.get('lastUpdated'),
                'ingested_at': datetime.now().isoformat()
            }
            
            # Process origin house
            origin_house = bill_data.get('originHouse', {})
            if origin_house:
                processed_bill['origin_house'] = {
                    'show_as': origin_house.get('showAs'),
                    'uri': origin_house.get('uri')
                }
            
            # Process most recent stage
            most_recent_stage = bill_data.get('mostRecentStage', {}).get('event', {})
            if most_recent_stage:
                processed_bill['most_recent_stage'] = {
                    'show_as': most_recent_stage.get('showAs'),
                    'progress_stage': most_recent_stage.get('progressStage'),
                    'stage_completed': most_recent_stage.get('stageCompleted'),
                    'stage_outcome': most_recent_stage.get('stageOutcome'),
                    'dates': [date_obj.get('date') for date_obj in most_recent_stage.get('dates', [])],
                    'uri': most_recent_stage.get('uri')
                }
            
            # Store bill
            self.db.collection('bills').document(bill_id).set(processed_bill)
            logger.info(f"Stored bill: {bill_id} - {processed_bill['short_title_en']}")
            
            return bill_id
            
        except Exception as e:
            logger.error(f"Error processing bill: {e}")
            return None
    
    def process_act(self, act_data, bill_id):
        """Process act data (when bill becomes law)"""
        try:
            act_no = act_data.get('actNo')
            act_year = act_data.get('actYear')
            
            if not act_no or not act_year:
                return None
            
            act_id = f"act_{act_year}_{act_no}"
            
            processed_act = {
                'act_no': act_no,
                'act_year': act_year,
                'date_signed': act_data.get('dateSigned'),
                'short_title_en': act_data.get('shortTitleEn'),
                'short_title_ga': act_data.get('shortTitleGa'),
                'long_title_en': self.clean_html_content(act_data.get('longTitleEn', '')),
                'long_title_ga': self.clean_html_content(act_data.get('longTitleGa', '')),
                'statute_book_uri': act_data.get('statutebookURI'),
                'uri': act_data.get('uri'),
                'bill_id': bill_id,  # Link back to originating bill
                'ingested_at': datetime.now().isoformat()
            }
            
            # Store act
            self.db.collection('acts').document(act_id).set(processed_act)
            logger.info(f"Stored act: {act_id} - {processed_act['short_title_en']}")
            
            return act_id
            
        except Exception as e:
            logger.error(f"Error processing act: {e}")
            return None
    
    def process_bill_stage(self, stage_data, bill_id):
        """Process bill stage information"""
        try:
            stage_uri = stage_data.get('uri')
            if not stage_uri:
                return
            
            # Generate stage ID from URI
            stage_id = f"{bill_id}_stage_{stage_data.get('progressStage', 'unknown')}"
            
            processed_stage = {
                'bill_id': bill_id,
                'progress_stage': stage_data.get('progressStage'),
                'show_as': stage_data.get('showAs'),
                'stage_completed': stage_data.get('stageCompleted'),
                'stage_outcome': stage_data.get('stageOutcome'),
                'stage_uri': stage_data.get('stageURI'),
                'uri': stage_uri,
                'dates': [date_obj.get('date') for date_obj in stage_data.get('dates', [])],
                'ingested_at': datetime.now().isoformat()
            }
            
            # Process chamber information
            chamber = stage_data.get('chamber', {})
            if chamber:
                processed_stage['chamber'] = {
                    'chamber_code': chamber.get('chamberCode'),
                    'show_as': chamber.get('showAs'),
                    'uri': chamber.get('uri')
                }
            
            # Process house information
            house = stage_data.get('house', {})
            if house:
                processed_stage['house'] = {
                    'chamber_code': house.get('chamberCode'),
                    'chamber_type': house.get('chamberType'),
                    'house_code': house.get('houseCode'),
                    'house_no': house.get('houseNo'),
                    'show_as': house.get('showAs'),
                    'uri': house.get('uri')
                }
            
            # Store stage
            self.db.collection('bill_stages').document(stage_id).set(processed_stage)
            
        except Exception as e:
            logger.error(f"Error processing bill stage: {e}")
    
    def process_bill_debate(self, debate_data, bill_id):
        """Process bill-related debate information"""
        try:
            debate_uri = debate_data.get('uri')
            if not debate_uri:
                return
            
            # Generate debate relation ID
            debate_id = f"{bill_id}_debate_{hash(debate_uri) % 1000000}"
            
            processed_debate = {
                'bill_id': bill_id,
                'date': debate_data.get('date'),
                'show_as': debate_data.get('showAs'),
                'debate_section_id': debate_data.get('debateSectionId'),
                'uri': debate_uri,
                'ingested_at': datetime.now().isoformat()
            }
            
            # Process chamber information
            chamber = debate_data.get('chamber', {})
            if chamber:
                processed_debate['chamber'] = {
                    'show_as': chamber.get('showAs'),
                    'uri': chamber.get('uri')
                }
            
            # Store bill debate relation
            self.db.collection('bill_debates').document(debate_id).set(processed_debate)
            
        except Exception as e:
            logger.error(f"Error processing bill debate: {e}")
    
    def process_bill_sponsor(self, sponsor_data, bill_id):
        """Process bill sponsor information"""
        try:
            # Generate sponsor relation ID
            sponsor_id = f"{bill_id}_sponsor_{hash(str(sponsor_data)) % 1000000}"
            
            processed_sponsor = {
                'bill_id': bill_id,
                'is_primary': sponsor_data.get('isPrimary', False),
                'ingested_at': datetime.now().isoformat()
            }
            
            # Process 'by' (member) information
            by_info = sponsor_data.get('by', {})
            if by_info:
                processed_sponsor['member'] = {
                    'show_as': by_info.get('showAs'),
                    'uri': by_info.get('uri')
                }
            
            # Process 'as' (role) information
            as_info = sponsor_data.get('as', {})
            if as_info:
                processed_sponsor['role'] = {
                    'show_as': as_info.get('showAs'),
                    'uri': as_info.get('uri')
                }
            
            # Store sponsor relation
            self.db.collection('bill_sponsors').document(sponsor_id).set(processed_sponsor)
            
        except Exception as e:
            logger.error(f"Error processing bill sponsor: {e}")
    
    def process_amendment_list(self, amendment_data, bill_id):
        """Process amendment list information"""
        try:
            # Generate amendment ID
            amendment_id = f"{bill_id}_amendment_{hash(str(amendment_data)) % 1000000}"
            
            processed_amendment = {
                'bill_id': bill_id,
                'date': amendment_data.get('date'),
                'show_as': amendment_data.get('showAs'),
                'stage_no': amendment_data.get('stageNo'),
                'ingested_at': datetime.now().isoformat()
            }
            
            # Process chamber information
            chamber = amendment_data.get('chamber', {})
            if chamber:
                processed_amendment['chamber'] = {
                    'show_as': chamber.get('showAs'),
                    'uri': chamber.get('uri')
                }
            
            # Process stage information
            stage = amendment_data.get('stage', {})
            if stage:
                processed_amendment['stage'] = {
                    'show_as': stage.get('showAs'),
                    'uri': stage.get('uri')
                }
            
            # Process formats
            formats = amendment_data.get('formats', {})
            if formats:
                processed_amendment['formats'] = formats
            
            # Process amendment type
            amendment_type_uri = amendment_data.get('amendmentTypeUri', {})
            if amendment_type_uri:
                processed_amendment['amendment_type_uri'] = amendment_type_uri.get('uri')
            
            # Store amendment list
            self.db.collection('bill_amendments').document(amendment_id).set(processed_amendment)
            
        except Exception as e:
            logger.error(f"Error processing amendment list: {e}")
    
    def clean_html_content(self, html_content):
        """Clean HTML content for storage"""
        if not html_content:
            return ""
        
        # Remove HTML tags but preserve content
        import re
        clean_text = re.sub(r'<[^>]+>', '', html_content)
        # Clean up whitespace
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        return clean_text
    
    def store_ingestion_metadata(self, data_type, counts, duration, limit):
        """Store ingestion metadata"""
        try:
            metadata = {
                'data_type': data_type,
                'ingestion_time': datetime.now(),
                'duration_seconds': duration,
                'counts': counts,
                'parameters': {
                    'limit': limit
                }
            }
            
            self.db.collection('ingestion_metadata').add(metadata)
            logger.info(f"Stored ingestion metadata: {counts}")
            
        except Exception as e:
            logger.error(f"Error storing metadata: {e}")
    
    def ingest_by_status(self, status, limit=20):
        """Ingest legislation by specific status"""
        logger.info(f"Ingesting legislation with status: {status}")
        self.ingest_legislation(limit=limit, bill_status=status)
    
    def ingest_recent_legislation(self, days_back=30, limit=30):
        """Ingest recent legislation based on last updated date"""
        logger.info(f"Ingesting recent legislation from last {days_back} days")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        params = {
            'last_updated': start_date.strftime('%Y-%m-%d'),
            'limit': limit
        }
        
        try:
            response = requests.get(f"{self.base_url}/legislation", params=params)
            response.raise_for_status()
            data = response.json()
            
            bills = data.get('results', [])
            logger.info(f"Found {len(bills)} recently updated bills")
            
            # Process bills using existing logic
            for i, bill_wrapper in enumerate(bills):
                logger.info(f"Processing recent bill {i+1}/{len(bills)}")
                bill_data = bill_wrapper.get('bill', {})
                if bill_data:
                    self.process_bill(bill_data)
            
        except Exception as e:
            logger.error(f"Error ingesting recent legislation: {e}")

def main():
    """Main execution function"""
    ingester = OireachtasLegislationIngester()
    
    # Ingest different types of legislation
    logger.info("Starting comprehensive legislation ingestion...")
    
    # 1. Recent enacted legislation
    logger.info("\n=== Ingesting Enacted Legislation ===")
    ingester.ingest_by_status("Enacted", limit=10)
    
    # 2. Current bills
    logger.info("\n=== Ingesting Current Bills ===")
    ingester.ingest_by_status("Current", limit=10)
    
    # 3. Recent updates
    logger.info("\n=== Ingesting Recently Updated Legislation ===")
    ingester.ingest_recent_legislation(days_back=30, limit=15)
    
    logger.info("Legislation ingestion completed!")

if __name__ == "__main__":
    main()
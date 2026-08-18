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
        
    def paginated_fetch(self, endpoint, params=None, max_records=10000):
        """Fetch all pages from a paginated endpoint with API limits"""
        if params is None:
            params = {}
        
        all_results = []
        params['limit'] = 50  # API max limit
        skip = 0
        
        while skip < max_records:
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
                
                # Log progress for large datasets
                if skip % 500 == 0:
                    logger.info(f"Fetched {len(all_results)} records from {endpoint}...")
                
            except requests.RequestException as e:
                logger.error(f"Error fetching {endpoint} at skip={skip}: {e}")
                # If we hit an error but have some data, return what we have
                if all_results:
                    logger.warning(f"Returning {len(all_results)} records despite error")
                    break
                else:
                    break
        
        if len(all_results) >= max_records:
            logger.warning(f"Hit max_records limit ({max_records}) for {endpoint}")
                
        return all_results
    
    def fetch_members(self):
        """Fetch all members with their details"""
        logger.info("Fetching members...")
        
        # Fetch all members (no filter parameters)
        all_members = self.paginated_fetch("members", {
            "date_start": "1900-01-01"
        })
        
        logger.info(f"Retrieved {len(all_members)} total members from API")
        
        # Process and clean member data
        for member in all_members:
            if 'member' in member:
                member_data = member['member']
                
                # Extract member code for indexing
                member['memberCode'] = member_data.get('memberCode', '')
                member['fullName'] = member_data.get('fullName', '')
                member['showAs'] = member_data.get('showAs', '')
                member['uri'] = member_data.get('uri', '')
                
                # Generate photo URL from member code
                if member['memberCode']:
                    member['photoUrl'] = f"https://data.oireachtas.ie/ie/oireachtas/member/id/{member['memberCode']}/image/thumb"
                
                # Process memberships for current party/house/constituency
                # Memberships might be a string representation or actual list
                member['isActive'] = False  # Default to inactive
                member['currentParty'] = None
                member['currentHouse'] = None
                member['currentConstituency'] = None
                
                # For now, mark all recent members as potentially active
                # A more sophisticated approach would parse membership dates
                if member_data.get('memberships'):
                    # Just mark as active if they have any memberships
                    # Full membership parsing can be added later
                    member['isActive'] = True
        
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
    
    def fetch_bills(self):
        """Fetch legislation bills from 2020 onwards (limited by API)"""
        logger.info("Fetching bills from 2020...")
        # API limit is around 10000, fetch from 2020 onwards
        bills = self.paginated_fetch("legislation", {
            "date_start": "2020-01-01"
        }, max_records=10000)
        
        # Process bill data
        for bill in bills:
            if 'bill' in bill:
                bill_data = bill['bill']
                bill['billNo'] = bill_data.get('billNo', '')
                bill['billYear'] = bill_data.get('billYear', '')
                bill['longTitleEn'] = bill_data.get('longTitleEn', '')
                bill['status'] = bill_data.get('status', '')
                bill['uri'] = bill_data.get('uri', '')
                
                # Create composite ID from billNo and billYear
                if bill['billNo'] and bill['billYear']:
                    bill['billId'] = f"{bill['billYear']}-{bill['billNo']}"
                else:
                    # Fallback ID if billNo/billYear not available
                    bill['billId'] = bill_data.get('uri', '').split('/')[-1]
        
        logger.info(f"Fetched {len(bills)} bills")
        return bills
    
    def fetch_votes(self):
        """Fetch votes/divisions from 2020 onwards (limited by API)"""
        logger.info("Fetching votes from 2020...")
        # API limit is around 10000, fetch from 2020 onwards
        votes = self.paginated_fetch("divisions", {
            "date_start": "2020-01-01"
        }, max_records=10000)
        
        # Process vote data
        for vote in votes:
            if 'division' in vote:
                division_data = vote['division']
                vote['divisionId'] = division_data.get('divisionId', '')
                vote['subject'] = division_data.get('subject', '')
                vote['date'] = division_data.get('date', '')
                vote['outcome'] = division_data.get('outcome', '')
                vote['uri'] = division_data.get('uri', '')
                
                # Ensure we have an ID
                if not vote['divisionId'] and vote['uri']:
                    vote['divisionId'] = vote['uri'].split('/')[-1]
        
        logger.info(f"Fetched {len(votes)} votes")
        return votes
    
    def fetch_questions(self):
        """Fetch parliamentary questions from 2020 onwards (limited by API)"""
        logger.info("Fetching questions from 2020...")
        # API limit is around 10000, fetch from 2020 onwards
        questions = self.paginated_fetch("questions", {
            "date_start": "2020-01-01"
        }, max_records=10000)
        
        # Process question data
        for question in questions:
            if 'question' in question:
                question_data = question['question']
                question['questionId'] = question_data.get('questionId', '')
                question['questionType'] = question_data.get('questionType', '')
                question['date'] = question_data.get('date', '')
                question['uri'] = question_data.get('uri', '')
                question['by'] = question_data.get('by', {})
                question['to'] = question_data.get('to', {})
                
                # Ensure we have an ID
                if not question['questionId'] and question['uri']:
                    question['questionId'] = question['uri'].split('/')[-1]
        
        logger.info(f"Fetched {len(questions)} questions")
        return questions
    
    def fetch_debates(self):
        """Fetch debates from 2020 onwards (limited by API)"""
        logger.info("Fetching debates from 2020...")
        # API limit is around 10000, fetch from 2020 onwards
        debates = self.paginated_fetch("debates", {
            "date_start": "2020-01-01"
        }, max_records=10000)
        
        # Process debate data
        for debate in debates:
            if 'debate' in debate:
                debate_data = debate['debate']
                debate['debateId'] = debate_data.get('debateId', '')
                debate['debateSectionId'] = debate_data.get('debateSectionId', '')
                debate['date'] = debate_data.get('date', '')
                debate['showAs'] = debate_data.get('showAs', '')
                debate['uri'] = debate_data.get('uri', '')
                
                # Ensure we have an ID
                if not debate['debateId']:
                    if debate['debateSectionId']:
                        debate['debateId'] = debate['debateSectionId']
                    elif debate['uri']:
                        debate['debateId'] = debate['uri'].split('/')[-1]
        
        logger.info(f"Fetched {len(debates)} debates")
        return debates
    
    def clear_collection(self, collection_name):
        """Delete all documents in a collection"""
        logger.info(f"Clearing existing data from {collection_name}")
        
        # Get all documents in the collection
        docs = self.firestore_client.collection(collection_name).list_documents()
        
        batch = self.firestore_client.batch()
        batch_count = 0
        
        for doc in docs:
            batch.delete(doc)
            batch_count += 1
            
            # Commit batch every 500 operations (Firestore limit)
            if batch_count >= 500:
                batch.commit()
                batch = self.firestore_client.batch()
                batch_count = 0
        
        # Commit remaining operations
        if batch_count > 0:
            batch.commit()
            
        logger.info(f"Cleared {batch_count} documents from {collection_name}")
    
    def store_data(self, collection_name, data, doc_id_field, clear_first=False):
        """Store data in Firestore, optionally clearing existing data first"""
        if clear_first:
            self.clear_collection(collection_name)
            
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
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                futures = {
                    executor.submit(self.fetch_members): 'members',
                    executor.submit(self.fetch_parties): 'parties', 
                    executor.submit(self.fetch_houses): 'houses',
                    executor.submit(self.fetch_constituencies): 'constituencies',
                    executor.submit(self.fetch_bills): 'bills',
                    executor.submit(self.fetch_votes): 'votes',
                    executor.submit(self.fetch_questions): 'questions',
                    executor.submit(self.fetch_debates): 'debates'
                }
                
                results = {}
                for future in concurrent.futures.as_completed(futures):
                    data_type = futures[future]
                    try:
                        results[data_type] = future.result()
                    except Exception as e:
                        logger.error(f"Error fetching {data_type}: {e}")
                        results[data_type] = []
            
            # Store all data (clear bills, votes, questions, debates first to remove old data)
            storage_tasks = [
                (results['members'], 'members', 'memberCode', False),
                (results['parties'], 'parties', 'partyCode', False),
                (results['houses'], 'houses', 'houseCode', False),
                (results['constituencies'], 'constituencies', 'constituencyCode', False),
                (results['bills'], 'bills', 'billId', True),  # Clear old bills data
                (results['votes'], 'votes', 'divisionId', True),  # Clear old votes data
                (results['questions'], 'questions', 'questionId', True),  # Clear old questions data
                (results['debates'], 'debates', 'debateId', True)  # Clear old debates data
            ]
            
            for data, collection, id_field, clear_first in storage_tasks:
                if data:
                    self.store_data(collection, data, id_field, clear_first)
            
            # Store ingestion metadata
            duration_seconds = time.time() - start_time
            last_ingestion_time = datetime.now(timezone.utc)
            
            metadata = {
                'last_ingestion': last_ingestion_time,
                'duration_seconds': duration_seconds,
                'counts': {
                    'members': len(results['members']),
                    'parties': len(results['parties']),
                    'houses': len(results['houses']),
                    'constituencies': len(results['constituencies']),
                    'bills': len(results['bills']),
                    'votes': len(results['votes']),
                    'questions': len(results['questions']),
                    'debates': len(results['debates'])
                }
            }
            
            self.firestore_client.collection('metadata').document('last_ingestion').set(metadata)
            
            logger.info(f"Ingestion completed in {duration_seconds:.2f} seconds")
            
            # Return JSON-serializable metadata
            return {
                'last_ingestion': last_ingestion_time.isoformat(),
                'duration_seconds': duration_seconds,
                'counts': metadata['counts']
            }
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            raise

    def run_incremental_update(self, days_back=7):
        """Run incremental update for recent data only (cost-effective)"""
        from datetime import timedelta
        
        logger.info(f"Starting incremental update for last {days_back} days...")
        start_time = time.time()
        
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
        date_filter = start_date.strftime('%Y-%m-%d')
        
        logger.info(f"Fetching data since {date_filter}")
        
        try:
            # Fetch only recent data (no need for members/parties/houses/constituencies)
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                futures = {
                    executor.submit(lambda: self.paginated_fetch("legislation", {"date_start": date_filter}, max_records=5000)): 'bills',
                    executor.submit(lambda: self.paginated_fetch("divisions", {"date_start": date_filter}, max_records=5000)): 'votes',
                    executor.submit(lambda: self.paginated_fetch("questions", {"date_start": date_filter}, max_records=5000)): 'questions',
                    executor.submit(lambda: self.paginated_fetch("debates", {"date_start": date_filter}, max_records=5000)): 'debates'
                }
                
                results = {}
                for future in concurrent.futures.as_completed(futures):
                    data_type = futures[future]
                    try:
                        results[data_type] = future.result()
                    except Exception as e:
                        logger.error(f"Error fetching {data_type}: {e}")
                        results[data_type] = []
            
            # Process and store updates (without clearing existing data)
            # Bills
            bills = results['bills']
            for bill in bills:
                if 'bill' in bill:
                    bill_data = bill['bill']
                    bill['billNo'] = bill_data.get('billNo', '')
                    bill['billYear'] = bill_data.get('billYear', '')
                    bill['longTitleEn'] = bill_data.get('longTitleEn', '')
                    bill['status'] = bill_data.get('status', '')
                    bill['uri'] = bill_data.get('uri', '')
                    if bill['billNo'] and bill['billYear']:
                        bill['billId'] = f"{bill['billYear']}-{bill['billNo']}"
            
            # Votes
            votes = results['votes']
            for vote in votes:
                if 'division' in vote:
                    division_data = vote['division']
                    vote['divisionId'] = division_data.get('divisionId', '')
                    vote['subject'] = division_data.get('subject', '')
                    vote['date'] = division_data.get('date', '')
                    vote['outcome'] = division_data.get('outcome', '')
                    vote['uri'] = division_data.get('uri', '')
            
            # Questions
            questions = results['questions']
            for question in questions:
                if 'question' in question:
                    question_data = question['question']
                    question['questionId'] = question_data.get('questionId', '')
                    question['questionType'] = question_data.get('questionType', '')
                    question['date'] = question_data.get('date', '')
                    question['uri'] = question_data.get('uri', '')
            
            # Debates
            debates = results['debates']
            for debate in debates:
                if 'debate' in debate:
                    debate_data = debate['debate']
                    debate['debateId'] = debate_data.get('debateId', '')
                    debate['date'] = debate_data.get('date', '')
                    debate['uri'] = debate_data.get('uri', '')
                    if not debate['debateId'] and debate['uri']:
                        debate['debateId'] = debate['uri'].split('/')[-1]
            
            # Store updates (merge with existing data)
            storage_tasks = [
                (bills, 'bills', 'billId', False),
                (votes, 'votes', 'divisionId', False),
                (questions, 'questions', 'questionId', False),
                (debates, 'debates', 'debateId', False)
            ]
            
            for data, collection, id_field, _ in storage_tasks:
                if data:
                    self.store_data(collection, data, id_field, clear_first=False)
            
            duration_seconds = time.time() - start_time
            
            logger.info(f"Incremental update completed in {duration_seconds:.2f} seconds")
            logger.info(f"Updated: {len(bills)} bills, {len(votes)} votes, {len(questions)} questions, {len(debates)} debates")
            
            return {
                'update_type': 'incremental',
                'days_back': days_back,
                'duration_seconds': duration_seconds,
                'counts': {
                    'bills': len(bills),
                    'votes': len(votes),
                    'questions': len(questions),
                    'debates': len(debates)
                }
            }
            
        except Exception as e:
            logger.error(f"Incremental update failed: {e}")
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
        
        # Check if incremental update is requested
        request_json = request.get_json(silent=True)
        update_type = request_json.get('type', 'full') if request_json else 'full'
        days_back = request_json.get('days_back', 7) if request_json else 7
        
        if update_type == 'incremental':
            result = ingester.run_incremental_update(days_back)
            message = f'Incremental update completed for last {days_back} days'
        else:
            result = ingester.run_ingestion()
            message = 'Full data ingestion completed successfully'
        
        return (json.dumps({
            'success': True,
            'message': message,
            'metadata': result
        }), 200, headers)
        
    except Exception as e:
        logger.error(f"Function execution failed: {e}")
        return (json.dumps({
            'success': False,
            'error': str(e)
        }), 500, headers)
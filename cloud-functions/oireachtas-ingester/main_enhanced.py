"""
Enhanced Oireachtas Data Ingestion Cloud Function
Includes votes and questions data ingestion with proper relationships
"""

import functions_framework
import requests
import json
from google.cloud import firestore
import concurrent.futures
from datetime import datetime, timezone, timedelta
import logging
import time
import re
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedOireachtasIngester:
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
                    logger.warning(f"Unexpected response structure for {endpoint}")
                    break
                
                if not results:
                    break
                    
                all_results.extend(results)
                skip += len(results)
                
                # Break if we got fewer results than requested (last page)
                if len(results) < params['limit']:
                    break
                    
                # Rate limiting
                time.sleep(0.1)
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching from {endpoint}: {e}")
                break
        
        return all_results

    def fetch_members(self):
        """Fetch all members"""
        logger.info("Fetching members...")
        members = self.paginated_fetch("members")
        
        # Process and clean member data
        for member in members:
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
                if 'memberships' in member_data:
                    current_membership = None
                    for membership in member_data['memberships']:
                        if membership.get('membership', {}).get('dateRange', {}).get('end') is None:
                            current_membership = membership['membership']
                            break
                    
                    if current_membership:
                        member['currentParty'] = current_membership.get('represents', {}).get('party', {}).get('showAs', '')
                        member['currentHouse'] = current_membership.get('house', {}).get('showAs', '')
                        member['currentConstituency'] = current_membership.get('represents', {}).get('represent', {}).get('showAs', '')
                        member['isActive'] = True
                    else:
                        member['isActive'] = False
        
        logger.info(f"Fetched {len(members)} members")
        return members

    def fetch_parties(self):
        """Fetch all parties"""
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

    def fetch_votes(self, date_start: Optional[str] = None, date_end: Optional[str] = None):
        """Fetch votes/divisions with proper relationships"""
        logger.info("Fetching votes...")
        
        # Default to last 30 days if no dates provided
        if not date_start:
            date_start = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not date_end:
            date_end = datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'date_start': date_start,
            'date_end': date_end
        }
        
        votes = self.paginated_fetch("votes", params)
        
        # Process votes to extract relationships and normalize data
        processed_votes = []
        for vote_record in votes:
            if 'division' in vote_record:
                division = vote_record['division']
                
                # Create main vote record
                vote_doc = {
                    'voteId': division.get('voteId', ''),
                    'uri': division.get('uri', ''),
                    'datetime': division.get('datetime', ''),
                    'date': vote_record.get('contextDate', ''),
                    'category': division.get('category', ''),
                    'outcome': division.get('outcome', ''),
                    'isBill': division.get('isBill', False),
                    'tellers': division.get('tellers', ''),
                    'voteNote': division.get('voteNote', ''),
                    
                    # House information
                    'house': {
                        'houseCode': division.get('house', {}).get('houseCode', ''),
                        'houseNo': division.get('house', {}).get('houseNo', ''),
                        'showAs': division.get('house', {}).get('showAs', ''),
                        'uri': division.get('house', {}).get('uri', ''),
                        'chamberType': division.get('house', {}).get('chamberType', '')
                    },
                    
                    # Chamber reference (for easier filtering)
                    'chamber': {
                        'showAs': division.get('chamber', {}).get('showAs', ''),
                        'uri': division.get('chamber', {}).get('uri', '')
                    },
                    
                    # Subject/topic
                    'subject': {
                        'showAs': division.get('subject', {}).get('showAs', ''),
                        'uri': division.get('subject', {}).get('uri', '')
                    },
                    
                    # Debate reference
                    'debate': division.get('debate', {}),
                    
                    # Vote tallies summary
                    'tallies': {
                        'taVotes': {
                            'tally': division.get('tallies', {}).get('taVotes', {}).get('tally', 0),
                            'showAs': division.get('tallies', {}).get('taVotes', {}).get('showAs', 'Tá')
                        },
                        'nilVotes': {
                            'tally': division.get('tallies', {}).get('nilVotes', {}).get('tally', 0),
                            'showAs': division.get('tallies', {}).get('nilVotes', {}).get('showAs', 'Níl')
                        },
                        'staonVotes': {
                            'tally': division.get('tallies', {}).get('staonVotes', {}).get('tally', 0),
                            'showAs': division.get('tallies', {}).get('staonVotes', {}).get('showAs', 'Staon')
                        }
                    }
                }
                
                # Process individual member votes
                member_votes = []
                tallies = division.get('tallies', {})
                
                for vote_type in ['taVotes', 'nilVotes', 'staonVotes']:
                    if vote_type in tallies and 'members' in tallies[vote_type]:
                        for member_vote in tallies[vote_type]['members']:
                            member_data = member_vote.get('member', {})
                            member_votes.append({
                                'memberCode': member_data.get('memberCode', ''),
                                'showAs': member_data.get('showAs', ''),
                                'uri': member_data.get('uri', ''),
                                'voteType': vote_type,
                                'voteTypeDisplay': tallies[vote_type].get('showAs', vote_type)
                            })
                
                vote_doc['memberVotes'] = member_votes
                vote_doc['memberVoteCount'] = len(member_votes)
                
                processed_votes.append(vote_doc)
        
        logger.info(f"Fetched and processed {len(processed_votes)} votes")
        return processed_votes

    def fetch_questions(self, date_start: Optional[str] = None, date_end: Optional[str] = None):
        """Fetch questions with proper relationships"""
        logger.info("Fetching questions...")
        
        # Default to last 30 days if no dates provided
        if not date_start:
            date_start = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not date_end:
            date_end = datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'date_start': date_start,
            'date_end': date_end
        }
        
        questions = self.paginated_fetch("questions", params)
        
        # Process questions to extract relationships and normalize data
        processed_questions = []
        for question_record in questions:
            if 'question' in question_record:
                question = question_record['question']
                
                # Create main question record
                question_doc = {
                    'questionNumber': question.get('questionNumber', 0),
                    'uri': question.get('uri', ''),
                    'date': question.get('date', ''),
                    'contextDate': question_record.get('contextDate', ''),
                    'showAs': question.get('showAs', ''),
                    'questionType': question.get('questionType', ''),
                    
                    # Asked by (member)
                    'by': {
                        'memberCode': question.get('by', {}).get('memberCode', ''),
                        'showAs': question.get('by', {}).get('showAs', ''),
                        'uri': question.get('by', {}).get('uri', '')
                    },
                    
                    # Asked to (role/minister)
                    'to': {
                        'showAs': question.get('to', {}).get('showAs', ''),
                        'roleType': question.get('to', {}).get('roleType', ''),
                        'roleCode': question.get('to', {}).get('roleCode', ''),
                        'uri': question.get('to', {}).get('uri', '')
                    },
                    
                    # House information
                    'house': {
                        'houseCode': question.get('house', {}).get('houseCode', ''),
                        'houseNo': question.get('house', {}).get('houseNo', ''),
                        'showAs': question.get('house', {}).get('showAs', ''),
                        'uri': question.get('house', {}).get('uri', ''),
                        'chamberType': question.get('house', {}).get('chamberType', ''),
                        'committeeCode': question.get('house', {}).get('committeeCode', '')
                    },
                    
                    # Debate section reference
                    'debateSection': question.get('debateSection', {})
                }
                
                processed_questions.append(question_doc)
        
        logger.info(f"Fetched and processed {len(processed_questions)} questions")
        return processed_questions

    def store_data(self, collection_name: str, data: List[Dict[Any, Any]], doc_id_field: str):
        """Store data in Firestore with proper error handling"""
        logger.info(f"Storing {len(data)} documents in {collection_name}")
        
        if not data:
            logger.warning(f"No data to store in {collection_name}")
            return
        
        batch = self.firestore_client.batch()
        batch_count = 0
        stored_count = 0
        
        for item in data:
            try:
                if doc_id_field in item and item[doc_id_field]:
                    doc_id = str(item[doc_id_field])
                    # Clean doc_id to ensure it's valid for Firestore
                    doc_id = re.sub(r'[/\\#\[\]\.~]', '_', doc_id)
                    
                    doc_ref = self.firestore_client.collection(collection_name).document(doc_id)
                    
                    # Add metadata
                    item['updated_at'] = datetime.now(timezone.utc)
                    item['ingested_at'] = datetime.now(timezone.utc)
                    
                    batch.set(doc_ref, item)
                    batch_count += 1
                    stored_count += 1
                    
                    # Commit batch every 500 operations (Firestore limit)
                    if batch_count >= 500:
                        batch.commit()
                        batch = self.firestore_client.batch()
                        batch_count = 0
                else:
                    logger.warning(f"Missing {doc_id_field} in item: {item}")
                    
            except Exception as e:
                logger.error(f"Error processing item in {collection_name}: {e}")
                continue
        
        # Commit remaining operations
        if batch_count > 0:
            batch.commit()
            
        logger.info(f"Successfully stored {stored_count} documents in {collection_name}")

    def run_enhanced_ingestion(self, include_votes: bool = True, include_questions: bool = True):
        """Run the complete enhanced data ingestion process"""
        logger.info("Starting enhanced Oireachtas data ingestion...")
        start_time = time.time()
        
        try:
            # Fetch core data (existing)
            with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
                futures = {
                    executor.submit(self.fetch_members): 'members',
                    executor.submit(self.fetch_parties): 'parties', 
                    executor.submit(self.fetch_houses): 'houses',
                    executor.submit(self.fetch_constituencies): 'constituencies'
                }
                
                # Add votes and questions if requested
                if include_votes:
                    futures[executor.submit(self.fetch_votes)] = 'votes'
                if include_questions:
                    futures[executor.submit(self.fetch_questions)] = 'questions'
                
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
            
            if include_votes and 'votes' in results:
                storage_tasks.append((results['votes'], 'votes', 'voteId'))
            if include_questions and 'questions' in results:
                storage_tasks.append((results['questions'], 'questions', 'uri'))
            
            for data, collection, id_field in storage_tasks:
                if data:
                    self.store_data(collection, data, id_field)
            
            # Store ingestion metadata
            metadata = {
                'last_ingestion': datetime.now(timezone.utc),
                'duration_seconds': time.time() - start_time,
                'counts': {
                    'members': len(results.get('members', [])),
                    'parties': len(results.get('parties', [])),
                    'houses': len(results.get('houses', [])),
                    'constituencies': len(results.get('constituencies', [])),
                    'votes': len(results.get('votes', [])) if include_votes else 0,
                    'questions': len(results.get('questions', [])) if include_questions else 0
                },
                'included_data_types': {
                    'core': True,
                    'votes': include_votes,
                    'questions': include_questions
                }
            }
            
            self.firestore_client.collection('metadata').document('last_ingestion').set(metadata)
            
            logger.info(f"Enhanced ingestion completed in {metadata['duration_seconds']:.2f} seconds")
            return metadata
            
        except Exception as e:
            logger.error(f"Enhanced ingestion failed: {e}")
            raise

@functions_framework.http
def ingest_oireachtas_enhanced(request):
    """HTTP Cloud Function entry point for enhanced ingestion"""
    
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
        # Parse request parameters
        request_json = request.get_json(silent=True) or {}
        include_votes = request_json.get('include_votes', True)
        include_questions = request_json.get('include_questions', True)
        
        ingester = EnhancedOireachtasIngester()
        result = ingester.run_enhanced_ingestion(include_votes, include_questions)
        
        return (json.dumps({
            'success': True,
            'message': 'Enhanced data ingestion completed successfully',
            'metadata': result
        }), 200, headers)
        
    except Exception as e:
        logger.error(f"Enhanced function execution failed: {e}")
        return (json.dumps({
            'success': False,
            'error': str(e)
        }), 500, headers)
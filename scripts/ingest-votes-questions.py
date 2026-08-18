"""
Practical Oireachtas Votes and Questions Data Ingestion Script
Ingests votes and questions data into Firebase with proper relationships
"""

import requests
import json
from datetime import datetime, timedelta, timezone
import time
import logging
import re
from typing import List, Dict, Any, Optional

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OireachtasVotesQuestionsIngester:
    def __init__(self):
        # Initialize Firebase Admin (using the same method as working scripts)
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app({ 
                    'credential': firebase_admin.credentials.ApplicationDefault(),
                    'projectId': 'replace-with-your-project-id'
                })
            
            self.db = firestore.client()
            logger.info("Firebase initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            logger.info("Trying alternative initialization...")
            try:
                # Alternative initialization
                firebase_admin.initialize_app()
                self.db = firestore.client()
                logger.info("Firebase initialized with default credentials")
            except Exception as e2:
                logger.error(f"Alternative initialization also failed: {e2}")
                raise
        
        self.base_url = "https://api.oireachtas.ie/v1"
        
        # Validation data - load existing members and houses for relationship validation
        self.existing_members = set()
        self.existing_houses = set()
        self._load_validation_data()
        
    def _load_validation_data(self):
        """Load existing members and houses for relationship validation"""
        logger.info("Loading validation data...")
        
        # Load members
        try:
            members_ref = self.db.collection('members')
            members_docs = members_ref.get()
            self.existing_members = {doc.id for doc in members_docs}
            logger.info(f"Loaded {len(self.existing_members)} existing members for validation")
        except Exception as e:
            logger.warning(f"Could not load members for validation: {e}")
        
        # Load houses
        try:
            houses_ref = self.db.collection('houses')
            houses_docs = houses_ref.get()
            self.existing_houses = {doc.get('houseCode') for doc in houses_docs if doc.get('houseCode')}
            logger.info(f"Loaded {len(self.existing_houses)} existing houses for validation")
        except Exception as e:
            logger.warning(f"Could not load houses for validation: {e}")

    def paginated_fetch(self, endpoint: str, params: Optional[Dict] = None, max_pages: int = 10):
        """Fetch data from paginated API endpoint"""
        if params is None:
            params = {}
        
        all_results = []
        params['limit'] = 50  # API max limit
        skip = 0
        pages_fetched = 0
        
        while pages_fetched < max_pages:
            params['skip'] = skip
            try:
                response = requests.get(f"{self.base_url}/{endpoint}", params=params)
                response.raise_for_status()
                data = response.json()
                
                results = data.get('results', [])
                if not results:
                    break
                    
                all_results.extend(results)
                skip += len(results)
                pages_fetched += 1
                
                logger.info(f"Fetched page {pages_fetched} from {endpoint}: {len(results)} results")
                
                # Break if we got fewer results than requested (last page)
                if len(results) < params['limit']:
                    break
                    
                # Rate limiting
                time.sleep(0.2)
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching from {endpoint}: {e}")
                break
        
        logger.info(f"Total results fetched from {endpoint}: {len(all_results)}")
        return all_results

    def fetch_and_process_votes(self, days_back: int = 30):
        """Fetch and process votes data"""
        logger.info(f"Fetching votes from last {days_back} days...")
        
        date_start = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        date_end = datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'date_start': date_start,
            'date_end': date_end
        }
        
        votes_data = self.paginated_fetch("votes", params, max_pages=5)
        
        processed_votes = []
        for vote_record in votes_data:
            try:
                if 'division' not in vote_record:
                    logger.warning(f"Skipping vote record without division: {vote_record}")
                    continue
                    
                division = vote_record['division']
                if division is None:
                    logger.warning(f"Skipping vote record with null division: {vote_record}")
                    continue
                    
                vote_id = division.get('voteId', '')
                
                if not vote_id:
                    logger.warning("Skipping vote with no voteId")
                    continue
            
                # Process member votes and validate relationships
                member_votes = []
                tallies = division.get('tallies', {})
                invalid_members = []
                
                for vote_type in ['taVotes', 'nilVotes', 'staonVotes']:
                    if vote_type in tallies and tallies[vote_type]:
                        vote_type_display = tallies[vote_type].get('showAs', vote_type)
                        for member_vote in tallies[vote_type].get('members', []):
                            member_data = member_vote.get('member', {})
                            member_code = member_data.get('memberCode', '')
                            
                            if member_code:
                                # Validate member exists
                                if member_code not in self.existing_members:
                                    invalid_members.append(member_code)
                                
                                member_votes.append({
                                    'memberCode': member_code,
                                    'showAs': member_data.get('showAs', ''),
                                    'uri': member_data.get('uri', ''),
                                    'voteType': vote_type,
                                    'voteTypeDisplay': vote_type_display
                                })
                
                if invalid_members:
                    logger.warning(f"Vote {vote_id} contains {len(invalid_members)} invalid member references")
                
                # Validate house reference
                house_data = division.get('house', {})
                house_code = house_data.get('houseCode', '')
                if house_code and house_code not in self.existing_houses:
                    logger.warning(f"Vote {vote_id} references invalid house: {house_code}")
                
                # Create vote document
                vote_doc = {
                    'voteId': vote_id,
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
                        'houseCode': house_code,
                        'houseNo': house_data.get('houseNo', ''),
                        'showAs': house_data.get('showAs', ''),
                        'uri': house_data.get('uri', ''),
                        'chamberType': house_data.get('chamberType', '')
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
                            'tally': tallies.get('taVotes', {}).get('tally', 0),
                            'showAs': tallies.get('taVotes', {}).get('showAs', 'Tá')
                        },
                        'nilVotes': {
                            'tally': tallies.get('nilVotes', {}).get('tally', 0),
                            'showAs': tallies.get('nilVotes', {}).get('showAs', 'Níl')
                        },
                        'staonVotes': {
                            'tally': tallies.get('staonVotes', {}).get('tally', 0),
                            'showAs': tallies.get('staonVotes', {}).get('showAs', 'Staon')
                        }
                    },
                    
                    # Member votes array
                    'memberVotes': member_votes,
                    'memberVoteCount': len(member_votes),
                    'validationWarnings': {
                        'invalidMembers': invalid_members,
                        'invalidHouse': house_code not in self.existing_houses if house_code else False
                    }
                }
                
                processed_votes.append(vote_doc)
                
            except Exception as e:
                logger.error(f"Error processing vote record: {e}")
                logger.error(f"Problematic vote record: {vote_record}")
                continue
        
        return processed_votes

    def fetch_and_process_questions(self, days_back: int = 7):
        """Fetch and process questions data"""
        logger.info(f"Fetching questions from last {days_back} days...")
        
        date_start = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        date_end = datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'date_start': date_start,
            'date_end': date_end
        }
        
        questions_data = self.paginated_fetch("questions", params, max_pages=10)
        
        processed_questions = []
        for question_record in questions_data:
            if 'question' not in question_record:
                continue
                
            question = question_record['question']
            question_uri = question.get('uri', '')
            
            if not question_uri:
                logger.warning("Skipping question with no URI")
                continue
            
            # Validate member relationship
            member_data = question.get('by', {})
            member_code = member_data.get('memberCode', '')
            invalid_member = False
            if member_code and member_code not in self.existing_members:
                invalid_member = True
                logger.warning(f"Question {question_uri} references invalid member: {member_code}")
            
            # Validate house reference
            house_data = question.get('house', {})
            house_code = house_data.get('houseCode', '')
            invalid_house = False
            if house_code and house_code not in self.existing_houses:
                invalid_house = True
                logger.warning(f"Question {question_uri} references invalid house: {house_code}")
            
            # Create question document
            question_doc = {
                'questionNumber': question.get('questionNumber', 0),
                'uri': question_uri,
                'date': question.get('date', ''),
                'contextDate': question_record.get('contextDate', ''),
                'showAs': question.get('showAs', ''),
                'questionType': question.get('questionType', ''),
                
                # Asked by (member)
                'by': {
                    'memberCode': member_code,
                    'showAs': member_data.get('showAs', ''),
                    'uri': member_data.get('uri', '')
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
                    'houseCode': house_code,
                    'houseNo': house_data.get('houseNo', ''),
                    'showAs': house_data.get('showAs', ''),
                    'uri': house_data.get('uri', ''),
                    'chamberType': house_data.get('chamberType', ''),
                    'committeeCode': house_data.get('committeeCode', '')
                },
                
                # Debate section reference
                'debateSection': question.get('debateSection', {}),
                
                'validationWarnings': {
                    'invalidMember': invalid_member,
                    'invalidHouse': invalid_house
                }
            }
            
            processed_questions.append(question_doc)
        
        return processed_questions

    def store_votes(self, votes_data: List[Dict[Any, Any]]):
        """Store votes data in Firestore"""
        logger.info(f"Storing {len(votes_data)} votes...")
        
        if not votes_data:
            logger.warning("No votes data to store")
            return
        
        batch = self.db.batch()
        batch_count = 0
        stored_count = 0
        
        for vote in votes_data:
            try:
                vote_id = vote.get('voteId', '')
                if not vote_id:
                    continue
                
                # Clean vote_id for Firestore document ID
                doc_id = re.sub(r'[/\\#\[\]\.~]', '_', vote_id)
                doc_ref = self.db.collection('votes').document(doc_id)
                
                # Add metadata
                vote['updated_at'] = datetime.now(timezone.utc)
                vote['ingested_at'] = datetime.now(timezone.utc)
                
                batch.set(doc_ref, vote)
                batch_count += 1
                stored_count += 1
                
                # Commit batch every 400 operations
                if batch_count >= 400:
                    batch.commit()
                    batch = self.db.batch()
                    batch_count = 0
                    logger.info(f"Committed batch, stored {stored_count} votes so far...")
                    
            except Exception as e:
                logger.error(f"Error storing vote {vote.get('voteId', 'unknown')}: {e}")
                continue
        
        # Commit remaining operations
        if batch_count > 0:
            batch.commit()
        
        logger.info(f"Successfully stored {stored_count} votes")

    def store_questions(self, questions_data: List[Dict[Any, Any]]):
        """Store questions data in Firestore"""
        logger.info(f"Storing {len(questions_data)} questions...")
        
        if not questions_data:
            logger.warning("No questions data to store")
            return
        
        batch = self.db.batch()
        batch_count = 0
        stored_count = 0
        
        for question in questions_data:
            try:
                question_uri = question.get('uri', '')
                if not question_uri:
                    continue
                
                # Clean URI for Firestore document ID
                doc_id = re.sub(r'[/\\#\[\]\.~:]', '_', question_uri.split('/')[-1])
                doc_ref = self.db.collection('questions').document(doc_id)
                
                # Add metadata
                question['updated_at'] = datetime.now(timezone.utc)
                question['ingested_at'] = datetime.now(timezone.utc)
                
                batch.set(doc_ref, question)
                batch_count += 1
                stored_count += 1
                
                # Commit batch every 400 operations
                if batch_count >= 400:
                    batch.commit()
                    batch = self.db.batch()
                    batch_count = 0
                    logger.info(f"Committed batch, stored {stored_count} questions so far...")
                    
            except Exception as e:
                logger.error(f"Error storing question {question.get('uri', 'unknown')}: {e}")
                continue
        
        # Commit remaining operations
        if batch_count > 0:
            batch.commit()
        
        logger.info(f"Successfully stored {stored_count} questions")

    def run_ingestion(self, include_votes: bool = True, include_questions: bool = True, 
                     votes_days_back: int = 30, questions_days_back: int = 7):
        """Run the complete votes and questions ingestion"""
        logger.info("Starting votes and questions data ingestion...")
        start_time = time.time()
        
        try:
            results = {}
            
            if include_votes:
                votes_data = self.fetch_and_process_votes(votes_days_back)
                results['votes'] = votes_data
                self.store_votes(votes_data)
            
            if include_questions:
                questions_data = self.fetch_and_process_questions(questions_days_back)
                results['questions'] = questions_data
                self.store_questions(questions_data)
            
            # Store ingestion metadata
            metadata = {
                'last_ingestion': datetime.now(timezone.utc),
                'duration_seconds': time.time() - start_time,
                'data_types_ingested': {
                    'votes': include_votes,
                    'questions': include_questions
                },
                'counts': {
                    'votes': len(results.get('votes', [])),
                    'questions': len(results.get('questions', []))
                },
                'date_ranges': {
                    'votes_days_back': votes_days_back if include_votes else 0,
                    'questions_days_back': questions_days_back if include_questions else 0
                }
            }
            
            self.db.collection('ingestion_metadata').document('votes_questions_last').set(metadata)
            
            logger.info(f"Ingestion completed successfully in {metadata['duration_seconds']:.2f} seconds")
            logger.info(f"Votes ingested: {metadata['counts']['votes']}")
            logger.info(f"Questions ingested: {metadata['counts']['questions']}")
            
            return metadata
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            raise

def main():
    """Main execution function"""
    logger.info("Starting Oireachtas Votes and Questions Ingestion...")
    
    try:
        ingester = OireachtasVotesQuestionsIngester()
        
        # Run ingestion with reasonable date ranges
        # - Votes: last 30 days (usually fewer records)
        # - Questions: last 7 days (can be many records)
        result = ingester.run_ingestion(
            include_votes=True,
            include_questions=True,
            votes_days_back=30,
            questions_days_back=7
        )
        
        logger.info("Ingestion completed successfully!")
        logger.info(f"Summary: {result}")
        
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
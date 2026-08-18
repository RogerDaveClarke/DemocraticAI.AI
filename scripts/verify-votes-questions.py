"""
Verification script for votes and questions data ingestion
Checks the ingested data in Firebase and analyzes relationships
"""

import firebase_admin
from firebase_admin import credentials, firestore
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataVerifier:
    def __init__(self):
        # Initialize Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        self.db = firestore.client()
    
    def verify_votes_data(self):
        """Verify votes collection and analyze structure"""
        logger.info("Verifying votes data...")
        
        try:
            votes_ref = self.db.collection('votes')
            votes_docs = votes_ref.limit(10).get()
            
            logger.info(f"Found {len(votes_docs)} vote documents (showing first 10)")
            
            for doc in votes_docs[:3]:  # Show first 3 in detail
                data = doc.to_dict()
                logger.info(f"\nVote ID: {data.get('voteId')}")
                logger.info(f"- Date: {data.get('date')}")
                logger.info(f"- Outcome: {data.get('outcome')}")
                logger.info(f"- House: {data.get('house', {}).get('showAs')}")
                logger.info(f"- Subject: {data.get('subject', {}).get('showAs', '')[:50]}...")
                logger.info(f"- Member votes: {data.get('memberVoteCount', 0)}")
                
                # Check tallies
                tallies = data.get('tallies', {})
                logger.info(f"- Tá: {tallies.get('taVotes', {}).get('tally', 0)}")
                logger.info(f"- Níl: {tallies.get('nilVotes', {}).get('tally', 0)}")
                logger.info(f"- Staon: {tallies.get('staonVotes', {}).get('tally', 0)}")
                
                # Check validation warnings
                warnings = data.get('validationWarnings', {})
                if warnings.get('invalidMembers'):
                    logger.warning(f"- Invalid members: {len(warnings['invalidMembers'])}")
                if warnings.get('invalidHouse'):
                    logger.warning(f"- Invalid house reference")
            
            # Get total count
            total_votes = len(list(votes_ref.stream()))
            logger.info(f"\nTotal votes in collection: {total_votes}")
            
        except Exception as e:
            logger.error(f"Error verifying votes: {e}")
    
    def verify_questions_data(self):
        """Verify questions collection and analyze structure"""
        logger.info("Verifying questions data...")
        
        try:
            questions_ref = self.db.collection('questions')
            questions_docs = questions_ref.limit(10).get()
            
            logger.info(f"Found {len(questions_docs)} question documents (showing first 10)")
            
            for doc in questions_docs[:3]:  # Show first 3 in detail
                data = doc.to_dict()
                logger.info(f"\nQuestion URI: {data.get('uri', '')}")
                logger.info(f"- Number: {data.get('questionNumber')}")
                logger.info(f"- Date: {data.get('date')}")
                logger.info(f"- Type: {data.get('questionType')}")
                logger.info(f"- House: {data.get('house', {}).get('showAs')}")
                logger.info(f"- Asked by: {data.get('by', {}).get('showAs')}")
                logger.info(f"- Asked to: {data.get('to', {}).get('showAs')}")
                logger.info(f"- Question preview: {data.get('showAs', '')[:100]}...")
                
                # Check validation warnings
                warnings = data.get('validationWarnings', {})
                if warnings.get('invalidMember'):
                    logger.warning(f"- Invalid member reference")
                if warnings.get('invalidHouse'):
                    logger.warning(f"- Invalid house reference")
            
            # Get total count
            total_questions = len(list(questions_ref.stream()))
            logger.info(f"\nTotal questions in collection: {total_questions}")
            
        except Exception as e:
            logger.error(f"Error verifying questions: {e}")
    
    def analyze_relationships(self):
        """Analyze data relationships and validation"""
        logger.info("Analyzing data relationships...")
        
        try:
            # Check votes to members relationships
            votes_ref = self.db.collection('votes')
            votes_sample = votes_ref.limit(5).get()
            
            member_codes_in_votes = set()
            for vote_doc in votes_sample:
                data = vote_doc.to_dict()
                member_votes = data.get('memberVotes', [])
                for mv in member_votes:
                    member_code = mv.get('memberCode')
                    if member_code:
                        member_codes_in_votes.add(member_code)
            
            logger.info(f"Unique member codes in sample votes: {len(member_codes_in_votes)}")
            
            # Check questions to members relationships
            questions_ref = self.db.collection('questions')
            questions_sample = questions_ref.limit(10).get()
            
            member_codes_in_questions = set()
            for question_doc in questions_sample:
                data = question_doc.to_dict()
                member_code = data.get('by', {}).get('memberCode')
                if member_code:
                    member_codes_in_questions.add(member_code)
            
            logger.info(f"Unique member codes in sample questions: {len(member_codes_in_questions)}")
            
            # Check if members exist
            members_ref = self.db.collection('members')
            existing_members = {doc.id for doc in members_ref.stream()}
            
            votes_valid_members = sum(1 for mc in member_codes_in_votes if mc in existing_members)
            questions_valid_members = sum(1 for mc in member_codes_in_questions if mc in existing_members)
            
            logger.info(f"Valid member references in votes: {votes_valid_members}/{len(member_codes_in_votes)}")
            logger.info(f"Valid member references in questions: {questions_valid_members}/{len(member_codes_in_questions)}")
            
        except Exception as e:
            logger.error(f"Error analyzing relationships: {e}")
    
    def check_ingestion_metadata(self):
        """Check ingestion metadata"""
        logger.info("Checking ingestion metadata...")
        
        try:
            metadata_ref = self.db.collection('ingestion_metadata').document('votes_questions_last')
            metadata_doc = metadata_ref.get()
            
            if metadata_doc.exists:
                data = metadata_doc.to_dict()
                logger.info(f"Last ingestion: {data.get('last_ingestion')}")
                logger.info(f"Duration: {data.get('duration_seconds', 0):.2f} seconds")
                logger.info(f"Counts: {data.get('counts', {})}")
                logger.info(f"Date ranges: {data.get('date_ranges', {})}")
            else:
                logger.warning("No ingestion metadata found")
                
        except Exception as e:
            logger.error(f"Error checking metadata: {e}")

def main():
    """Run verification"""
    logger.info("Starting data verification...")
    
    verifier = DataVerifier()
    
    verifier.verify_votes_data()
    logger.info("\n" + "="*50)
    verifier.verify_questions_data()
    logger.info("\n" + "="*50)
    verifier.analyze_relationships()
    logger.info("\n" + "="*50)
    verifier.check_ingestion_metadata()
    
    logger.info("\nVerification completed!")

if __name__ == "__main__":
    main()
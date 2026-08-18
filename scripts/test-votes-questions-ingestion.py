"""
Test script for enhanced Oireachtas data ingestion
Tests votes and questions ingestion with relationship validation
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataIngestionTester:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        
    def test_votes_api(self, limit=5):
        """Test votes API and analyze data structure"""
        logger.info("Testing votes API...")
        
        # Get recent votes
        date_start = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        date_end = datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'date_start': date_start,
            'date_end': date_end,
            'limit': limit
        }
        
        try:
            response = requests.get(f"{self.base_url}/votes", params=params)
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Votes API Response Structure:")
            logger.info(f"- Head counts: {data.get('head', {}).get('counts', {})}")
            logger.info(f"- Results count: {len(data.get('results', []))}")
            
            if data.get('results'):
                sample_vote = data['results'][0]
                division = sample_vote.get('division', {})
                
                logger.info(f"\nSample Vote Analysis:")
                logger.info(f"- Vote ID: {division.get('voteId')}")
                logger.info(f"- Date: {sample_vote.get('contextDate')}")
                logger.info(f"- Outcome: {division.get('outcome')}")
                logger.info(f"- House: {division.get('house', {}).get('showAs')}")
                logger.info(f"- Subject: {division.get('subject', {}).get('showAs')}")
                
                # Analyze vote tallies
                tallies = division.get('tallies', {})
                logger.info(f"\nVote Tallies:")
                for vote_type in ['taVotes', 'nilVotes', 'staonVotes']:
                    if vote_type in tallies:
                        count = tallies[vote_type].get('tally', 0)
                        show_as = tallies[vote_type].get('showAs', vote_type)
                        member_count = len(tallies[vote_type].get('members', []))
                        logger.info(f"- {show_as}: {count} votes ({member_count} member records)")
                
                # Sample member votes
                if 'taVotes' in tallies and tallies['taVotes'].get('members'):
                    sample_member = tallies['taVotes']['members'][0]['member']
                    logger.info(f"\nSample Member Vote:")
                    logger.info(f"- Member: {sample_member.get('showAs')}")
                    logger.info(f"- Member Code: {sample_member.get('memberCode')}")
                    logger.info(f"- URI: {sample_member.get('uri')}")
            
            return data
            
        except Exception as e:
            logger.error(f"Error testing votes API: {e}")
            return None

    def test_questions_api(self, limit=5):
        """Test questions API and analyze data structure"""
        logger.info("Testing questions API...")
        
        # Get recent questions
        date_start = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        date_end = datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'date_start': date_start,
            'date_end': date_end,
            'limit': limit
        }
        
        try:
            response = requests.get(f"{self.base_url}/questions", params=params)
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Questions API Response Structure:")
            logger.info(f"- Head counts: {data.get('head', {}).get('counts', {})}")
            logger.info(f"- Results count: {len(data.get('results', []))}")
            
            if data.get('results'):
                sample_question = data['results'][0]
                question = sample_question.get('question', {})
                
                logger.info(f"\nSample Question Analysis:")
                logger.info(f"- Question Number: {question.get('questionNumber')}")
                logger.info(f"- Date: {question.get('date')}")
                logger.info(f"- Type: {question.get('questionType')}")
                logger.info(f"- House: {question.get('house', {}).get('showAs')}")
                logger.info(f"- Asked by: {question.get('by', {}).get('showAs')}")
                logger.info(f"- Asked to: {question.get('to', {}).get('showAs')}")
                logger.info(f"- Question text preview: {question.get('showAs', '')[:100]}...")
                
                # Analyze relationships
                logger.info(f"\nRelationship Analysis:")
                logger.info(f"- Member Code: {question.get('by', {}).get('memberCode')}")
                logger.info(f"- House Code: {question.get('house', {}).get('houseCode')}")
                logger.info(f"- Debate Section: {question.get('debateSection', {}).get('showAs')}")
            
            return data
            
        except Exception as e:
            logger.error(f"Error testing questions API: {e}")
            return None

    def analyze_relationships(self):
        """Analyze data relationships for database design"""
        logger.info("Analyzing data relationships...")
        
        # Test both APIs
        votes_data = self.test_votes_api(3)
        time.sleep(1)  # Rate limiting
        questions_data = self.test_questions_api(3)
        
        logger.info("\n" + "="*50)
        logger.info("RELATIONSHIP ANALYSIS SUMMARY")
        logger.info("="*50)
        
        # Extract member codes for relationship validation
        if votes_data and votes_data.get('results'):
            vote_members = set()
            for vote_result in votes_data['results']:
                division = vote_result.get('division', {})
                tallies = division.get('tallies', {})
                for vote_type in ['taVotes', 'nilVotes', 'staonVotes']:
                    if vote_type in tallies and tallies[vote_type]:
                        for member_vote in tallies[vote_type].get('members', []):
                            member_data = member_vote.get('member', {})
                            if member_data:
                                member_code = member_data.get('memberCode')
                                if member_code:
                                    vote_members.add(member_code)
            
            logger.info(f"Unique members found in votes: {len(vote_members)}")
            logger.info(f"Sample vote member codes: {list(vote_members)[:5]}")
        
        if questions_data and questions_data.get('results'):
            question_members = set()
            question_houses = set()
            for question_result in questions_data['results']:
                question = question_result.get('question', {})
                member_data = question.get('by', {})
                house_data = question.get('house', {})
                if member_data:
                    member_code = member_data.get('memberCode')
                    if member_code:
                        question_members.add(member_code)
                if house_data:
                    house_code = house_data.get('houseCode')
                    if house_code:
                        question_houses.add(house_code)
            
            logger.info(f"Unique members found in questions: {len(question_members)}")
            logger.info(f"Sample question member codes: {list(question_members)[:5]}")
            logger.info(f"Houses in questions: {list(question_houses)}")
        
        # Suggest database collections and relationships
        logger.info(f"\n" + "="*50)
        logger.info("SUGGESTED DATABASE STRUCTURE")
        logger.info("="*50)
        
        logger.info("""
Collections to create:
1. votes - Main vote/division records
   - Document ID: voteId
   - Relationships: house, members (via memberVotes array)
   
2. questions - Parliamentary questions
   - Document ID: uri (cleaned)
   - Relationships: house, member (asker), debate section
   
3. member_votes - Individual member vote records (subcollection or separate)
   - Parent: votes/{voteId}/member_votes/{memberCode}
   - Fields: memberCode, voteType, voteTypeDisplay
   
Indexes needed:
- votes: date, house.houseCode, outcome
- questions: date, questionType, by.memberCode, house.houseCode
- member_votes: memberCode, voteType

Relationship validation:
- All memberCodes in votes/questions should exist in members collection
- All house references should exist in houses collection
        """)

def main():
    """Run the data ingestion tests"""
    tester = DataIngestionTester()
    
    try:
        logger.info("Starting Oireachtas data relationship analysis...")
        tester.analyze_relationships()
        logger.info("Analysis completed successfully!")
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")

if __name__ == "__main__":
    main()
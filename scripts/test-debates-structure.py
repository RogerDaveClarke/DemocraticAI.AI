"""
Test script for analyzing Oireachtas debates API structure
Explores the complex debate hierarchy and content for RAG/LLM integration
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DebatesStructureAnalyzer:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        
    def analyze_debates_overview(self, limit=10):
        """Analyze top-level debates structure"""
        logger.info("Analyzing debates overview...")
        
        # Get recent debates
        date_start = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        date_end = datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'date_start': date_start,
            'date_end': date_end,
            'limit': limit
        }
        
        try:
            response = requests.get(f"{self.base_url}/debates", params=params)
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Debates API Response Structure:")
            logger.info(f"- Head counts: {data.get('head', {}).get('counts', {})}")
            logger.info(f"- Results count: {len(data.get('results', []))}")
            
            # Analyze structure of debates
            if data.get('results'):
                for i, debate in enumerate(data['results'][:3]):  # First 3 for analysis
                    logger.info(f"\n=== Debate {i+1} Analysis ===")
                    logger.info(f"Context Date: {debate.get('contextDate')}")
                    logger.info(f"Debate Type: {debate.get('debateType')}")
                    
                    # Check debate section structure
                    debate_section = debate.get('debateSection', {})
                    logger.info(f"Debate Section:")
                    logger.info(f"- Show As: {debate_section.get('showAs')}")
                    logger.info(f"- URI: {debate_section.get('uri')}")
                    
                    # Check house information
                    house = debate_section.get('house', {})
                    logger.info(f"House: {house.get('showAs')} ({house.get('houseCode')})")
                    
                    # Check counts - this might show structure complexity
                    counts = debate.get('counts', {})
                    logger.info(f"Counts: {counts}")
                    
            return data
            
        except Exception as e:
            logger.error(f"Error analyzing debates: {e}")
            return None
    
    def analyze_specific_debate(self, debate_uri):
        """Analyze a specific debate's detailed structure"""
        logger.info(f"Analyzing specific debate: {debate_uri}")
        
        try:
            # Extract debate identifier from URI
            # Format might be like: https://data.oireachtas.ie/ie/oireachtas/debate/2025-10-15/dail
            parsed = urlparse(debate_uri)
            path_parts = parsed.path.strip('/').split('/')
            
            # Build API call based on URI structure
            if len(path_parts) >= 6:  # Expected structure
                date = path_parts[4]
                chamber = path_parts[5]
                
                params = {
                    'date': date,
                    'chamber': chamber
                }
                
                response = requests.get(f"{self.base_url}/debates", params=params)
                response.raise_for_status()
                data = response.json()
                
                logger.info(f"Specific Debate Analysis:")
                logger.info(f"- Results: {len(data.get('results', []))}")
                
                if data.get('results'):
                    debate = data['results'][0]
                    logger.info(f"- Context Date: {debate.get('contextDate')}")
                    logger.info(f"- Debate Type: {debate.get('debateType')}")
                    
                    # Look for sub-debates or sections
                    logger.info(f"- Available keys: {list(debate.keys())}")
                
                return data
                
        except Exception as e:
            logger.error(f"Error analyzing specific debate: {e}")
            return None
    
    def explore_debate_content_api(self):
        """Explore if there's a separate API for debate content/speeches"""
        logger.info("Exploring debate content APIs...")
        
        # Try different endpoints that might contain speech content
        endpoints_to_test = [
            "/debates",
            "/speeches", 
            "/contributions",
            "/proceedings"
        ]
        
        for endpoint in endpoints_to_test:
            try:
                logger.info(f"\nTesting endpoint: {endpoint}")
                response = requests.get(f"{self.base_url}{endpoint}?limit=1")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ {endpoint} - Available")
                    logger.info(f"   Structure: {list(data.keys())}")
                    if data.get('results'):
                        logger.info(f"   Sample result keys: {list(data['results'][0].keys())}")
                elif response.status_code == 404:
                    logger.info(f"❌ {endpoint} - Not found")
                else:
                    logger.info(f"⚠️  {endpoint} - Status: {response.status_code}")
                    
            except Exception as e:
                logger.info(f"❌ {endpoint} - Error: {e}")
    
    def analyze_debate_relationships(self, sample_debate):
        """Analyze how debates relate to other data (members, questions, votes)"""
        logger.info("Analyzing debate relationships...")
        
        if not sample_debate:
            return
            
        debate_section = sample_debate.get('debateSection', {})
        
        # Check for member references
        logger.info("Looking for member/speaker references...")
        
        # Check if there are speaker or contribution fields
        for key in sample_debate.keys():
            if any(term in key.lower() for term in ['speaker', 'member', 'contribution', 'speech']):
                logger.info(f"Found potential speaker field: {key}")
                logger.info(f"Value: {sample_debate[key]}")
    
    def test_debate_detail_uri(self, debate_uri):
        """Test accessing debate detail through its URI"""
        logger.info(f"Testing debate detail URI access...")
        
        # The URI might be accessible directly or need transformation
        if debate_uri:
            try:
                # Try direct access
                response = requests.get(debate_uri)
                logger.info(f"Direct URI access: Status {response.status_code}")
                
                if response.status_code == 200:
                    # Check if it's JSON API response
                    try:
                        data = response.json()
                        logger.info(f"URI returned JSON with keys: {list(data.keys())}")
                        return data
                    except:
                        logger.info(f"URI returned HTML/other content (length: {len(response.text)})")
                        
            except Exception as e:
                logger.error(f"Error accessing debate URI: {e}")
                
        return None

def main():
    analyzer = DebatesStructureAnalyzer()
    
    # Step 1: Analyze debates overview
    logger.info("="*50)
    logger.info("STEP 1: Debates Overview Analysis")
    logger.info("="*50)
    debates_data = analyzer.analyze_debates_overview()
    
    # Step 2: Explore content APIs
    logger.info("\n" + "="*50)
    logger.info("STEP 2: Exploring Content APIs")
    logger.info("="*50)
    analyzer.explore_debate_content_api()
    
    # Step 3: Analyze relationships if we have sample data
    if debates_data and debates_data.get('results'):
        logger.info("\n" + "="*50)
        logger.info("STEP 3: Relationship Analysis")
        logger.info("="*50)
        sample_debate = debates_data['results'][0]
        analyzer.analyze_debate_relationships(sample_debate)
        
        # Step 4: Test specific debate URI access
        debate_uri = sample_debate.get('debateSection', {}).get('uri')
        if debate_uri:
            logger.info("\n" + "="*50)
            logger.info("STEP 4: Debate URI Analysis")
            logger.info("="*50)
            analyzer.test_debate_detail_uri(debate_uri)
    
    logger.info("\nDebate structure analysis completed!")

if __name__ == "__main__":
    main()
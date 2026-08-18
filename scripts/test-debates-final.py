"""
Final comprehensive test script for Oireachtas debates API
Focus on debateSections and actual speech content extraction
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComprehensiveDebatesAnalyzer:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        
    def analyze_debate_sections(self, limit=2):
        """Comprehensive analysis of debateSections structure"""
        logger.info("Analyzing debate sections comprehensively...")
        
        # Get recent debates
        date_start = (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d')
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
            
            logger.info(f"Found {len(data.get('results', []))} debates")
            
            for i, debate in enumerate(data.get('results', [])):
                logger.info(f"\n{'='*80}")
                logger.info(f"DEBATE {i+1} - {debate.get('contextDate')}")
                logger.info(f"{'='*80}")
                
                debate_record = debate.get('debateRecord', {})
                
                # Basic info
                logger.info(f"Chamber: {debate_record.get('chamber', {}).get('showAs')}")
                logger.info(f"House: {debate_record.get('house', {}).get('showAs')}")
                logger.info(f"Date: {debate_record.get('date')}")
                logger.info(f"URI: {debate_record.get('uri')}")
                logger.info(f"Counts: {debate_record.get('counts', {})}")
                
                # Analyze debate sections
                debate_sections = debate_record.get('debateSections', [])
                logger.info(f"\nFound {len(debate_sections)} debate sections:")
                
                for j, section in enumerate(debate_sections[:5]):  # First 5 sections
                    logger.info(f"\n  --- Section {j+1} ---")
                    logger.info(f"  All keys: {list(section.keys())}")
                    logger.info(f"  Show As: {section.get('showAs')}")
                    logger.info(f"  URI: {section.get('uri')}")
                    logger.info(f"  Anchor: {section.get('anchor')}")
                    logger.info(f"  Bill: {section.get('bill', {}).get('showAs') if section.get('bill') else 'None'}")
                    
                    # Look for speakers/speeches
                    if 'speakers' in section:
                        speakers = section['speakers']
                        logger.info(f"  Speakers: {len(speakers)} found")
                        for k, speaker in enumerate(speakers[:2]):  # First 2 speakers
                            logger.info(f"    Speaker {k+1}: {speaker.get('showAs')} ({speaker.get('uri')})")
                    
                    # Look for speeches
                    if 'speeches' in section:
                        speeches = section['speeches']
                        logger.info(f"  Speeches: {len(speeches)} found")
                        if speeches:
                            first_speech = speeches[0]
                            logger.info(f"    First speech keys: {list(first_speech.keys())}")
                            logger.info(f"    Speaker: {first_speech.get('by', {}).get('showAs')}")
                            logger.info(f"    Speech URI: {first_speech.get('uri')}")
                            
                            # Check for speech content
                            self.extract_speech_text(first_speech, "    ")
                    
                    # Look for any other content fields
                    for key in section.keys():
                        if key not in ['showAs', 'uri', 'anchor', 'bill', 'speakers', 'speeches']:
                            value = section[key]
                            if isinstance(value, (str, int, float)) and len(str(value)) > 10:
                                logger.info(f"  {key}: {str(value)[:100]}...")
                            elif isinstance(value, list) and value:
                                logger.info(f"  {key}: List with {len(value)} items")
                            elif isinstance(value, dict) and value:
                                logger.info(f"  {key}: Dict with keys {list(value.keys())}")
                
                # Try to get more detailed content for this debate
                debate_uri = debate_record.get('uri')
                if debate_uri:
                    logger.info(f"\n{'='*60}")
                    logger.info(f"TESTING DETAILED ACCESS FOR DEBATE")
                    logger.info(f"{'='*60}")
                    self.test_detailed_debate_access(debate_uri)
                
                # Only analyze first debate in detail
                break
                
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {e}")
            return None
    
    def extract_speech_text(self, speech_obj, indent=""):
        """Extract actual speech text content"""
        logger.info(f"{indent}Extracting speech text...")
        
        # Common fields that might contain speech content
        text_fields = ['text', 'content', 'para', 'paragraphs', 'speechText', 'body']
        
        for field in text_fields:
            if field in speech_obj:
                content = speech_obj[field]
                if isinstance(content, str) and len(content) > 20:
                    logger.info(f"{indent}Found {field}: {content[:200]}...")
                elif isinstance(content, list) and content:
                    logger.info(f"{indent}Found {field} list with {len(content)} items")
                    if isinstance(content[0], str):
                        logger.info(f"{indent}First item: {content[0][:150]}...")
                elif isinstance(content, dict):
                    logger.info(f"{indent}Found {field} dict: {list(content.keys())}")
        
        # If no direct text found, look recursively
        if not any(field in speech_obj for field in text_fields):
            logger.info(f"{indent}No direct text fields found, checking all fields...")
            for key, value in speech_obj.items():
                if isinstance(value, str) and len(value) > 50:
                    logger.info(f"{indent}{key}: {value[:150]}...")
    
    def test_detailed_debate_access(self, debate_uri):
        """Test accessing detailed debate content"""
        logger.info(f"Testing detailed access for: {debate_uri}")
        
        try:
            # Extract date and chamber from URI
            # Format: https://data.oireachtas.ie/ie/oireachtas/debate/dail/2025-10-15
            parts = debate_uri.split('/')
            if len(parts) >= 7:
                chamber = parts[-2]
                date = parts[-1]
                
                # Test with specific parameters for maximum detail
                params = {
                    'chamber': chamber,
                    'date': date,
                    'limit': 100  # Try to get all sections
                }
                
                response = requests.get(f"{self.base_url}/debates", params=params)
                response.raise_for_status()
                data = response.json()
                
                logger.info(f"Detailed access results: {len(data.get('results', []))} debates")
                
                if data.get('results'):
                    detailed_debate = data['results'][0]
                    detailed_record = detailed_debate.get('debateRecord', {})
                    detailed_sections = detailed_record.get('debateSections', [])
                    
                    logger.info(f"Detailed sections count: {len(detailed_sections)}")
                    
                    # Look for any section with actual speech content
                    for i, section in enumerate(detailed_sections[:3]):
                        logger.info(f"\nDetailed Section {i+1}:")
                        logger.info(f"  Show As: {section.get('showAs')}")
                        
                        # Check if this section has speech content we missed
                        if 'speeches' in section and section['speeches']:
                            speech = section['speeches'][0]
                            logger.info(f"  Found speech in detailed view:")
                            self.extract_speech_text(speech, "    ")
                
        except Exception as e:
            logger.error(f"Error in detailed access: {e}")
    
    def test_individual_speech_api(self):
        """Test if individual speeches can be accessed via API"""
        logger.info("\nTesting individual speech API access...")
        
        # First get a debate with speeches
        try:
            response = requests.get(f"{self.base_url}/debates", params={'limit': 10})
            response.raise_for_status()
            data = response.json()
            
            # Look for a speech URI to test
            speech_uri = None
            for debate in data.get('results', []):
                debate_record = debate.get('debateRecord', {})
                for section in debate_record.get('debateSections', []):
                    if 'speeches' in section and section['speeches']:
                        speech_uri = section['speeches'][0].get('uri')
                        if speech_uri:
                            break
                if speech_uri:
                    break
            
            if speech_uri:
                logger.info(f"Testing speech URI: {speech_uri}")
                
                # Try direct access to speech URI
                try:
                    response = requests.get(speech_uri)
                    logger.info(f"Direct speech access: Status {response.status_code}")
                    
                    if response.status_code == 200:
                        try:
                            speech_data = response.json()
                            logger.info(f"Speech data keys: {list(speech_data.keys())}")
                            self.extract_speech_text(speech_data, "  ")
                        except:
                            content = response.text
                            logger.info(f"Speech content (first 300 chars): {content[:300]}...")
                
                except Exception as e:
                    logger.error(f"Error accessing speech URI: {e}")
            else:
                logger.info("No speech URI found to test")
                
        except Exception as e:
            logger.error(f"Error finding speech to test: {e}")

def main():
    analyzer = ComprehensiveDebatesAnalyzer()
    
    # Comprehensive analysis
    analyzer.analyze_debate_sections()
    
    # Test individual speech access
    analyzer.test_individual_speech_api()
    
    logger.info("\nComprehensive debate analysis completed!")

if __name__ == "__main__":
    main()
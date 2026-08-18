"""
Targeted analysis of Oireachtas debates structure
Focus on extracting actual speech content from nested debateSection structure
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TargetedDebatesAnalyzer:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        
    def analyze_nested_debate_sections(self):
        """Analyze the nested debateSection structure properly"""
        logger.info("Analyzing nested debate sections...")
        
        # Get recent debates
        params = {
            'date': '2025-10-15',  # Specific date for focused analysis
            'chamber': 'dail',
            'limit': 1
        }
        
        try:
            response = requests.get(f"{self.base_url}/debates", params=params)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('results'):
                logger.error("No debate results found")
                return
            
            debate = data['results'][0]
            debate_record = debate.get('debateRecord', {})
            
            logger.info(f"Debate Date: {debate_record.get('date')}")
            logger.info(f"Chamber: {debate_record.get('chamber', {}).get('showAs')}")
            logger.info(f"Counts: {debate_record.get('counts', {})}")
            
            # Analyze the nested debate sections
            debate_sections = debate_record.get('debateSections', [])
            logger.info(f"\nFound {len(debate_sections)} top-level sections")
            
            for i, section_wrapper in enumerate(debate_sections[:5]):
                logger.info(f"\n{'='*60}")
                logger.info(f"SECTION {i+1}")
                logger.info(f"{'='*60}")
                
                # The actual debate section is nested inside
                actual_section = section_wrapper.get('debateSection', {})
                
                logger.info(f"Section ID: {actual_section.get('debateSectionId')}")
                logger.info(f"Show As: {actual_section.get('showAs')}")
                logger.info(f"URI: {actual_section.get('uri')}")
                logger.info(f"Debate Type: {actual_section.get('debateType')}")
                logger.info(f"Counts: {actual_section.get('counts', {})}")
                
                # Check for speakers
                speakers = actual_section.get('speakers', [])
                logger.info(f"Speakers: {len(speakers)} found")
                for j, speaker in enumerate(speakers[:3]):
                    logger.info(f"  Speaker {j+1}: {speaker.get('showAs')} (Party: {speaker.get('party', {}).get('showAs', 'Unknown')})")
                
                # Check if this section contains debate content
                contains_debate = actual_section.get('containsDebate', [])
                if contains_debate:
                    logger.info(f"\nContains Debate: {len(contains_debate)} items")
                    self.analyze_debate_content(contains_debate[0] if contains_debate else None)
                
                # Try to access the individual section via API
                section_uri = actual_section.get('uri')
                if section_uri:
                    logger.info(f"\nTesting section URI access...")
                    self.test_section_access(section_uri)
                
                # Only analyze first few sections
                if i >= 2:
                    break
                    
        except Exception as e:
            logger.error(f"Error in nested analysis: {e}")
    
    def analyze_debate_content(self, debate_content):
        """Analyze the content within containsDebate"""
        if not debate_content:
            return
            
        logger.info(f"Debate content keys: {list(debate_content.keys())}")
        
        # Look for speech-related content
        for key, value in debate_content.items():
            if 'speech' in key.lower() or 'contribution' in key.lower():
                logger.info(f"Found speech-related field: {key}")
                if isinstance(value, list):
                    logger.info(f"  Contains {len(value)} items")
                    if value:
                        first_item = value[0]
                        logger.info(f"  First item keys: {list(first_item.keys()) if isinstance(first_item, dict) else type(first_item)}")
                        if isinstance(first_item, dict):
                            self.extract_speech_details(first_item)
                elif isinstance(value, dict):
                    logger.info(f"  Dict with keys: {list(value.keys())}")
                    self.extract_speech_details(value)
    
    def extract_speech_details(self, speech_obj):
        """Extract detailed speech information"""
        logger.info("    Speech details:")
        
        # Look for speaker information
        if 'by' in speech_obj:
            speaker = speech_obj['by']
            logger.info(f"      Speaker: {speaker.get('showAs')}")
            logger.info(f"      Party: {speaker.get('party', {}).get('showAs', 'Unknown')}")
        
        # Look for speech content
        text_fields = ['text', 'content', 'para', 'paragraphs', 'speechText', 'body']
        for field in text_fields:
            if field in speech_obj:
                content = speech_obj[field]
                if isinstance(content, str) and len(content) > 20:
                    logger.info(f"      {field}: {content[:200]}...")
                elif isinstance(content, list) and content:
                    logger.info(f"      {field}: List with {len(content)} items")
                    if isinstance(content[0], str):
                        logger.info(f"        First: {content[0][:150]}...")
        
        # Show all available keys for debugging
        logger.info(f"      All keys: {list(speech_obj.keys())}")
    
    def test_section_access(self, section_uri):
        """Test accessing individual debate section"""
        logger.info(f"Testing section access: {section_uri}")
        
        try:
            # Try direct access to section URI
            response = requests.get(section_uri)
            logger.info(f"  Direct access status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    section_data = response.json()
                    logger.info(f"  Section data keys: {list(section_data.keys())}")
                    
                    # Look for speech content in the detailed section
                    self.search_for_speeches(section_data)
                    
                except json.JSONDecodeError:
                    content = response.text
                    logger.info(f"  Non-JSON response (first 200 chars): {content[:200]}...")
            
        except Exception as e:
            logger.error(f"  Error accessing section: {e}")
    
    def search_for_speeches(self, data, path=""):
        """Recursively search for speech content in any data structure"""
        if isinstance(data, dict):
            for key, value in data.items():
                current_path = f"{path}.{key}" if path else key
                
                # Look for speech-related keys
                if any(term in key.lower() for term in ['speech', 'contribution', 'speaker', 'para']):
                    logger.info(f"    Found at {current_path}:")
                    if isinstance(value, str) and len(value) > 30:
                        logger.info(f"      Text: {value[:150]}...")
                    elif isinstance(value, list):
                        logger.info(f"      List with {len(value)} items")
                        if value and isinstance(value[0], dict):
                            logger.info(f"        First item keys: {list(value[0].keys())}")
                    elif isinstance(value, dict):
                        logger.info(f"      Dict with keys: {list(value.keys())}")
                
                # Continue searching recursively (but limit depth)
                if path.count('.') < 3:
                    self.search_for_speeches(value, current_path)
                    
        elif isinstance(data, list):
            for i, item in enumerate(data[:3]):  # Only check first 3 items
                self.search_for_speeches(item, f"{path}[{i}]")
    
    def test_different_api_endpoints(self):
        """Test if there are other endpoints for speech content"""
        logger.info("\nTesting alternative endpoints...")
        
        # Test various potential endpoints
        test_endpoints = [
            "/debates",
            "/debate",
            "/speeches", 
            "/contributions",
            "/proceedings",
            "/debatesections",
            "/debate-sections"
        ]
        
        for endpoint in test_endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}?limit=1")
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ {endpoint}: Available - {list(data.keys())}")
                elif response.status_code == 404:
                    logger.info(f"❌ {endpoint}: Not found")
                else:
                    logger.info(f"⚠️  {endpoint}: Status {response.status_code}")
            except Exception as e:
                logger.info(f"❌ {endpoint}: Error - {e}")

def main():
    analyzer = TargetedDebatesAnalyzer()
    
    # Targeted analysis of nested structure
    analyzer.analyze_nested_debate_sections()
    
    # Test alternative endpoints
    analyzer.test_different_api_endpoints()
    
    logger.info("\nTargeted debate analysis completed!")

if __name__ == "__main__":
    main()
"""
Final attempt to extract actual debate speech content
Focus on accessing individual debate sections via their URIs
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FinalDebatesAnalyzer:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        
    def analyze_and_access_sections(self):
        """Get debate sections and try to access them individually"""
        logger.info("Getting debate sections and testing individual access...")
        
        params = {
            'date': '2025-10-15',
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
            debate_sections = debate_record.get('debateSections', [])
            
            logger.info(f"Found {len(debate_sections)} sections")
            
            for i, section_wrapper in enumerate(debate_sections[:3]):
                actual_section = section_wrapper.get('debateSection', {})
                
                logger.info(f"\n{'='*60}")
                logger.info(f"SECTION {i+1}: {actual_section.get('showAs')}")
                logger.info(f"{'='*60}")
                logger.info(f"Section ID: {actual_section.get('debateSectionId')}")
                logger.info(f"Speech Count: {actual_section.get('counts', {}).get('speechCount', 0)}")
                logger.info(f"Speaker Count: {actual_section.get('counts', {}).get('speakerCount', 0)}")
                
                section_uri = actual_section.get('uri')
                logger.info(f"URI: {section_uri}")
                
                # Try to access this specific section
                if section_uri:
                    self.access_debate_section(section_uri)
                
        except Exception as e:
            logger.error(f"Error: {e}")
    
    def access_debate_section(self, section_uri):
        """Access individual debate section to get speech content"""
        logger.info(f"Accessing debate section: {section_uri}")
        
        try:
            # Try direct access
            response = requests.get(section_uri)
            logger.info(f"Direct access status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    # Try as JSON first
                    section_data = response.json()
                    logger.info(f"JSON response keys: {list(section_data.keys())}")
                    self.analyze_section_data(section_data)
                    
                except json.JSONDecodeError:
                    # If not JSON, check content type
                    content_type = response.headers.get('content-type', '')
                    logger.info(f"Content-Type: {content_type}")
                    
                    content = response.text
                    logger.info(f"Content length: {len(content)}")
                    logger.info(f"Content preview: {content[:500]}...")
                    
                    # Check if it's XML/HTML with speech content
                    if 'speech' in content.lower() or 'speaker' in content.lower():
                        logger.info("Found speech-related content in response!")
                        self.extract_from_text_content(content)
            
        except Exception as e:
            logger.error(f"Error accessing section: {e}")
    
    def analyze_section_data(self, data):
        """Analyze JSON section data for speech content"""
        logger.info("Analyzing section JSON data...")
        
        def search_recursive(obj, path="", max_depth=5):
            if max_depth <= 0:
                return
                
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key
                    
                    # Look for speech/speaker related keys
                    if any(term in key.lower() for term in ['speech', 'speaker', 'contribution', 'para', 'text', 'content']):
                        logger.info(f"Found relevant field at {current_path}:")
                        
                        if isinstance(value, str) and len(value) > 30:
                            logger.info(f"  Text content: {value[:200]}...")
                        elif isinstance(value, list):
                            logger.info(f"  List with {len(value)} items")
                            if value and isinstance(value[0], dict):
                                logger.info(f"    First item keys: {list(value[0].keys())}")
                                if 'by' in value[0] or 'speaker' in value[0]:
                                    logger.info(f"    Speaker info found!")
                        elif isinstance(value, dict):
                            logger.info(f"  Dict with keys: {list(value.keys())}")
                    
                    # Continue searching
                    search_recursive(value, current_path, max_depth - 1)
                    
            elif isinstance(obj, list):
                for i, item in enumerate(obj[:5]):  # Limit to first 5 items
                    search_recursive(item, f"{path}[{i}]", max_depth - 1)
        
        search_recursive(data)
    
    def extract_from_text_content(self, content):
        """Extract speech information from text/HTML content"""
        logger.info("Extracting from text content...")
        
        # Look for common patterns in HTML/XML
        import re
        
        # Look for speaker patterns
        speaker_patterns = [
            r'<speaker[^>]*>([^<]+)</speaker>',
            r'<by[^>]*>([^<]+)</by>',
            r'Speaker:\s*([^\n\r]+)',
            r'Deputy\s+([^:]+):',
        ]
        
        for pattern in speaker_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                logger.info(f"Found speakers with pattern '{pattern}': {matches[:5]}")
        
        # Look for speech content patterns
        speech_patterns = [
            r'<speech[^>]*>(.*?)</speech>',
            r'<para[^>]*>(.*?)</para>',
            r'<p[^>]*>(.*?)</p>',
        ]
        
        for pattern in speech_patterns:
            matches = re.findall(pattern, content[:5000], re.IGNORECASE | re.DOTALL)  # Limit search area
            if matches:
                logger.info(f"Found speech content with pattern '{pattern}':")
                for i, match in enumerate(matches[:3]):
                    clean_text = re.sub(r'<[^>]+>', '', match)  # Remove HTML tags
                    if len(clean_text.strip()) > 20:
                        logger.info(f"  Speech {i+1}: {clean_text[:150]}...")
    
    def test_api_variations(self):
        """Test different API parameter combinations"""
        logger.info("\nTesting API variations for speech content...")
        
        test_params = [
            {'date': '2025-10-15', 'chamber': 'dail', 'limit': 100},
            {'date': '2025-10-15', 'chamber': 'dail', 'detail': 'full'},
            {'date': '2025-10-15', 'chamber': 'dail', 'include': 'speeches'},
            {'date': '2025-10-15', 'chamber': 'dail', 'expand': 'true'},
        ]
        
        for params in test_params:
            try:
                logger.info(f"\nTesting params: {params}")
                response = requests.get(f"{self.base_url}/debates", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    result_count = len(data.get('results', []))
                    
                    # Check if we get different/more detailed results
                    if data.get('results'):
                        first_result = data['results'][0]
                        sections = first_result.get('debateRecord', {}).get('debateSections', [])
                        if sections:
                            section = sections[0].get('debateSection', {})
                            counts = section.get('counts', {})
                            logger.info(f"  Success: {result_count} results, first section counts: {counts}")
                        else:
                            logger.info(f"  Success: {result_count} results, no sections")
                else:
                    logger.info(f"  Status: {response.status_code}")
                    
            except Exception as e:
                logger.info(f"  Error: {e}")

def main():
    analyzer = FinalDebatesAnalyzer()
    
    # Test accessing individual sections
    analyzer.analyze_and_access_sections()
    
    # Test API variations
    analyzer.test_api_variations()
    
    logger.info("\nFinal debate analysis completed!")

if __name__ == "__main__":
    main()
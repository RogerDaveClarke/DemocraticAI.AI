"""
Enhanced test script for analyzing Oireachtas debates API structure
Focus on debateRecord structure and speech content discovery
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedDebatesAnalyzer:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        
    def deep_analyze_debates(self, limit=5):
        """Deep analysis of debate record structure"""
        logger.info("Deep analyzing debates...")
        
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
            
            logger.info(f"Total debates found: {len(data.get('results', []))}")
            
            for i, debate in enumerate(data.get('results', [])):
                logger.info(f"\n{'='*60}")
                logger.info(f"DEBATE {i+1} ANALYSIS")
                logger.info(f"{'='*60}")
                
                logger.info(f"Context Date: {debate.get('contextDate')}")
                logger.info(f"All keys: {list(debate.keys())}")
                
                # Focus on debateRecord which seems to be the main content
                debate_record = debate.get('debateRecord', {})
                logger.info(f"\nDebate Record Structure:")
                logger.info(f"- Keys: {list(debate_record.keys())}")
                
                if 'debate' in debate_record:
                    debate_info = debate_record['debate']
                    logger.info(f"\nDebate Info:")
                    logger.info(f"- Keys: {list(debate_info.keys())}")
                    logger.info(f"- Chamber: {debate_info.get('chamber', {}).get('showAs')}")
                    logger.info(f"- Date: {debate_info.get('date')}")
                    logger.info(f"- URI: {debate_info.get('uri')}")
                    
                    # Look for debate sections - this might contain the topics/speeches
                    if 'debateSection' in debate_info:
                        sections = debate_info['debateSection']
                        if isinstance(sections, list):
                            logger.info(f"\nFound {len(sections)} debate sections:")
                            for j, section in enumerate(sections[:3]):  # First 3
                                logger.info(f"\n  Section {j+1}:")
                                logger.info(f"  - Keys: {list(section.keys())}")
                                logger.info(f"  - Show As: {section.get('showAs')}")
                                logger.info(f"  - URI: {section.get('uri')}")
                                
                                # Look for speeches within sections
                                if 'speech' in section:
                                    speeches = section['speech']
                                    if isinstance(speeches, list):
                                        logger.info(f"  - Contains {len(speeches)} speeches")
                                        
                                        # Analyze first speech in detail
                                        if speeches:
                                            first_speech = speeches[0]
                                            logger.info(f"    First speech keys: {list(first_speech.keys())}")
                                            logger.info(f"    Speaker: {first_speech.get('by', {}).get('showAs')}")
                                            logger.info(f"    Speech URI: {first_speech.get('uri')}")
                                            
                                            # Look for speech content
                                            if 'speechText' in first_speech:
                                                speech_text = first_speech['speechText']
                                                logger.info(f"    Speech text preview: {str(speech_text)[:200]}...")
                                            elif 'para' in first_speech:
                                                para = first_speech['para']
                                                logger.info(f"    Paragraph content: {str(para)[:200]}...")
                                    else:
                                        logger.info(f"  - Single speech object: {list(speeches.keys())}")
                        else:
                            logger.info(f"\nSingle debate section: {list(sections.keys())}")
                
                # Break after first few for detailed analysis
                if i >= 2:
                    break
                    
            return data
            
        except Exception as e:
            logger.error(f"Error in deep analysis: {e}")
            return None
    
    def test_debate_detail_api(self, debate_uri):
        """Test accessing individual debate details"""
        logger.info(f"Testing debate detail API...")
        
        if not debate_uri:
            return None
            
        try:
            # Try to construct API call from URI
            # URI format: https://data.oireachtas.ie/ie/oireachtas/debate/dail/2025-10-15
            if 'data.oireachtas.ie' in debate_uri:
                parts = debate_uri.split('/')
                if len(parts) >= 7:
                    chamber = parts[-2]  # dail or seanad
                    date = parts[-1]     # 2025-10-15
                    
                    # Try specific debate endpoint
                    api_url = f"{self.base_url}/debates"
                    params = {
                        'chamber': chamber,
                        'date': date
                    }
                    
                    response = requests.get(api_url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    
                    logger.info(f"Debate detail API response:")
                    logger.info(f"- Results count: {len(data.get('results', []))}")
                    
                    if data.get('results'):
                        debate = data['results'][0]
                        logger.info(f"- Debate keys: {list(debate.keys())}")
                        
                        # Look for speech content in this detailed view
                        self.extract_speech_content(debate)
                    
                    return data
                    
        except Exception as e:
            logger.error(f"Error testing debate detail API: {e}")
            return None
    
    def extract_speech_content(self, debate_data):
        """Extract and analyze speech content from debate data"""
        logger.info("Extracting speech content...")
        
        def recursive_search(obj, path=""):
            """Recursively search for speech content"""
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key
                    
                    # Look for speech-related keys
                    if any(term in key.lower() for term in ['speech', 'para', 'text', 'content']):
                        logger.info(f"Found potential content at {current_path}:")
                        if isinstance(value, str) and len(value) > 50:
                            logger.info(f"  Text preview: {value[:200]}...")
                        elif isinstance(value, list) and value:
                            logger.info(f"  List with {len(value)} items")
                            if isinstance(value[0], str):
                                logger.info(f"  First item: {value[0][:100]}...")
                        else:
                            logger.info(f"  Value: {str(value)[:100]}...")
                    
                    # Continue recursive search
                    recursive_search(value, current_path)
                    
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    recursive_search(item, f"{path}[{i}]")
        
        recursive_search(debate_data)
    
    def analyze_api_parameters(self):
        """Test different API parameters to understand capabilities"""
        logger.info("Analyzing API parameters...")
        
        test_params = [
            {'chamber': 'dail'},
            {'chamber': 'seanad'},
            {'date': '2025-10-15'},
            {'date_start': '2025-10-14', 'date_end': '2025-10-15'},
            {'member_id': 'AodhánóRíordáin'},  # Test member filter
        ]
        
        for params in test_params:
            try:
                logger.info(f"\nTesting params: {params}")
                response = requests.get(f"{self.base_url}/debates", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    result_count = len(data.get('results', []))
                    total_count = data.get('head', {}).get('counts', {}).get('debateCount', 0)
                    logger.info(f"  ✅ Success: {result_count} results (total: {total_count})")
                else:
                    logger.info(f"  ❌ Status: {response.status_code}")
                    
            except Exception as e:
                logger.info(f"  ❌ Error: {e}")
    
    def test_full_debate_workflow(self):
        """Test complete workflow from debates list to individual speech content"""
        logger.info("\n" + "="*60)
        logger.info("FULL WORKFLOW TEST")
        logger.info("="*60)
        
        # Step 1: Get recent debates
        logger.info("Step 1: Getting recent debates...")
        debates_data = self.deep_analyze_debates(limit=3)
        
        # Step 2: Test API parameters
        logger.info("\nStep 2: Testing API parameters...")
        self.analyze_api_parameters()
        
        # Step 3: Try to access specific debate details
        if debates_data and debates_data.get('results'):
            debate = debates_data['results'][0]
            debate_record = debate.get('debateRecord', {})
            debate_info = debate_record.get('debate', {})
            debate_uri = debate_info.get('uri')
            
            if debate_uri:
                logger.info(f"\nStep 3: Testing specific debate access...")
                self.test_debate_detail_api(debate_uri)

def main():
    analyzer = EnhancedDebatesAnalyzer()
    analyzer.test_full_debate_workflow()
    
    logger.info("\nEnhanced debate analysis completed!")

if __name__ == "__main__":
    main()
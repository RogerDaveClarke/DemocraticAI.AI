"""
Test accessing debate content via formats field
Based on Swagger documentation: "Files can be retrieved from https://data.oireachtas.ie by adding the URI fragment contained in the 'formats' fields"
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging
import xml.etree.ElementTree as ET

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DebateContentExtractor:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        self.data_base_url = "https://data.oireachtas.ie"
        
    def test_formats_access(self):
        """Test accessing debate content via formats field"""
        logger.info("Testing formats field access...")
        
        # Get a recent debate
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
            
            logger.info(f"Debate Date: {debate_record.get('date')}")
            
            # Check for formats at debate level
            debate_formats = debate_record.get('formats', {})
            logger.info(f"Debate level formats: {list(debate_formats.keys())}")
            
            if 'xml' in debate_formats:
                xml_uri = debate_formats['xml']['uri']
                logger.info(f"Found XML format: {xml_uri}")
                self.access_xml_content(xml_uri)
            
            # Check formats at section level
            debate_sections = debate_record.get('debateSections', [])
            logger.info(f"\nChecking {len(debate_sections)} sections for formats...")
            
            for i, section_wrapper in enumerate(debate_sections[:3]):
                actual_section = section_wrapper.get('debateSection', {})
                section_name = actual_section.get('showAs', f'Section {i+1}')
                
                logger.info(f"\n--- {section_name} ---")
                
                section_formats = actual_section.get('formats', {})
                logger.info(f"Section formats: {list(section_formats.keys())}")
                
                if 'xml' in section_formats:
                    xml_uri = section_formats['xml']['uri']
                    logger.info(f"Found section XML: {xml_uri}")
                    self.access_xml_content(xml_uri, section_name)
                    
                    # Only test first section with XML to avoid spam
                    break
                    
        except Exception as e:
            logger.error(f"Error testing formats: {e}")
    
    def access_xml_content(self, xml_uri, context=""):
        """Access XML content and extract speech data"""
        logger.info(f"Accessing XML content for {context}...")
        logger.info(f"XML URI: {xml_uri}")
        
        try:
            # Construct full URL
            if xml_uri.startswith('/'):
                full_url = f"{self.data_base_url}{xml_uri}"
            else:
                full_url = xml_uri
            
            logger.info(f"Full URL: {full_url}")
            
            response = requests.get(full_url)
            logger.info(f"XML access status: {response.status_code}")
            
            if response.status_code == 200:
                xml_content = response.text
                logger.info(f"XML content length: {len(xml_content)}")
                
                # Parse XML and extract speech content
                self.parse_xml_for_speeches(xml_content, context)
            else:
                logger.error(f"Failed to access XML: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error accessing XML: {e}")
    
    def parse_xml_for_speeches(self, xml_content, context=""):
        """Parse XML content to extract speeches and speaker information"""
        logger.info(f"Parsing XML for speeches ({context})...")
        
        try:
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Remove namespace prefix for easier searching
            # First, let's see what we're dealing with
            logger.info(f"Root element: {root.tag}")
            logger.info(f"Root attributes: {root.attrib}")
            
            # Look for speech elements (common patterns in parliamentary XML)
            speech_patterns = [
                './/speech',
                './/contribution',
                './/para',
                './/*[@as="speech"]',
                './/*[contains(local-name(), "speech")]'
            ]
            
            total_speeches = 0
            
            for pattern in speech_patterns:
                try:
                    speeches = root.findall(pattern)
                    if speeches:
                        logger.info(f"\nFound {len(speeches)} elements with pattern '{pattern}'")
                        total_speeches += len(speeches)
                        
                        # Analyze first few speeches
                        for i, speech in enumerate(speeches[:3]):
                            logger.info(f"\n  Speech {i+1}:")
                            logger.info(f"    Tag: {speech.tag}")
                            logger.info(f"    Attributes: {speech.attrib}")
                            
                            # Look for speaker information
                            speaker_attrs = ['by', 'speaker', 'member']
                            for attr in speaker_attrs:
                                if attr in speech.attrib:
                                    logger.info(f"    Speaker ({attr}): {speech.attrib[attr]}")
                            
                            # Get speech text
                            speech_text = speech.text or ""
                            if speech_text.strip():
                                logger.info(f"    Direct text: {speech_text[:200]}...")
                            
                            # Check for nested text content
                            full_text = ''.join(speech.itertext()).strip()
                            if len(full_text) > len(speech_text.strip()):
                                logger.info(f"    Full text: {full_text[:200]}...")
                            
                            # Look for child elements
                            children = list(speech)
                            if children:
                                logger.info(f"    Child elements: {[child.tag for child in children]}")
                        
                        # Don't continue with other patterns if we found speeches
                        if total_speeches > 0:
                            break
                            
                except Exception as e:
                    logger.debug(f"Pattern '{pattern}' failed: {e}")
            
            if total_speeches == 0:
                logger.info("No speech elements found with standard patterns")
                logger.info("Examining XML structure...")
                self.examine_xml_structure(root)
                
        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            logger.info(f"XML preview: {xml_content[:500]}...")
        except Exception as e:
            logger.error(f"Error parsing XML: {e}")
    
    def examine_xml_structure(self, root, max_depth=3, current_depth=0):
        """Examine XML structure to understand the format"""
        if current_depth >= max_depth:
            return
            
        indent = "  " * current_depth
        logger.info(f"{indent}Element: {root.tag}")
        
        if root.attrib:
            logger.info(f"{indent}Attributes: {root.attrib}")
        
        if root.text and root.text.strip():
            text_preview = root.text.strip()[:100]
            logger.info(f"{indent}Text: {text_preview}...")
        
        # Examine unique child elements
        child_tags = set()
        for child in root:
            child_tags.add(child.tag)
        
        if child_tags:
            logger.info(f"{indent}Child elements: {sorted(child_tags)}")
            
            # Examine first child of each type
            examined = set()
            for child in root:
                if child.tag not in examined and current_depth < max_depth - 1:
                    examined.add(child.tag)
                    self.examine_xml_structure(child, max_depth, current_depth + 1)

def main():
    extractor = DebateContentExtractor()
    extractor.test_formats_access()
    
    logger.info("\nDebate content extraction test completed!")

if __name__ == "__main__":
    main()
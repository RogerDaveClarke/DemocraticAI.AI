"""
Parse Akoma Ntoso XML format to extract debate speeches
Based on successful XML access via formats field
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging
import xml.etree.ElementTree as ET

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AkomaNtosoDebateParser:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        self.data_base_url = "https://data.oireachtas.ie"
        # Akoma Ntoso namespace
        self.ns = {'akn': 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD13'}
        
    def get_debate_with_xml(self):
        """Get a debate and extract XML content"""
        logger.info("Getting debate with XML content...")
        
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
            
            # Get XML format
            debate_formats = debate_record.get('formats', {})
            if 'xml' not in debate_formats:
                logger.error("No XML format available")
                return
            
            xml_uri = debate_formats['xml']['uri']
            logger.info(f"XML URI: {xml_uri}")
            
            # Access XML content
            if xml_uri.startswith('http'):
                full_url = xml_uri
            else:
                full_url = f"{self.data_base_url}{xml_uri}"
            
            logger.info(f"Full URL: {full_url}")
            response = requests.get(full_url)
            
            if response.status_code != 200:
                logger.error(f"Failed to get XML: {response.status_code}")
                return
            
            xml_content = response.text
            logger.info(f"XML content length: {len(xml_content)}")
            
            # Parse the XML
            self.parse_akoma_ntoso_xml(xml_content)
            
        except Exception as e:
            logger.error(f"Error: {e}")
    
    def parse_akoma_ntoso_xml(self, xml_content):
        """Parse Akoma Ntoso XML to extract speech content"""
        logger.info("Parsing Akoma Ntoso XML...")
        
        try:
            root = ET.fromstring(xml_content)
            
            # Find debate body
            debate_body = root.find('.//akn:debateBody', self.ns)
            if debate_body is None:
                logger.error("No debateBody found")
                return
            
            # Find all debate sections
            debate_sections = debate_body.findall('.//akn:debateSection', self.ns)
            logger.info(f"Found {len(debate_sections)} debate sections")
            
            for i, section in enumerate(debate_sections[:5]):  # First 5 sections
                logger.info(f"\n{'='*60}")
                logger.info(f"DEBATE SECTION {i+1}")
                logger.info(f"{'='*60}")
                
                # Get section metadata
                section_name = section.get('name', f'Section {i+1}')
                logger.info(f"Section name: {section_name}")
                
                # Look for speeches in this section
                speeches = self.extract_speeches_from_section(section)
                
                if speeches:
                    logger.info(f"Found {len(speeches)} speeches in this section")
                    
                    for j, speech_data in enumerate(speeches[:3]):  # First 3 speeches
                        logger.info(f"\n--- Speech {j+1} ---")
                        logger.info(f"Speaker: {speech_data.get('speaker', 'Unknown')}")
                        logger.info(f"Content: {speech_data.get('content', '')[:300]}...")
                        
                        # Also show any metadata
                        if speech_data.get('metadata'):
                            logger.info(f"Metadata: {speech_data['metadata']}")
                else:
                    logger.info("No speeches found in this section")
                    # Show section structure for debugging
                    self.debug_section_structure(section)
                
                # Only analyze first few sections
                if i >= 2:
                    break
                    
        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
        except Exception as e:
            logger.error(f"Error parsing XML: {e}")
    
    def extract_speeches_from_section(self, section):
        """Extract speeches from a debate section"""
        speeches = []
        
        # Common Akoma Ntoso speech patterns
        speech_patterns = [
            './/akn:speech',
            './/akn:contribution',
            './/akn:narrative',
            './/akn:from',
        ]
        
        for pattern in speech_patterns:
            elements = section.findall(pattern, self.ns)
            if elements:
                logger.debug(f"Found {len(elements)} elements with pattern {pattern}")
                
                for element in elements:
                    speech_data = self.parse_speech_element(element)
                    if speech_data:
                        speeches.append(speech_data)
        
        # If no speeches found with standard patterns, look for paragraphs with speaker info
        if not speeches:
            speeches = self.extract_paragraphs_with_speakers(section)
        
        return speeches
    
    def parse_speech_element(self, element):
        """Parse individual speech element"""
        speech_data = {}
        
        # Get speaker information
        speaker = element.get('by') or element.get('from') or element.get('speaker')
        if speaker:
            speech_data['speaker'] = speaker
        
        # Look for nested speaker elements
        speaker_elem = element.find('.//akn:from', self.ns)
        if speaker_elem is not None:
            speech_data['speaker'] = speaker_elem.text or speaker_elem.get('showAs', 'Unknown')
        
        # Get speech content
        content_parts = []
        
        # Get direct text
        if element.text:
            content_parts.append(element.text.strip())
        
        # Get text from paragraphs
        paras = element.findall('.//akn:p', self.ns)
        for para in paras:
            para_text = ''.join(para.itertext()).strip()
            if para_text:
                content_parts.append(para_text)
        
        # If no paragraphs, get all text
        if not paras:
            full_text = ''.join(element.itertext()).strip()
            if full_text:
                content_parts.append(full_text)
        
        speech_data['content'] = ' '.join(content_parts)
        
        # Get metadata
        metadata = {}
        for attr_name, attr_value in element.attrib.items():
            if attr_name not in ['by', 'from', 'speaker']:
                metadata[attr_name] = attr_value
        
        if metadata:
            speech_data['metadata'] = metadata
        
        return speech_data if speech_data.get('content') else None
    
    def extract_paragraphs_with_speakers(self, section):
        """Extract paragraphs that might contain speaker information"""
        speeches = []
        
        # Look for paragraphs or other elements with speaker references
        all_paras = section.findall('.//akn:p', self.ns)
        
        current_speaker = None
        current_content = []
        
        for para in all_paras:
            para_text = ''.join(para.itertext()).strip()
            
            # Check if this paragraph indicates a new speaker
            # Common patterns: "Deputy Name:", "Minister Name:", etc.
            if ':' in para_text and len(para_text) < 100:  # Likely speaker intro
                # Save previous speech if any
                if current_speaker and current_content:
                    speeches.append({
                        'speaker': current_speaker,
                        'content': ' '.join(current_content)
                    })
                
                # Start new speech
                current_speaker = para_text.replace(':', '').strip()
                current_content = []
            else:
                # Add to current speech content
                if para_text:
                    current_content.append(para_text)
        
        # Save final speech
        if current_speaker and current_content:
            speeches.append({
                'speaker': current_speaker,
                'content': ' '.join(current_content)
            })
        
        return speeches
    
    def debug_section_structure(self, section):
        """Debug section structure when no speeches found"""
        logger.info("Debugging section structure...")
        
        # Show all direct children
        children = list(section)
        logger.info(f"Direct children: {[child.tag for child in children]}")
        
        # Show any elements with text content
        all_elements = section.findall('.//*', self.ns)
        text_elements = []
        
        for elem in all_elements[:10]:  # First 10 elements
            text = elem.text or ''.join(elem.itertext())
            if text and text.strip() and len(text.strip()) > 20:
                text_elements.append({
                    'tag': elem.tag,
                    'text': text.strip()[:100],
                    'attrs': elem.attrib
                })
        
        if text_elements:
            logger.info("Elements with text content:")
            for elem_data in text_elements[:3]:
                logger.info(f"  {elem_data['tag']}: {elem_data['text']}...")
                if elem_data['attrs']:
                    logger.info(f"    Attributes: {elem_data['attrs']}")

def main():
    parser = AkomaNtosoDebateParser()
    parser.get_debate_with_xml()
    
    logger.info("\nAkoma Ntoso parsing completed!")

if __name__ == "__main__":
    main()
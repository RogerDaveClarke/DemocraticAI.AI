"""
Debug the XML structure to understand why speeches aren't being extracted
"""

import requests
import xml.etree.ElementTree as ET
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_xml_structure():
    # Get the XML we know works
    xml_url = "https://data.oireachtas.ie/akn/ie/debateRecord/dail/2025-10-15/debate/mul@/main.xml"
    
    response = requests.get(xml_url)
    xml_content = response.text
    
    root = ET.fromstring(xml_content)
    ns = {'akn': 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD13'}
    
    # Find debate body
    debate_body = root.find('.//akn:debateBody', ns)
    
    # Get first few sections that we know have speeches
    debate_sections = debate_body.findall('.//akn:debateSection', ns)
    
    # Focus on section 3 which we know has 68 speeches
    section_3 = debate_sections[2]  # Index 2 = third section
    
    logger.info(f"Section 3 name: {section_3.get('name')}")
    
    # Find what actually contains the speeches
    logger.info("Analyzing section 3 structure:")
    
    def analyze_element(elem, depth=0, max_depth=4):
        if depth > max_depth:
            return
            
        indent = "  " * depth
        logger.info(f"{indent}{elem.tag} - attrs: {elem.attrib}")
        
        # Check for text content
        if elem.text and elem.text.strip():
            logger.info(f"{indent}  Text: {elem.text.strip()[:100]}...")
        
        # Check for specific speech-related patterns
        if 'speech' in elem.tag.lower() or 'from' in elem.tag.lower() or 'narrative' in elem.tag.lower():
            logger.info(f"{indent}  *** POTENTIAL SPEECH ELEMENT ***")
            
            # Get all text content
            all_text = ''.join(elem.itertext()).strip()
            if all_text:
                logger.info(f"{indent}  Full text: {all_text[:200]}...")
        
        # Recurse into children
        for child in list(elem)[:5]:  # Limit to first 5 children
            analyze_element(child, depth + 1, max_depth)
    
    analyze_element(section_3)

if __name__ == "__main__":
    debug_xml_structure()
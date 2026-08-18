"""
Comprehensive Oireachtas Debates Ingestion Script
Extracts debate content from Akoma Ntoso XML format for RAG/LLM analysis
"""

import requests
import json
from datetime import datetime, timedelta
import time
import logging
import xml.etree.ElementTree as ET
import firebase_admin
from firebase_admin import credentials, firestore
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OireachtasDebatesIngester:
    def __init__(self):
        self.base_url = "https://api.oireachtas.ie/v1"
        self.data_base_url = "https://data.oireachtas.ie"
        self.ns = {'akn': 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD13'}
        
        # Initialize Firebase
        self.init_firebase()
        
    def init_firebase(self):
        """Initialize Firebase connection"""
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            self.db = firestore.client()
            logger.info("Firebase initialized successfully")
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            raise
    
    def ingest_debates(self, days_back=7, chamber='dail', limit=10):
        """Main ingestion function for debates"""
        logger.info(f"Starting debates ingestion for {chamber}, {days_back} days back, limit {limit}")
        
        start_time = time.time()
        ingested_count = 0
        speech_count = 0
        
        try:
            # Get recent debates
            date_start = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
            date_end = datetime.now().strftime('%Y-%m-%d')
            
            params = {
                'date_start': date_start,
                'date_end': date_end,
                'chamber': chamber,
                'limit': limit
            }
            
            response = requests.get(f"{self.base_url}/debates", params=params)
            response.raise_for_status()
            data = response.json()
            
            debates = data.get('results', [])
            logger.info(f"Found {len(debates)} debates to process")
            
            for i, debate in enumerate(debates):
                logger.info(f"\nProcessing debate {i+1}/{len(debates)}")
                
                debate_data = self.process_debate(debate)
                if debate_data:
                    # Store debate metadata
                    debate_id = self.store_debate_record(debate_data)
                    
                    # Process speeches from XML
                    speeches = self.extract_speeches_from_debate(debate)
                    logger.info(f"Extracted {len(speeches)} speeches from debate")
                    
                    # Store speeches
                    for speech in speeches:
                        speech['debate_id'] = debate_id
                        speech['debate_date'] = debate_data['date']
                        speech['chamber'] = debate_data['chamber']
                        self.store_speech(speech)
                        speech_count += 1
                    
                    ingested_count += 1
            
            # Store ingestion metadata
            duration = time.time() - start_time
            self.store_ingestion_metadata('debates', {
                'debates': ingested_count,
                'speeches': speech_count
            }, duration, days_back)
            
            logger.info(f"Ingestion completed: {ingested_count} debates, {speech_count} speeches in {duration:.2f}s")
            
        except Exception as e:
            logger.error(f"Error in debates ingestion: {e}")
            raise
    
    def process_debate(self, debate):
        """Process debate metadata"""
        try:
            debate_record = debate.get('debateRecord', {})
            
            # Extract basic metadata
            debate_data = {
                'date': debate_record.get('date'),
                'chamber_info': debate_record.get('chamber', {}),
                'chamber': debate_record.get('chamber', {}).get('showAs'),
                'house_info': debate_record.get('house', {}),
                'house': debate_record.get('house', {}).get('showAs'),
                'uri': debate_record.get('uri'),
                'debate_type': debate_record.get('debateType'),
                'counts': debate_record.get('counts', {}),
                'last_updated': debate_record.get('lastUpdated'),
                'formats': debate_record.get('formats', {}),
                'context_date': debate.get('contextDate'),
                'ingested_at': datetime.now().isoformat()
            }
            
            return debate_data
            
        except Exception as e:
            logger.error(f"Error processing debate: {e}")
            return None
    
    def extract_speeches_from_debate(self, debate):
        """Extract speeches from debate XML"""
        speeches = []
        
        try:
            debate_record = debate.get('debateRecord', {})
            formats = debate_record.get('formats', {})
            
            if 'xml' not in formats:
                logger.warning("No XML format available for this debate")
                return speeches
            
            xml_uri = formats['xml']['uri']
            
            # Get XML content
            if xml_uri.startswith('http'):
                full_url = xml_uri
            else:
                full_url = f"{self.data_base_url}{xml_uri}"
            
            response = requests.get(full_url)
            if response.status_code != 200:
                logger.error(f"Failed to get XML: {response.status_code}")
                return speeches
            
            xml_content = response.text
            
            # Parse XML and extract speeches
            speeches = self.parse_akoma_ntoso_speeches(xml_content)
            
        except Exception as e:
            logger.error(f"Error extracting speeches: {e}")
        
        return speeches
    
    def parse_akoma_ntoso_speeches(self, xml_content):
        """Parse Akoma Ntoso XML to extract all speeches"""
        speeches = []
        
        try:
            root = ET.fromstring(xml_content)
            
            # Find debate body
            debate_body = root.find('.//akn:debateBody', self.ns)
            if debate_body is None:
                logger.warning("No debateBody found in XML")
                return speeches
            
            # Find all debate sections
            debate_sections = debate_body.findall('.//akn:debateSection', self.ns)
            logger.info(f"Processing {len(debate_sections)} debate sections")
            
            for section in debate_sections:
                section_name = section.get('name', 'Unknown Section')
                section_speeches = self.extract_speeches_from_section(section, section_name)
                speeches.extend(section_speeches)
            
        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
        except Exception as e:
            logger.error(f"Error parsing XML: {e}")
        
        return speeches
    
    def extract_speeches_from_section(self, section, section_name):
        """Extract speeches from a specific debate section"""
        speeches = []
        
        # Look for speech elements (the actual speech containers)
        speech_elements = section.findall('.//akn:speech', self.ns)
        
        for speech_elem in speech_elements:
            speech_data = self.parse_speech_element(speech_elem, section_name)
            if speech_data:
                speeches.append(speech_data)
        
        return speeches
    
    def parse_speech_element(self, speech_elem, section_name):
        """Parse individual speech element"""
        try:
            speech_data = {
                'section_name': section_name,
                'element_id': speech_elem.get('eId'),
                'extracted_at': datetime.now().isoformat()
            }
            
            # Extract speaker information from attributes
            speaker_by = speech_elem.get('by')
            speaker_as = speech_elem.get('as')
            
            if speaker_by:
                speech_data['speaker_id'] = speaker_by.replace('#', '')
            
            if speaker_as:
                speech_data['speaker_role_id'] = speaker_as.replace('#', '')
            
            # Extract speaker information from from element
            speaker_elem = speech_elem.find('.//akn:from', self.ns)
            if speaker_elem is not None:
                speaker_text = ''.join(speaker_elem.itertext()).strip()
                speech_data['speaker_raw'] = speaker_text
                speech_data['speaker'] = self.clean_speaker_name(speaker_text)
                speech_data['speaker_role'] = self.extract_speaker_role(speaker_text)
            else:
                # Fallback to using IDs if no from element
                speech_data['speaker'] = speaker_by.replace('#', '') if speaker_by else "Unknown Speaker"
                speech_data['speaker_raw'] = speech_data['speaker']
            
            # Extract speech content from paragraphs
            content_parts = []
            
            # Get all paragraph elements
            paras = speech_elem.findall('.//akn:p', self.ns)
            for para in paras:
                para_text = ''.join(para.itertext()).strip()
                if para_text:
                    content_parts.append(para_text)
            
            # If no paragraphs, get all text excluding the speaker name
            if not content_parts:
                full_text = ''.join(speech_elem.itertext()).strip()
                # Remove speaker name from beginning if present
                if speaker_elem is not None:
                    speaker_name = ''.join(speaker_elem.itertext()).strip()
                    if full_text.startswith(speaker_name):
                        full_text = full_text[len(speaker_name):].strip()
                
                if full_text:
                    content_parts.append(full_text)
            
            speech_content = ' '.join(content_parts)
            speech_data['content'] = speech_content
            speech_data['content_length'] = len(speech_content)
            
            # Extract additional metadata
            speech_data['language'] = self.detect_language(speech_content)
            speech_data['word_count'] = len(speech_content.split()) if speech_content else 0
            
            # Get timestamp if available
            time_elem = speech_elem.find('.//akn:recordedTime', self.ns)
            if time_elem is not None:
                speech_data['recorded_time'] = time_elem.get('time')
            
            # Only return speech if it has meaningful content
            return speech_data if speech_content and len(speech_content) > 20 else None
            
        except Exception as e:
            logger.error(f"Error parsing speech element: {e}")
            return None
    
    def clean_speaker_name(self, speaker_raw):
        """Clean and normalize speaker name"""
        if not speaker_raw:
            return "Unknown Speaker"
        
        # Remove common prefixes/suffixes
        cleaned = speaker_raw
        
        # Remove parenthetical information for main name
        main_name = re.sub(r'\([^)]*\)', '', cleaned).strip()
        
        # If main name is too short, use original
        if len(main_name) < 3:
            main_name = cleaned
        
        return main_name.strip()
    
    def extract_speaker_role(self, speaker_raw):
        """Extract speaker role/title"""
        if not speaker_raw:
            return None
        
        # Common role patterns
        role_patterns = [
            r'(Deputy|Minister|Cathaoirleach|Leas-Cathaoirleach)',
            r'(Minister of State)',
            r'(An Cathaoirleach)',
            r'(Chairman|Chairperson)'
        ]
        
        for pattern in role_patterns:
            match = re.search(pattern, speaker_raw, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return "Member"  # Default role
    
    def detect_language(self, text):
        """Simple language detection"""
        if not text:
            return "unknown"
        
        # Simple heuristic: Irish contains specific characters/words
        irish_indicators = ['agus', 'go', 'an', 'na', 'ach', 'ar', 'le', 'Gabhaim', 'buíochas']
        english_indicators = ['the', 'and', 'to', 'of', 'in', 'that', 'thank', 'Minister']
        
        irish_count = sum(1 for word in irish_indicators if word in text)
        english_count = sum(1 for word in english_indicators if word in text)
        
        if irish_count > english_count:
            return "irish"
        elif english_count > irish_count:
            return "english"
        else:
            return "mixed"
    
    def store_debate_record(self, debate_data):
        """Store debate metadata in Firestore"""
        try:
            # Generate debate ID from URI or date+chamber
            if debate_data.get('uri'):
                debate_id = debate_data['uri'].split('/')[-1]
            else:
                debate_id = f"{debate_data['date']}_{debate_data['chamber'].lower()}"
            
            # Clean debate ID for Firestore
            debate_id = re.sub(r'[^a-zA-Z0-9_-]', '_', debate_id)
            
            # Store in debates collection
            self.db.collection('debates').document(debate_id).set(debate_data)
            logger.info(f"Stored debate: {debate_id}")
            
            return debate_id
            
        except Exception as e:
            logger.error(f"Error storing debate record: {e}")
            return None
    
    def store_speech(self, speech_data):
        """Store individual speech in Firestore"""
        try:
            # Generate speech ID
            speech_id = f"{speech_data['debate_id']}_{speech_data['element_id']}"
            speech_id = re.sub(r'[^a-zA-Z0-9_-]', '_', speech_id)
            
            # Store in speeches collection
            self.db.collection('speeches').document(speech_id).set(speech_data)
            
        except Exception as e:
            logger.error(f"Error storing speech: {e}")
    
    def store_ingestion_metadata(self, data_type, counts, duration, days_back):
        """Store ingestion metadata"""
        try:
            metadata = {
                'data_type': data_type,
                'ingestion_time': datetime.now(),
                'duration_seconds': duration,
                'counts': counts,
                'parameters': {
                    'days_back': days_back
                }
            }
            
            self.db.collection('ingestion_metadata').add(metadata)
            logger.info(f"Stored ingestion metadata: {counts}")
            
        except Exception as e:
            logger.error(f"Error storing metadata: {e}")

def main():
    """Main execution function"""
    ingester = OireachtasDebatesIngester()
    
    # Ingest recent debates (last 3 days, limited sample for testing)
    ingester.ingest_debates(days_back=3, chamber='dail', limit=2)
    
    logger.info("Debates ingestion completed!")

if __name__ == "__main__":
    main()
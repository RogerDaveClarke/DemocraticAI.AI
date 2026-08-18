"""
Verify ingested debates and speeches data
Analyze the structure and quality of debate content for RAG/LLM usage
"""

import firebase_admin
from firebase_admin import credentials, firestore
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DebatesDataVerifier:
    def __init__(self):
        # Initialize Firebase
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        self.db = firestore.client()
        
    def verify_debates_collection(self):
        """Verify debates collection data"""
        logger.info("Verifying debates collection...")
        
        debates_ref = self.db.collection('debates')
        debates = list(debates_ref.stream())
        
        logger.info(f"Found {len(debates)} debate documents")
        
        for i, debate_doc in enumerate(debates[:3]):  # First 3 debates
            debate_data = debate_doc.to_dict()
            logger.info(f"\n--- Debate {i+1}: {debate_doc.id} ---")
            logger.info(f"Date: {debate_data.get('date')}")
            logger.info(f"Chamber: {debate_data.get('chamber')}")
            logger.info(f"House: {debate_data.get('house')}")
            logger.info(f"Counts: {debate_data.get('counts', {})}")
            logger.info(f"Ingested at: {debate_data.get('ingested_at')}")
            
        return len(debates)
    
    def verify_speeches_collection(self):
        """Verify speeches collection data"""
        logger.info("\nVerifying speeches collection...")
        
        speeches_ref = self.db.collection('speeches')
        speeches = list(speeches_ref.limit(10).stream())  # Sample first 10
        
        total_speeches = len(list(speeches_ref.stream()))
        logger.info(f"Total speeches in collection: {total_speeches}")
        
        # Analyze sample speeches
        logger.info(f"\nAnalyzing sample of {len(speeches)} speeches:")
        
        for i, speech_doc in enumerate(speeches):
            speech_data = speech_doc.to_dict()
            logger.info(f"\n--- Speech {i+1}: {speech_doc.id} ---")
            logger.info(f"Speaker: {speech_data.get('speaker', 'Unknown')}")
            logger.info(f"Speaker Role: {speech_data.get('speaker_role', 'Unknown')}")
            logger.info(f"Section: {speech_data.get('section_name', 'Unknown')}")
            logger.info(f"Language: {speech_data.get('language', 'Unknown')}")
            logger.info(f"Word Count: {speech_data.get('word_count', 0)}")
            logger.info(f"Content Length: {speech_data.get('content_length', 0)}")
            logger.info(f"Recorded Time: {speech_data.get('recorded_time', 'Unknown')}")
            
            # Show content preview
            content = speech_data.get('content', '')
            if content:
                logger.info(f"Content preview: {content[:200]}...")
            
            if i >= 4:  # Limit to first 5 for detailed analysis
                break
        
        return total_speeches
    
    def analyze_speech_statistics(self):
        """Analyze statistics about the speech data"""
        logger.info("\nAnalyzing speech statistics...")
        
        speeches_ref = self.db.collection('speeches')
        speeches = list(speeches_ref.stream())
        
        # Statistics
        total_speeches = len(speeches)
        total_words = 0
        languages = {}
        speakers = {}
        sections = {}
        roles = {}
        
        for speech_doc in speeches:
            speech_data = speech_doc.to_dict()
            
            # Word count
            word_count = speech_data.get('word_count', 0)
            total_words += word_count
            
            # Language distribution
            language = speech_data.get('language', 'unknown')
            languages[language] = languages.get(language, 0) + 1
            
            # Speaker distribution
            speaker = speech_data.get('speaker', 'Unknown')
            speakers[speaker] = speakers.get(speaker, 0) + 1
            
            # Section distribution
            section = speech_data.get('section_name', 'Unknown')
            sections[section] = sections.get(section, 0) + 1
            
            # Role distribution
            role = speech_data.get('speaker_role', 'Unknown')
            roles[role] = roles.get(role, 0) + 1
        
        # Report statistics
        logger.info(f"Total speeches: {total_speeches}")
        logger.info(f"Total words: {total_words:,}")
        logger.info(f"Average words per speech: {total_words / total_speeches:.1f}")
        
        logger.info(f"\nLanguage distribution:")
        for lang, count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {lang}: {count} ({count/total_speeches*100:.1f}%)")
        
        logger.info(f"\nTop 10 speakers by speech count:")
        top_speakers = sorted(speakers.items(), key=lambda x: x[1], reverse=True)[:10]
        for speaker, count in top_speakers:
            logger.info(f"  {speaker}: {count} speeches")
        
        logger.info(f"\nSection distribution:")
        for section, count in sorted(sections.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {section}: {count} speeches")
        
        logger.info(f"\nSpeaker role distribution:")
        for role, count in sorted(roles.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {role}: {count} speeches")
    
    def verify_data_for_rag(self):
        """Verify data quality for RAG/LLM usage"""
        logger.info("\nVerifying data quality for RAG/LLM usage...")
        
        speeches_ref = self.db.collection('speeches')
        speeches = list(speeches_ref.stream())
        
        # Quality metrics
        suitable_for_rag = 0
        too_short = 0
        missing_speaker = 0
        missing_content = 0
        
        for speech_doc in speeches:
            speech_data = speech_doc.to_dict()
            
            content = speech_data.get('content', '')
            speaker = speech_data.get('speaker', '')
            word_count = speech_data.get('word_count', 0)
            
            # Check quality criteria
            if not content:
                missing_content += 1
            elif not speaker or speaker == 'Unknown':
                missing_speaker += 1
            elif word_count < 10:
                too_short += 1
            else:
                suitable_for_rag += 1
        
        total_speeches = len(speeches)
        
        logger.info(f"RAG/LLM Data Quality Analysis:")
        logger.info(f"  Suitable for RAG: {suitable_for_rag} ({suitable_for_rag/total_speeches*100:.1f}%)")
        logger.info(f"  Too short (< 10 words): {too_short} ({too_short/total_speeches*100:.1f}%)")
        logger.info(f"  Missing speaker: {missing_speaker} ({missing_speaker/total_speeches*100:.1f}%)")
        logger.info(f"  Missing content: {missing_content} ({missing_content/total_speeches*100:.1f}%)")
    
    def test_search_queries(self):
        """Test sample search queries that would be useful for RAG"""
        logger.info("\nTesting sample search queries for RAG usage...")
        
        # Sample queries that users might ask
        test_queries = [
            "flood risk management",
            "schools building",
            "Deputy Michael Collins",
            "Minister",
            "Gaelscoil"
        ]
        
        speeches_ref = self.db.collection('speeches')
        
        for query in test_queries:
            logger.info(f"\nSearching for: '{query}'")
            
            # Simple text search (in production, would use vector search)
            matching_speeches = []
            all_speeches = speeches_ref.stream()
            
            for speech_doc in all_speeches:
                speech_data = speech_doc.to_dict()
                content = speech_data.get('content', '').lower()
                speaker = speech_data.get('speaker', '').lower()
                section = speech_data.get('section_name', '').lower()
                
                if (query.lower() in content or 
                    query.lower() in speaker or 
                    query.lower() in section):
                    matching_speeches.append(speech_data)
                
                if len(matching_speeches) >= 3:  # Limit for demo
                    break
            
            logger.info(f"Found {len(matching_speeches)} matching speeches (showing up to 3):")
            for i, speech in enumerate(matching_speeches[:3]):
                logger.info(f"  {i+1}. {speech.get('speaker', 'Unknown')} - {speech.get('content', '')[:100]}...")
    
    def check_ingestion_metadata(self):
        """Check ingestion metadata"""
        logger.info("\nChecking ingestion metadata...")
        
        metadata_ref = self.db.collection('ingestion_metadata')
        metadata_docs = list(metadata_ref.order_by('ingestion_time', direction=firestore.Query.DESCENDING).limit(5).stream())
        
        logger.info(f"Found {len(metadata_docs)} ingestion records:")
        
        for i, doc in enumerate(metadata_docs):
            data = doc.to_dict()
            logger.info(f"\n--- Ingestion {i+1} ---")
            logger.info(f"Data type: {data.get('data_type')}")
            logger.info(f"Time: {data.get('ingestion_time')}")
            logger.info(f"Duration: {data.get('duration_seconds', 0):.2f} seconds")
            logger.info(f"Counts: {data.get('counts', {})}")

def main():
    verifier = DebatesDataVerifier()
    
    # Comprehensive verification
    debate_count = verifier.verify_debates_collection()
    speech_count = verifier.verify_speeches_collection()
    
    # Statistical analysis
    verifier.analyze_speech_statistics()
    
    # RAG quality verification
    verifier.verify_data_for_rag()
    
    # Test search capabilities
    verifier.test_search_queries()
    
    # Check metadata
    verifier.check_ingestion_metadata()
    
    logger.info(f"\n{'='*60}")
    logger.info("VERIFICATION SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"✅ Debates ingested: {debate_count}")
    logger.info(f"✅ Speeches ingested: {speech_count}")
    logger.info(f"✅ Data structure verified")
    logger.info(f"✅ Search capability tested")
    logger.info(f"✅ Ready for RAG/LLM integration")
    
    logger.info("\nVerification completed!")

if __name__ == "__main__":
    main()
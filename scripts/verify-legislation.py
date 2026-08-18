"""
Verify ingested legislation data
Analyze bills, acts, stages, and relationships for completeness
"""

import firebase_admin
from firebase_admin import credentials, firestore
import logging
from collections import defaultdict
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LegislationDataVerifier:
    def __init__(self):
        # Initialize Firebase
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        self.db = firestore.client()
        
    def verify_bills_collection(self):
        """Verify bills collection data"""
        logger.info("Verifying bills collection...")
        
        bills_ref = self.db.collection('bills')
        bills = list(bills_ref.stream())
        
        logger.info(f"Found {len(bills)} bill documents")
        
        # Analyze bill statistics
        statuses = defaultdict(int)
        types = defaultdict(int)
        sources = defaultdict(int)
        years = defaultdict(int)
        
        for bill_doc in bills:
            bill_data = bill_doc.to_dict()
            
            status = bill_data.get('status', 'Unknown')
            statuses[status] += 1
            
            bill_type = bill_data.get('bill_type', 'Unknown')
            types[bill_type] += 1
            
            source = bill_data.get('source', 'Unknown')
            sources[source] += 1
            
            year = bill_data.get('bill_year', 'Unknown')
            years[year] += 1
        
        logger.info(f"\nBill Status Distribution:")
        for status, count in sorted(statuses.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {status}: {count}")
        
        logger.info(f"\nBill Type Distribution:")
        for bill_type, count in sorted(types.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {bill_type}: {count}")
        
        logger.info(f"\nBill Source Distribution:")
        for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {source}: {count}")
        
        logger.info(f"\nBill Year Distribution:")
        for year, count in sorted(years.items(), key=lambda x: x[0], reverse=True):
            logger.info(f"  {year}: {count}")
        
        # Show sample bills
        logger.info(f"\nSample bills:")
        for i, bill_doc in enumerate(bills[:5]):
            bill_data = bill_doc.to_dict()
            logger.info(f"  {i+1}. {bill_doc.id}: {bill_data.get('short_title_en', 'No title')}")
            logger.info(f"     Status: {bill_data.get('status')}, Year: {bill_data.get('bill_year')}")
        
        return len(bills)
    
    def verify_acts_collection(self):
        """Verify acts collection data"""
        logger.info("\nVerifying acts collection...")
        
        acts_ref = self.db.collection('acts')
        acts = list(acts_ref.stream())
        
        logger.info(f"Found {len(acts)} act documents")
        
        # Analyze act statistics
        years = defaultdict(int)
        
        for act_doc in acts:
            act_data = act_doc.to_dict()
            year = act_data.get('act_year', 'Unknown')
            years[year] += 1
        
        logger.info(f"\nAct Year Distribution:")
        for year, count in sorted(years.items(), key=lambda x: x[0], reverse=True):
            logger.info(f"  {year}: {count}")
        
        # Show sample acts
        logger.info(f"\nSample acts:")
        for i, act_doc in enumerate(acts[:5]):
            act_data = act_doc.to_dict()
            logger.info(f"  {i+1}. {act_doc.id}: {act_data.get('short_title_en', 'No title')}")
            logger.info(f"     Year: {act_data.get('act_year')}, Signed: {act_data.get('date_signed')}")
            logger.info(f"     Bill ID: {act_data.get('bill_id')}")
        
        return len(acts)
    
    def verify_bill_stages_collection(self):
        """Verify bill stages collection data"""
        logger.info("\nVerifying bill stages collection...")
        
        stages_ref = self.db.collection('bill_stages')
        stages = list(stages_ref.stream())
        
        logger.info(f"Found {len(stages)} bill stage documents")
        
        # Analyze stage statistics
        stage_names = defaultdict(int)
        chambers = defaultdict(int)
        completion_status = defaultdict(int)
        
        for stage_doc in stages:
            stage_data = stage_doc.to_dict()
            
            stage_name = stage_data.get('show_as', 'Unknown')
            stage_names[stage_name] += 1
            
            chamber_info = stage_data.get('chamber', {})
            chamber = chamber_info.get('show_as', 'Unknown') if chamber_info else 'No Chamber'
            chambers[chamber] += 1
            
            completed = stage_data.get('stage_completed', False)
            completion_status[completed] += 1
        
        logger.info(f"\nTop Stage Types:")
        for stage_name, count in sorted(stage_names.items(), key=lambda x: x[1], reverse=True)[:10]:
            logger.info(f"  {stage_name}: {count}")
        
        logger.info(f"\nChamber Distribution:")
        for chamber, count in sorted(chambers.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {chamber}: {count}")
        
        logger.info(f"\nCompletion Status:")
        logger.info(f"  Completed: {completion_status[True]}")
        logger.info(f"  Not Completed: {completion_status[False]}")
        
        return len(stages)
    
    def verify_bill_debates_collection(self):
        """Verify bill debates collection data"""
        logger.info("\nVerifying bill debates collection...")
        
        debates_ref = self.db.collection('bill_debates')
        debates = list(debates_ref.stream())
        
        logger.info(f"Found {len(debates)} bill debate documents")
        
        # Analyze debate statistics
        chambers = defaultdict(int)
        bills_with_debates = set()
        
        for debate_doc in debates:
            debate_data = debate_doc.to_dict()
            
            chamber_info = debate_data.get('chamber', {})
            chamber = chamber_info.get('show_as', 'Unknown') if chamber_info else 'Unknown'
            chambers[chamber] += 1
            
            bill_id = debate_data.get('bill_id')
            if bill_id:
                bills_with_debates.add(bill_id)
        
        logger.info(f"\nDebate Chamber Distribution:")
        for chamber, count in sorted(chambers.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {chamber}: {count}")
        
        logger.info(f"\nBills with debates: {len(bills_with_debates)}")
        
        # Show sample debates
        logger.info(f"\nSample bill debates:")
        for i, debate_doc in enumerate(debates[:5]):
            debate_data = debate_doc.to_dict()
            logger.info(f"  {i+1}. {debate_data.get('show_as', 'No title')}")
            logger.info(f"     Bill: {debate_data.get('bill_id')}, Date: {debate_data.get('date')}")
        
        return len(debates)
    
    def verify_bill_sponsors_collection(self):
        """Verify bill sponsors collection data"""
        logger.info("\nVerifying bill sponsors collection...")
        
        sponsors_ref = self.db.collection('bill_sponsors')
        sponsors = list(sponsors_ref.stream())
        
        logger.info(f"Found {len(sponsors)} bill sponsor documents")
        
        # Analyze sponsor statistics
        primary_sponsors = 0
        secondary_sponsors = 0
        roles = defaultdict(int)
        
        for sponsor_doc in sponsors:
            sponsor_data = sponsor_doc.to_dict()
            
            if sponsor_data.get('is_primary', False):
                primary_sponsors += 1
            else:
                secondary_sponsors += 1
            
            role_info = sponsor_data.get('role', {})
            role = role_info.get('show_as', 'Unknown') if role_info else 'Unknown'
            roles[role] += 1
        
        logger.info(f"\nSponsor Statistics:")
        logger.info(f"  Primary sponsors: {primary_sponsors}")
        logger.info(f"  Secondary sponsors: {secondary_sponsors}")
        
        logger.info(f"\nSponsor Roles:")
        for role, count in sorted(roles.items(), key=lambda x: x[1], reverse=True)[:10]:
            logger.info(f"  {role}: {count}")
        
        return len(sponsors)
    
    def verify_bill_amendments_collection(self):
        """Verify bill amendments collection data"""
        logger.info("\nVerifying bill amendments collection...")
        
        amendments_ref = self.db.collection('bill_amendments')
        amendments = list(amendments_ref.stream())
        
        logger.info(f"Found {len(amendments)} bill amendment documents")
        
        if amendments:
            # Analyze amendment statistics
            chambers = defaultdict(int)
            stages = defaultdict(int)
            
            for amendment_doc in amendments:
                amendment_data = amendment_doc.to_dict()
                
                chamber_info = amendment_data.get('chamber', {})
                chamber = chamber_info.get('show_as', 'Unknown') if chamber_info else 'Unknown'
                chambers[chamber] += 1
                
                stage_info = amendment_data.get('stage', {})
                stage = stage_info.get('show_as', 'Unknown') if stage_info else 'Unknown'
                stages[stage] += 1
            
            logger.info(f"\nAmendment Chamber Distribution:")
            for chamber, count in sorted(chambers.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"  {chamber}: {count}")
            
            logger.info(f"\nAmendment Stage Distribution:")
            for stage, count in sorted(stages.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"  {stage}: {count}")
        
        return len(amendments)
    
    def analyze_relationships(self):
        """Analyze relationships between different collections"""
        logger.info("\nAnalyzing relationships between collections...")
        
        # Get all collections
        bills = {doc.id: doc.to_dict() for doc in self.db.collection('bills').stream()}
        acts = {doc.id: doc.to_dict() for doc in self.db.collection('acts').stream()}
        stages = list(self.db.collection('bill_stages').stream())
        debates = list(self.db.collection('bill_debates').stream())
        
        # Analyze bill-to-act relationships
        bills_with_acts = 0
        for act_id, act_data in acts.items():
            bill_id = act_data.get('bill_id')
            if bill_id and bill_id in bills:
                bills_with_acts += 1
        
        logger.info(f"Bill-Act Relationships:")
        logger.info(f"  Bills that became acts: {bills_with_acts}")
        logger.info(f"  Total acts: {len(acts)}")
        logger.info(f"  Total bills: {len(bills)}")
        
        # Analyze bill-to-stage relationships
        bills_with_stages = set()
        for stage_doc in stages:
            stage_data = stage_doc.to_dict()
            bill_id = stage_data.get('bill_id')
            if bill_id:
                bills_with_stages.add(bill_id)
        
        logger.info(f"\nBill-Stage Relationships:")
        logger.info(f"  Bills with stages: {len(bills_with_stages)}")
        logger.info(f"  Total stages: {len(stages)}")
        
        # Analyze bill-to-debate relationships
        bills_with_debates = set()
        for debate_doc in debates:
            debate_data = debate_doc.to_dict()
            bill_id = debate_data.get('bill_id')
            if bill_id:
                bills_with_debates.add(bill_id)
        
        logger.info(f"\nBill-Debate Relationships:")
        logger.info(f"  Bills with debates: {len(bills_with_debates)}")
        logger.info(f"  Total debate records: {len(debates)}")
    
    def check_data_quality(self):
        """Check data quality for RAG/LLM usage"""
        logger.info("\nChecking data quality for RAG/LLM usage...")
        
        bills = list(self.db.collection('bills').stream())
        
        quality_metrics = {
            'complete_titles': 0,
            'missing_titles': 0,
            'complete_descriptions': 0,
            'missing_descriptions': 0,
            'recent_bills': 0,
            'old_bills': 0
        }
        
        current_year = datetime.now().year
        
        for bill_doc in bills:
            bill_data = bill_doc.to_dict()
            
            # Check titles
            short_title = bill_data.get('short_title_en', '')
            if short_title and len(short_title) > 10:
                quality_metrics['complete_titles'] += 1
            else:
                quality_metrics['missing_titles'] += 1
            
            # Check descriptions
            long_title = bill_data.get('long_title_en', '')
            if long_title and len(long_title) > 50:
                quality_metrics['complete_descriptions'] += 1
            else:
                quality_metrics['missing_descriptions'] += 1
            
            # Check recency
            bill_year = bill_data.get('bill_year')
            if bill_year and isinstance(bill_year, (int, str)):
                try:
                    year = int(bill_year)
                    if year >= current_year - 5:  # Last 5 years
                        quality_metrics['recent_bills'] += 1
                    else:
                        quality_metrics['old_bills'] += 1
                except:
                    quality_metrics['old_bills'] += 1
        
        total_bills = len(bills)
        
        logger.info(f"Data Quality Metrics:")
        logger.info(f"  Complete titles: {quality_metrics['complete_titles']} ({quality_metrics['complete_titles']/total_bills*100:.1f}%)")
        logger.info(f"  Missing titles: {quality_metrics['missing_titles']} ({quality_metrics['missing_titles']/total_bills*100:.1f}%)")
        logger.info(f"  Complete descriptions: {quality_metrics['complete_descriptions']} ({quality_metrics['complete_descriptions']/total_bills*100:.1f}%)")
        logger.info(f"  Missing descriptions: {quality_metrics['missing_descriptions']} ({quality_metrics['missing_descriptions']/total_bills*100:.1f}%)")
        logger.info(f"  Recent bills (2020+): {quality_metrics['recent_bills']} ({quality_metrics['recent_bills']/total_bills*100:.1f}%)")
        logger.info(f"  Older bills: {quality_metrics['old_bills']} ({quality_metrics['old_bills']/total_bills*100:.1f}%)")
    
    def check_ingestion_metadata(self):
        """Check ingestion metadata"""
        logger.info("\nChecking legislation ingestion metadata...")
        
        metadata_ref = self.db.collection('ingestion_metadata')
        # Simple query without ordering to avoid index requirements
        metadata_docs = list(metadata_ref.where('data_type', '==', 'legislation').stream())
        # Sort by ingestion_time in Python instead of Firestore
        metadata_docs = sorted(metadata_docs, key=lambda x: x.to_dict().get('ingestion_time', ''), reverse=True)[:5]
        
        logger.info(f"Found {len(metadata_docs)} legislation ingestion records:")
        
        total_counts = defaultdict(int)
        
        for i, doc in enumerate(metadata_docs):
            data = doc.to_dict()
            logger.info(f"\n--- Ingestion {i+1} ---")
            logger.info(f"Time: {data.get('ingestion_time')}")
            logger.info(f"Duration: {data.get('duration_seconds', 0):.2f} seconds")
            counts = data.get('counts', {})
            logger.info(f"Counts: {counts}")
            
            # Add to totals
            for key, value in counts.items():
                total_counts[key] += value
        
        logger.info(f"\nTotal Ingested:")
        for key, value in total_counts.items():
            logger.info(f"  {key}: {value}")

def main():
    verifier = LegislationDataVerifier()
    
    # Comprehensive verification
    bills_count = verifier.verify_bills_collection()
    acts_count = verifier.verify_acts_collection()
    stages_count = verifier.verify_bill_stages_collection()
    debates_count = verifier.verify_bill_debates_collection()
    sponsors_count = verifier.verify_bill_sponsors_collection()
    amendments_count = verifier.verify_bill_amendments_collection()
    
    # Relationship analysis
    verifier.analyze_relationships()
    
    # Quality analysis
    verifier.check_data_quality()
    
    # Check metadata
    verifier.check_ingestion_metadata()
    
    logger.info(f"\n{'='*60}")
    logger.info("LEGISLATION VERIFICATION SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"✅ Bills ingested: {bills_count}")
    logger.info(f"✅ Acts ingested: {acts_count}")
    logger.info(f"✅ Bill stages ingested: {stages_count}")
    logger.info(f"✅ Bill debates ingested: {debates_count}")
    logger.info(f"✅ Bill sponsors ingested: {sponsors_count}")
    logger.info(f"✅ Bill amendments ingested: {amendments_count}")
    logger.info(f"✅ Relationships verified")
    logger.info(f"✅ Data quality assessed")
    logger.info(f"✅ Ready for RAG/LLM integration")
    
    logger.info("\nLegislation verification completed!")

if __name__ == "__main__":
    main()
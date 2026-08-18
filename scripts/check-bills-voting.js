// Check bills and legislation data for voting information
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'replace-with-your-project-id'
});

async function checkBillsAndLegislation() {
  console.log('📋 Analyzing Bills and Legislation Data...\n');
  
  try {
    // Check bills collection
    console.log('📜 BILLS COLLECTION:');
    const billsSnapshot = await db.collection('bills').limit(3).get();
    console.log(`Found ${billsSnapshot.size} bill documents`);
    
    if (billsSnapshot.size > 0) {
      billsSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`\n--- Bill ${i+1}: ${data.billNo || doc.id} ---`);
        console.log(`  Title: ${data.longTitleEn || data.shortTitleEn || 'N/A'}`);
        console.log(`  Status: ${data.status || 'N/A'}`);
        console.log(`  Date: ${data.lastUpdated || data.dateUpdated || 'N/A'}`);
        console.log(`  House: ${data.house?.showAs || 'N/A'}`);
        console.log(`  Stage: ${data.currentStage?.stage?.showAs || 'N/A'}`);
        console.log(`  Sponsor: ${data.sponsor?.member?.showAs || 'N/A'}`);
        console.log(`  Fields: ${Object.keys(data).join(', ')}`);
      });
    }
    
    // Check bill stages
    console.log('\n\n🎭 BILL STAGES COLLECTION:');
    const stagesSnapshot = await db.collection('bill_stages').limit(3).get();
    console.log(`Found ${stagesSnapshot.size} stage documents`);
    
    if (stagesSnapshot.size > 0) {
      stagesSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`\n--- Stage ${i+1}: ${doc.id} ---`);
        console.log(`  Bill: ${data.billNo || 'N/A'}`);
        console.log(`  Stage: ${data.stage?.showAs || 'N/A'}`);
        console.log(`  Date: ${data.date || 'N/A'}`);
        console.log(`  House: ${data.house?.showAs || 'N/A'}`);
        console.log(`  Fields: ${Object.keys(data).join(', ')}`);
      });
    }
    
    // Check for votes related to bills
    console.log('\n\n🗳️ VOTES RELATED TO BILLS:');
    const billVotesSnapshot = await db.collection('votes').where('isBill', '==', true).limit(3).get();
    console.log(`Found ${billVotesSnapshot.size} votes related to bills`);
    
    if (billVotesSnapshot.size > 0) {
      billVotesSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`\n--- Bill Vote ${i+1}: ${data.voteId} ---`);
        console.log(`  Subject: ${data.subject?.showAs || 'N/A'}`);
        console.log(`  Date: ${data.date}`);
        console.log(`  Outcome: ${data.outcome}`);
        console.log(`  House: ${data.house?.showAs}`);
        console.log(`  Tallies: Tá=${data.tallies?.taVotes?.tally}, Níl=${data.tallies?.nilVotes?.tally}, Staon=${data.tallies?.staonVotes?.tally}`);
      });
    }
    
    // Summary statistics
    console.log('\n\n📊 SUMMARY STATISTICS:');
    const totalBills = await db.collection('bills').count().get();
    const totalStages = await db.collection('bill_stages').count().get();
    const totalVotes = await db.collection('votes').count().get();
    const totalBillVotes = await db.collection('votes').where('isBill', '==', true).count().get();
    
    console.log(`Total Bills: ${totalBills.data().count}`);
    console.log(`Total Bill Stages: ${totalStages.data().count}`);
    console.log(`Total Votes: ${totalVotes.data().count}`);
    console.log(`Votes on Bills: ${totalBillVotes.data().count}`);
    
  } catch (error) {
    console.error('Error analyzing bills and legislation:', error.message);
  }
}

checkBillsAndLegislation();
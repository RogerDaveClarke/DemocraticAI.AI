// Check if we have voting data in the database
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'replace-with-your-project-id'
});

async function checkVotingData() {
  console.log('🗄️ Checking database for voting data...\n');
  
  try {
    // Check for votes collection
    console.log('📊 Checking votes collection:');
    try {
      const votesSnapshot = await db.collection('votes').limit(5).get();
      console.log(`   Found ${votesSnapshot.size} vote documents`);
      
      if (votesSnapshot.size > 0) {
        console.log('   Sample votes:');
        votesSnapshot.docs.forEach((doc, i) => {
          const data = doc.data();
          console.log(`   ${i+1}. Vote ID: ${data.voteId || doc.id}`);
          console.log(`      Date: ${data.date || data.contextDate || 'N/A'}`);
          console.log(`      Outcome: ${data.outcome || 'N/A'}`);
          console.log(`      House: ${data.house?.showAs || 'N/A'}`);
          console.log(`      Subject: ${data.subject?.showAs || 'N/A'}`);
          
          // Check vote tallies
          if (data.tallies) {
            console.log(`      Tallies:`);
            console.log(`        Tá: ${data.tallies.taVotes?.tally || 0}`);
            console.log(`        Níl: ${data.tallies.nilVotes?.tally || 0}`);
            console.log(`        Staon: ${data.tallies.staonVotes?.tally || 0}`);
          }
          console.log('');
        });
      } else {
        console.log('   ❌ No votes found in database');
      }
    } catch (e) {
      console.log('   ❌ No votes collection found:', e.message);
    }
    
    // Check for questions collection
    console.log('\n❓ Checking questions collection:');
    try {
      const questionsSnapshot = await db.collection('questions').limit(3).get();
      console.log(`   Found ${questionsSnapshot.size} question documents`);
      
      if (questionsSnapshot.size > 0) {
        console.log('   Sample questions:');
        questionsSnapshot.docs.forEach((doc, i) => {
          const data = doc.data();
          console.log(`   ${i+1}. Question ID: ${doc.id}`);
          console.log(`      Date: ${data.date || data.contextDate || 'N/A'}`);
          console.log(`      Member: ${data.member?.showAs || 'N/A'}`);
          console.log(`      House: ${data.house?.showAs || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('   ❌ No questions found in database');
      }
    } catch (e) {
      console.log('   ❌ No questions collection found:', e.message);
    }
    
    // Check all collections
    console.log('\n📋 All available collections:');
    const collections = await db.listCollections();
    for (const collection of collections) {
      const snapshot = await collection.limit(1).get();
      console.log(`   - ${collection.id}: ${snapshot.size > 0 ? '✓ Has data' : '✗ Empty'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkVotingData();
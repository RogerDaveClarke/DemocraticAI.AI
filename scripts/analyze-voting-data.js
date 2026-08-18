// Get detailed information about voting data structure
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'replace-with-your-project-id'
});

async function analyzeVotingData() {
  console.log('🔍 Analyzing voting data structure...\n');
  
  try {
    // Get detailed vote information
    console.log('📊 VOTE DATA STRUCTURE:');
    const votesSnapshot = await db.collection('votes').limit(3).get();
    
    votesSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`\n=== VOTE ${i+1}: ${data.voteId} ===`);
      console.log('Basic Info:');
      console.log(`  - Vote ID: ${data.voteId}`);
      console.log(`  - Date: ${data.date || data.contextDate}`);
      console.log(`  - Outcome: ${data.outcome}`);
      console.log(`  - House: ${data.house?.showAs} (${data.house?.houseCode})`);
      console.log(`  - Subject: ${data.subject?.showAs}`);
      
      console.log('\nVote Tallies:');
      if (data.tallies) {
        console.log(`  - Tá (Yes): ${data.tallies.taVotes?.tally || 0}`);
        console.log(`  - Níl (No): ${data.tallies.nilVotes?.tally || 0}`);
        console.log(`  - Staon (Abstain): ${data.tallies.staonVotes?.tally || 0}`);
      }
      
      console.log('\nMember Votes:');
      if (data.memberVotes && data.memberVotes.length > 0) {
        console.log(`  - Total member votes recorded: ${data.memberVotes.length}`);
        console.log('  - Sample member votes:');
        data.memberVotes.slice(0, 3).forEach((vote, idx) => {
          console.log(`    ${idx+1}. ${vote.showAs}: ${vote.voteType} (${vote.memberCode})`);
        });
      } else {
        console.log('  - No individual member votes recorded');
      }
      
      console.log('\nAll available fields:');
      console.log(`  ${Object.keys(data).join(', ')}`);
    });
    
    // Check total vote count
    console.log('\n📈 VOTE STATISTICS:');
    const totalVotesSnapshot = await db.collection('votes').count().get();
    console.log(`Total votes in database: ${totalVotesSnapshot.data().count}`);
    
    // Check for member votes as a separate collection
    console.log('\n👥 MEMBER VOTES:');
    try {
      const memberVotesSnapshot = await db.collection('member_votes').limit(3).get();
      console.log(`Found ${memberVotesSnapshot.size} member vote documents`);
      
      if (memberVotesSnapshot.size > 0) {
        memberVotesSnapshot.docs.forEach((doc, i) => {
          const data = doc.data();
          console.log(`  ${i+1}. Member: ${data.memberCode}, Vote: ${data.voteType}, Vote ID: ${data.voteId}`);
        });
      }
    } catch (e) {
      console.log('No separate member_votes collection found');
    }
    
    // Check date range of votes
    console.log('\n📅 VOTE DATE RANGE:');
    const oldestVote = await db.collection('votes').orderBy('date', 'asc').limit(1).get();
    const newestVote = await db.collection('votes').orderBy('date', 'desc').limit(1).get();
    
    if (oldestVote.size > 0 && newestVote.size > 0) {
      const oldestData = oldestVote.docs[0].data();
      const newestData = newestVote.docs[0].data();
      console.log(`Oldest vote: ${oldestData.date} (${oldestData.voteId})`);
      console.log(`Newest vote: ${newestData.date} (${newestData.voteId})`);
    }
    
  } catch (error) {
    console.error('Error analyzing voting data:', error.message);
  }
}

analyzeVotingData();
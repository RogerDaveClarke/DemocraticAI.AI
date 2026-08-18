// Direct test against Firestore to see if the basic filtering works
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'replace-with-your-project-id'
});

async function testDirectFirestore() {
  console.log('🔍 Testing direct Firestore filtering...\n');
  
  try {
    // Test 1: Get all members (first 5)
    console.log('1. All members (first 5):');
    const allQuery = db.collection('members').limit(5);
    const allSnapshot = await allQuery.get();
    
    allSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`  ${i+1}. ${data.fullName}: party=${data.currentParty}, active=${data.isActive}`);
    });
    
    // Test 2: Filter by party
    console.log('\n2. Sinn_Féin members (first 5):');
    const partyQuery = db.collection('members').where('currentParty', '==', 'Sinn_Féin').limit(5);
    const partySnapshot = await partyQuery.get();
    
    console.log(`Found ${partySnapshot.docs.length} documents`);
    partySnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`  ${i+1}. ${data.fullName}: party=${data.currentParty}, active=${data.isActive}`);
    });
    
    // Test 3: Filter by active status
    console.log('\n3. Active members (first 5):');
    const activeQuery = db.collection('members').where('isActive', '==', true).limit(5);
    const activeSnapshot = await activeQuery.get();
    
    console.log(`Found ${activeSnapshot.docs.length} documents`);
    activeSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`  ${i+1}. ${data.fullName}: party=${data.currentParty}, active=${data.isActive}`);
    });
    
    // Test 4: Combined filters
    console.log('\n4. Active Sinn_Féin members (first 3):');
    const combinedQuery = db.collection('members')
      .where('currentParty', '==', 'Sinn_Féin')
      .where('isActive', '==', true)
      .limit(3);
    const combinedSnapshot = await combinedQuery.get();
    
    console.log(`Found ${combinedSnapshot.docs.length} documents`);
    combinedSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`  ${i+1}. ${data.fullName}: party=${data.currentParty}, active=${data.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDirectFirestore();
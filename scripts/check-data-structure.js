const { Firestore } = require('@google-cloud/firestore');

async function checkMemberDataStructure() {
  try {
    const db = new Firestore();
    
    console.log('🔍 Checking member data structure for filtering...');
    
    // Get a few sample members to see the data structure
    const snapshot = await db.collection('members').limit(3).get();
    
    console.log(`📊 Found ${snapshot.docs.length} sample members\n`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`=== Member ${index + 1}: ${data.fullName} ===`);
      console.log(`Document ID: ${doc.id}`);
      console.log(`Member Code: ${data.memberCode}`);
      console.log(`Current Party: ${data.currentParty}`);
      console.log(`Current House: ${data.currentHouse}`);
      console.log(`Current Constituency: ${data.currentConstituency}`);
      console.log(`Is Active: ${data.isActive}`);
      console.log(`Photo URL: ${data.photoUrl || 'null'}`);
      
      if (data.memberships && data.memberships.length > 0) {
        console.log(`\nMemberships (${data.memberships.length}):`);
        data.memberships.slice(0, 2).forEach((membership, idx) => {
          console.log(`  ${idx + 1}. ${JSON.stringify(membership, null, 2)}`);
        });
      }
      
      console.log(`\nAll available fields: ${Object.keys(data).join(', ')}`);
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
    // Check available parties
    console.log('🏛️ Checking available parties...');
    const partiesSnapshot = await db.collection('parties').limit(5).get();
    console.log(`Found ${partiesSnapshot.docs.length} parties:`);
    partiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.showAs} (${data.partyCode})`);
    });
    
    // Check available houses
    console.log('\n🏛️ Checking available houses...');
    const housesSnapshot = await db.collection('houses').limit(5).get();
    console.log(`Found ${housesSnapshot.docs.length} houses:`);
    housesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.showAs} (${data.houseCode}-${data.houseNo})`);
    });
    
    // Check available constituencies
    console.log('\n🗺️ Checking available constituencies...');
    const constituenciesSnapshot = await db.collection('constituencies').limit(5).get();
    console.log(`Found ${constituenciesSnapshot.docs.length} constituencies:`);
    constituenciesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.showAs} (${data.representCode})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking data structure:', error);
  }
}

checkMemberDataStructure();
const admin = require('firebase-admin');

// Initialize Firebase admin
admin.initializeApp({ 
  credential: admin.credential.applicationDefault(),
  projectId: 'parliament-explorer-2024'
});

const db = admin.firestore();

async function checkActiveMembers() {
  console.log('🔍 Checking member active status...');
  
  const snapshot = await db.collection('members').get();
  let activeCount = 0;
  let inactiveCount = 0;
  let undefinedCount = 0;
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.isActive === true) {
      activeCount++;
    } else if (data.isActive === false) {
      inactiveCount++;
    } else {
      undefinedCount++;
    }
  });
  
  console.log('✅ Active members (isActive: true):', activeCount);
  console.log('❌ Inactive members (isActive: false):', inactiveCount);
  console.log('❓ Undefined active status:', undefinedCount);
  console.log('📊 Total members:', activeCount + inactiveCount + undefinedCount);
  
  // Check some sample active members
  console.log('\n🔍 Checking sample members with current house/party data...');
  const sampleQuery = await db.collection('members')
    .where('currentHouse', '!=', null)
    .limit(5)
    .get();
    
  console.log('Members with currentHouse data:');
  sampleQuery.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.fullName}: isActive=${data.isActive}, currentHouse=${data.currentHouse}, currentParty=${data.currentParty}`);
  });
}

checkActiveMembers().catch(console.error);
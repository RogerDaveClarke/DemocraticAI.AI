const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'replace-with-your-project-id'
});

const db = admin.firestore();

async function debugConstituencies() {
  try {
    const snapshot = await db.collection('constituencies').get();
    const all = snapshot.docs.map(doc => doc.data());
    
    console.log(`Total documents: ${all.length}`);
    
    // Check chamber field distribution
    const byType = {};
    const byRepresentType = {};
    
    all.forEach(item => {
      const chamber = item.chamber || 'undefined';
      const representType = item.representType || 'undefined';
      
      byType[chamber] = (byType[chamber] || 0) + 1;
      byRepresentType[representType] = (byRepresentType[representType] || 0) + 1;
    });
    
    console.log('By chamber field:', byType);
    console.log('By representType field:', byRepresentType);
    
    // Show some sample data
    console.log('\nSample dail items:');
    all.filter(item => item.chamber === 'dail').slice(0, 3).forEach(item => {
      console.log(' -', item.showAs, item.chamber, item.representType);
    });
    
    console.log('\nSample seanad items:');
    all.filter(item => item.chamber === 'seanad').slice(0, 3).forEach(item => {
      console.log(' -', item.showAs, item.chamber, item.representType);
    });
    
    console.log('\nItems without chamber field:');
    all.filter(item => !item.chamber).slice(0, 5).forEach(item => {
      console.log(' -', item.showAs, item.representType, 'MISSING CHAMBER');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugConstituencies();
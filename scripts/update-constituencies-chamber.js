const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore
const db = new Firestore();

async function updateConstituenciesWithChamber() {
  try {
    console.log('Starting constituency chamber update...');
    
    // Fetch constituencies from Oireachtas API to get chamber information
    const [dailResponse, seanadResponse] = await Promise.all([
      fetch('https://api.oireachtas.ie/v1/constituencies?chamber=dail&skip=0&limit=50'),
      fetch('https://api.oireachtas.ie/v1/constituencies?skip=0&limit=50')
    ]);
    
    const dailData = await dailResponse.json();
    const seanadData = await seanadResponse.json();
    
    console.log(`Found ${dailData.results?.length || 0} Dáil constituencies`);
    console.log(`Found ${seanadData.results?.length || 0} total constituencies/panels`);
    
    // Process Dáil constituencies
    if (dailData.results) {
      console.log('Updating Dáil constituencies...');
      const batch = db.batch();
      let batchCount = 0;
      
      for (const item of dailData.results) {
        const constituency = item.constituencyOrPanel;
        const docRef = db.collection('constituencies').doc(constituency.representCode);
        
        batch.set(docRef, {
          representCode: constituency.representCode,
          showAs: constituency.showAs,
          chamber: 'dail',
          representType: constituency.representType || 'constituency',
          memberCount: 0 // Will be updated by member ingestion
        }, { merge: true });
        
        batchCount++;
        
        // Firestore batch limit is 500 operations
        if (batchCount >= 450) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} Dáil constituencies`);
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${batchCount} Dáil constituencies`);
      }
    }
    
    // Process Seanad panels (filter out Dáil ones)
    if (seanadData.results) {
      console.log('Updating Seanad panels...');
      const seanadPanels = seanadData.results.filter(item => 
        item.house?.houseCode === 'seanad'
      );
      
      console.log(`Found ${seanadPanels.length} Seanad panels`);
      
      const batch = db.batch();
      let batchCount = 0;
      
      for (const item of seanadPanels) {
        const panel = item.constituencyOrPanel;
        const docRef = db.collection('constituencies').doc(panel.representCode);
        
        batch.set(docRef, {
          representCode: panel.representCode,
          showAs: panel.showAs,
          chamber: 'seanad',
          representType: panel.representType || 'panel',
          memberCount: 0 // Will be updated by member ingestion
        }, { merge: true });
        
        batchCount++;
        
        if (batchCount >= 450) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} Seanad panels`);
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${batchCount} Seanad panels`);
      }
    }
    
    // Verify the updates
    console.log('Verifying updates...');
    const constituenciesSnapshot = await db.collection('constituencies').get();
    const dailCount = constituenciesSnapshot.docs.filter(doc => doc.data().chamber === 'dail').length;
    const seanadCount = constituenciesSnapshot.docs.filter(doc => doc.data().chamber === 'seanad').length;
    const noChainberCount = constituenciesSnapshot.docs.filter(doc => !doc.data().chamber).length;
    
    console.log(`\nUpdate Summary:`);
    console.log(`- Dáil constituencies: ${dailCount}`);
    console.log(`- Seanad panels: ${seanadCount}`);
    console.log(`- Missing chamber field: ${noChainberCount}`);
    console.log(`- Total documents: ${constituenciesSnapshot.docs.length}`);
    
    console.log('\nConstituency chamber update completed successfully!');
    
  } catch (error) {
    console.error('Error updating constituencies:', error);
    process.exit(1);
  }
}

// Run the update
updateConstituenciesWithChamber();
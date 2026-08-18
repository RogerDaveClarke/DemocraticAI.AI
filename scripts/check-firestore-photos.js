const { Firestore } = require('@google-cloud/firestore');

async function checkFirestorePhotos() {
  try {
    const db = new Firestore();
    
    console.log('🔍 Checking Firestore for photo URLs...');
    
    // Get first 10 members from Firestore directly
    const snapshot = await db.collection('members').limit(10).get();
    
    console.log(`📊 Found ${snapshot.docs.length} members in Firestore\n`);
    
    let hasPhotoCount = 0;
    let noPhotoCount = 0;
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.fullName} (${doc.id})`);
      console.log(`   photoUrl: ${data.photoUrl || 'null'}`);
      
      if (data.photoUrl) {
        hasPhotoCount++;
      } else {
        noPhotoCount++;
      }
      console.log();
    });
    
    console.log(`📈 Summary:`);
    console.log(`   ✅ Members with photos: ${hasPhotoCount}`);
    console.log(`   ❌ Members without photos: ${noPhotoCount}`);
    
    // Also check specific member we know should have a photo
    console.log('\n🔍 Checking specific member with photo...');
    const ciaranDoc = await db.collection('members').doc('Ciarán-Ahern.D.2024-11-29').get();
    
    if (ciaranDoc.exists) {
      const data = ciaranDoc.data();
      console.log(`Member: ${data.fullName}`);
      console.log(`Photo URL: ${data.photoUrl}`);
      console.log(`Data keys: ${Object.keys(data)}`);
    } else {
      console.log('Ciarán Ahern document not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking Firestore:', error);
  }
}

checkFirestorePhotos();
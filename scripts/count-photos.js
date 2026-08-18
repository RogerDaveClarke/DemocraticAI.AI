const { Firestore } = require('@google-cloud/firestore');

async function countMembersWithPhotos() {
  try {
    const db = new Firestore();
    
    console.log('📊 Counting members with and without photos...');
    
    // Get all members
    const snapshot = await db.collection('members').get();
    
    let withPhotos = 0;
    let withoutPhotos = 0;
    let exampleWithPhoto = null;
    let exampleWithoutPhoto = null;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.photoUrl) {
        withPhotos++;
        if (!exampleWithPhoto) {
          exampleWithPhoto = { name: data.fullName, url: data.photoUrl };
        }
      } else {
        withoutPhotos++;
        if (!exampleWithoutPhoto) {
          exampleWithoutPhoto = { name: data.fullName, id: doc.id };
        }
      }
    });
    
    console.log(`\n📈 Results:`);
    console.log(`   Total members: ${snapshot.docs.length}`);
    console.log(`   ✅ With photos: ${withPhotos}`);
    console.log(`   ❌ Without photos: ${withoutPhotos}`);
    
    if (exampleWithPhoto) {
      console.log(`\n✅ Example with photo:`);
      console.log(`   Name: ${exampleWithPhoto.name}`);
      console.log(`   URL: ${exampleWithPhoto.url}`);
    }
    
    if (exampleWithoutPhoto) {
      console.log(`\n❌ Example without photo:`);
      console.log(`   Name: ${exampleWithoutPhoto.name}`);
      console.log(`   ID: ${exampleWithoutPhoto.id}`);
    }
    
  } catch (error) {
    console.error('❌ Error counting photos:', error);
  }
}

countMembersWithPhotos();
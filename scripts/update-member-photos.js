const { Firestore } = require('@google-cloud/firestore');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Initialize Firestore
const db = new Firestore();

function safePhotoFilename(memberCode) {
  const filename = `${memberCode}.jpg`;
  if (!/^[A-Za-z0-9._-]+\.jpg$/.test(filename)) {
    throw new Error(`Invalid member photo filename: ${filename}`);
  }
  return filename;
}

// Create photos directory if it doesn't exist
const photosDir = path.join(__dirname, 'member-photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir);
}

async function downloadMemberPhoto(memberCode, photoUrl) {
  try {
    if (!photoUrl) {
      return null;
    }
    
    const response = await fetch(photoUrl);
    if (!response.ok) {
      console.log(`   ⚠️ Failed to download photo: ${response.status}`);
      return null;
    }
    
    const buffer = await response.buffer();
    const filename = safePhotoFilename(memberCode);
    const filepath = path.join(photosDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    console.log(`   ✅ Downloaded: ${filename} (${buffer.length} bytes)`);
    
    return photoUrl;
  } catch (error) {
    console.log(`   ❌ Error downloading photo: ${error.message}`);
    return null;
  }
}

async function updateMembersWithPhotos() {
  try {
    console.log('🔄 Updating all members with photo URLs...');
    
    // Get all members without photos (handle both null and empty string cases)
    const snapshot = await db.collection('members').get();
    const membersWithoutPhotos = snapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.photoUrl || data.photoUrl === '';
    });
    console.log(`📊 Found ${membersWithoutPhotos.length} members without photos\n`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of membersWithoutPhotos) {
      const data = doc.data();
      const memberCode = data.memberCode;
      
      if (!memberCode) {
        console.log(`⚠️ Skipping member without memberCode: ${data.fullName}`);
        continue;
      }
      
      console.log(`Processing ${processed + 1}/${membersWithoutPhotos.length}: ${data.fullName}`);
      
      // Construct photo URL
      const photoUrl = `https://data.oireachtas.ie/ie/oireachtas/member/id/${memberCode}/image/thumb`;
      console.log(`   Photo URL: ${photoUrl}`);
      
      // Download and verify photo
      const downloadedUrl = await downloadMemberPhoto(memberCode, photoUrl);
      
      if (downloadedUrl) {
        // Update Firestore document
        batch.update(doc.ref, { photoUrl: downloadedUrl });
        batchCount++;
        successful++;
        
        // Commit batch if it reaches 500 operations (Firestore limit)
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`   💾 Committed batch of ${batchCount} updates`);
          const newBatch = db.batch();
          Object.assign(batch, newBatch);
          batchCount = 0;
        }
      } else {
        failed++;
      }
      
      processed++;
      
      // Add a small delay to avoid overwhelming the API
      if (processed % 10 === 0) {
        console.log(`📊 Progress: ${processed}/${membersWithoutPhotos.length} - Success: ${successful}, Failed: ${failed}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay every 10 requests
      }
    }
    
    // Commit final batch if there are remaining operations
    if (batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\n🎉 Photo update completed!`);
    console.log(`📊 Final Summary:`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   ✅ Successful downloads: ${successful}`);
    console.log(`   ❌ Failed downloads: ${failed}`);
    
  } catch (error) {
    console.error('❌ Error updating photos:', error);
  }
}

updateMembersWithPhotos();
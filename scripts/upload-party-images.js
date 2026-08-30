const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'replace-with-your-project-id'
});

const db = admin.firestore();
const storage = new Storage({
  projectId: 'replace-with-your-project-id'
});

const bucketName = 'myparliament-images';
const bucket = storage.bucket(bucketName);

// Mapping between party codes and image files
const partyImageMapping = {
  'Fianna_Fáil': 'Fine Fail.svg', // Note: this seems to be a typo in the filename, should be Fianna Fáil
  'Fine_Gael': 'Fine Gael.webp',
  'Independent_Alliance': 'Independent Alliance.png',
  'Labour_Party': 'Labour Party.png',
  'People_Before_Profit_Alliance': 'People Before Profit.png',
  'Sinn_Féin': 'Sinn Fein.jpeg',
  'Social_Democrats': 'social democrats.png',
  'Socialist_Party': 'socialist party.jpg',
  // Add mapping for parties without images - they'll get TBD
  'Anti-Austerity_Alliance_People_Before_Profit': 'TBD.svg',
  'Independent': 'TBD.svg',
  'Renua': 'TBD.svg',
  'Workers_and_Unemployed_Action': 'TBD.svg'
};

async function uploadPartyImages() {
  console.log('🚀 Starting party image upload process...\n');
  
  try {
    const imagesDir = path.join(__dirname, '..', 'images');
    
    // Get all parties from Firestore
    const partiesSnapshot = await db.collection('parties').get();
    const parties = partiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${parties.length} parties in Firestore`);
    console.log(`Available image files:`, fs.readdirSync(imagesDir));
    console.log('');
    
    let uploadedCount = 0;
    let updatedCount = 0;
    
    for (const party of parties) {
      console.log(`Processing party: ${party.showAs} (${party.partyCode})`);
      
      // Find the matching image file
      let imageFile = partyImageMapping[party.partyCode];
      
      // If no specific mapping, try to find by party name variations
      if (!imageFile) {
        const possibleNames = [
          `${party.showAs}.png`,
          `${party.showAs}.jpg`,
          `${party.showAs}.jpeg`,
          `${party.showAs}.svg`,
          `${party.showAs}.webp`,
          `${party.partyCode.replace(/_/g, ' ')}.png`,
          `${party.partyCode.replace(/_/g, ' ')}.jpg`,
          `${party.partyCode.replace(/_/g, ' ')}.jpeg`,
          `${party.partyCode.replace(/_/g, ' ')}.svg`,
          `${party.partyCode.replace(/_/g, ' ')}.webp`
        ];
        
        for (const possibleName of possibleNames) {
          const filePath = path.join(imagesDir, possibleName);
          if (fs.existsSync(filePath)) {
            imageFile = possibleName;
            break;
          }
        }
      }
      
      // Default to TBD if no image found
      if (!imageFile) {
        imageFile = 'TBD.svg';
        console.log(`  ⚠️  No specific image found, using TBD placeholder`);
      }
      
      const localImagePath = path.join(imagesDir, imageFile);
      
      if (!fs.existsSync(localImagePath)) {
        console.log(`  ❌ Image file not found: ${imageFile}`);
        continue;
      }
      
      try {
        // Generate a clean filename for Cloud Storage
        const fileExtension = path.extname(imageFile);
        const cleanFileName = `party-logos/${party.partyCode}${fileExtension}`;
        
        // Upload to Cloud Storage
        const file = bucket.file(cleanFileName);
        
        // Check if file already exists
        const [exists] = await file.exists();
        
        if (!exists) {
          await file.save(fs.readFileSync(localImagePath), {
            metadata: {
              contentType: getContentType(fileExtension),
              metadata: {
                originalName: imageFile,
                partyCode: party.partyCode,
                uploadedAt: new Date().toISOString()
              }
            }
          });
          
          // Make the file public
          await file.makePublic();
          uploadedCount++;
          console.log(`  ✅ Uploaded: ${cleanFileName}`);
        } else {
          console.log(`  ℹ️  Already exists: ${cleanFileName}`);
        }
        
        // Generate public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${cleanFileName}`;
        
        // Update party document in Firestore
        await db.collection('parties').doc(party.id).update({
          imageUrl: publicUrl,
          imageFileName: cleanFileName,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        updatedCount++;
        console.log(`  ✅ Updated Firestore with image URL`);
        
      } catch (error) {
        console.log('  ❌ Failed to process image', imageFile, error.message);
      }
      
      console.log('');
    }
    
    console.log(`\n🎉 Upload process completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Images uploaded: ${uploadedCount}`);
    console.log(`   - Parties updated: ${updatedCount}`);
    console.log(`   - Total parties processed: ${parties.length}`);
    
  } catch (error) {
    console.error('❌ Error during upload process:', error);
  }
}

function getContentType(extension) {
  const contentTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

// Run the upload process
uploadPartyImages().catch(console.error);
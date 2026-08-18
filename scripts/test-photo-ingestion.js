/**
 * Run photo ingestion for a small subset of members
 */

const OireachtasIngester = require('./ingest-data.js');

async function runPhotoIngestion() {
  try {
    console.log('🚀 Starting photo ingestion test...');
    
    const ingester = new OireachtasIngester();
    
    // Fetch just a few members to test photo downloading
    console.log('📥 Fetching first 10 members for photo test...');
    
    const allMembers = await ingester.paginatedFetch('members');
    const testMembers = allMembers.slice(0, 10);
    
    console.log(`Processing ${testMembers.length} members for photo testing...`);
    
    const membersWithPhotos = [];
    
    for (const member of testMembers) {
      if (member.member) {
        console.log(`\n--- Processing ${member.member.fullName} ---`);
        
        const photoUrl = await ingester.downloadMemberPhoto(
          member.member.memberCode,
          member.member.fullName
        );
        
        const memberWithPhoto = {
          ...member.member,
          photoUrl: photoUrl
        };
        
        membersWithPhotos.push({ member: memberWithPhoto });
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`Total members processed: ${membersWithPhotos.length}`);
    
    const withPhotos = membersWithPhotos.filter(m => m.member.photoUrl);
    const withoutPhotos = membersWithPhotos.filter(m => !m.member.photoUrl);
    
    console.log(`Members with photos: ${withPhotos.length}`);
    console.log(`Members without photos: ${withoutPhotos.length}`);
    
    if (withPhotos.length > 0) {
      console.log('\n✅ Members with photos:');
      withPhotos.forEach(m => {
        console.log(`  - ${m.member.fullName}: ${m.member.photoUrl}`);
      });
    }
    
    if (withoutPhotos.length > 0) {
      console.log('\n❌ Members without photos:');
      withoutPhotos.forEach(m => {
        console.log(`  - ${m.member.fullName}`);
      });
    }
    
    // Now update these members in Firestore
    console.log('\n💾 Updating Firestore with photo URLs...');
    await ingester.storeBatch('members', membersWithPhotos, 'memberCode');
    
    console.log('🎉 Photo ingestion test completed successfully!');
    
  } catch (error) {
    console.error('❌ Photo ingestion test failed:', error.message);
  }
}

runPhotoIngestion();
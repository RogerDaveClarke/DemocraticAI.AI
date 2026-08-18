const fetch = require('node-fetch');

async function testApiPhotos() {
  try {
    console.log('🧪 Testing API response for photo URLs...');
    
    const response = await fetch('http://localhost:8080/api/members?limit=10');
    const data = await response.json();
    
    console.log(`📊 Total members returned: ${data.members.length}`);
    console.log();
    
    let hasPhotoCount = 0;
    let noPhotoCount = 0;
    
    data.members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.fullName}`);
      console.log(`   photoUrl: ${member.photoUrl || 'null'}`);
      
      if (member.photoUrl) {
        hasPhotoCount++;
      } else {
        noPhotoCount++;
      }
      console.log();
    });
    
    console.log(`📈 Summary:`);
    console.log(`   ✅ Members with photos: ${hasPhotoCount}`);
    console.log(`   ❌ Members without photos: ${noPhotoCount}`);
    
    // Test a specific member we know should have a photo
    console.log('\n🔍 Testing specific member with photo...');
    const ciaranResponse = await fetch('http://localhost:8080/api/members/Ciarán-Ahern.D.2024-11-29');
    const ciaranData = await ciaranResponse.json();
    
    if (ciaranData.member) {
      console.log(`Member: ${ciaranData.member.fullName}`);
      console.log(`Photo URL: ${ciaranData.member.photoUrl}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testApiPhotos();
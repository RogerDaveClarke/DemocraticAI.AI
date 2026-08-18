/**
 * Test the new photo download approach
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

async function testDirectPhotoDownload() {
  try {
    // Create photos directory
    const photoDir = path.join(__dirname, 'member-photos');
    await mkdir(photoDir, { recursive: true });
    
    // Test with some member codes from our database
    const testMembers = [
      { memberCode: "Ciarán-Ahern.D.2024-11-29", fullName: "Ciarán Ahern" },
      { memberCode: "William-Aird.D.2024-11-29", fullName: "William Aird" },
      { memberCode: "Ivana-Bacik.S.2007-07-23", fullName: "Ivana Bacik" }
    ];
    
    for (const member of testMembers) {
      console.log(`\n--- Testing ${member.fullName} ---`);
      
      const photoUrl = `https://data.oireachtas.ie/ie/oireachtas/member/id/${member.memberCode}/image/thumb`;
      console.log(`Photo URL: ${photoUrl}`);
      
      try {
        const photoResponse = await fetch(photoUrl);
        console.log(`Response status: ${photoResponse.status}`);
        
        if (!photoResponse.ok) {
          console.log(`❌ No photo available for ${member.fullName}`);
          continue;
        }
        
        const photoBuffer = await photoResponse.buffer();
        console.log(`Photo size: ${photoBuffer.length} bytes`);
        
        if (photoBuffer.length < 1000) {
          console.log(`❌ Photo too small, likely not found`);
          continue;
        }
        
        const filename = `${member.memberCode}.jpg`;
        const filepath = path.join(photoDir, filename);
        
        await writeFile(filepath, photoBuffer);
        
        console.log(`✅ Successfully downloaded: ${filename}`);
        
      } catch (error) {
        console.log(`❌ Error downloading photo: ${error.message}`);
      }
      
      // Be respectful - add delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDirectPhotoDownload();
/**
 * Simple photo scraping test
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

async function testPhotoScraping() {
  try {
    // Create photos directory
    const photoDir = path.join(__dirname, 'member-photos');
    await mkdir(photoDir, { recursive: true });
    
    // Test with a known member
    const testMember = {
      fullName: "Leo Varadkar",
      memberCode: "Leo-Varadkar.D.2007-06-14"
    };
    
    console.log(`Testing photo scraping for ${testMember.fullName}...`);
    
    // Test different URL patterns
    const urlPatterns = [
      `https://www.oireachtas.ie/en/members/tds/`,
      `https://www.oireachtas.ie/en/members/`,
      `https://www.oireachtas.ie/en/members/member/leo-varadkar/`,
      `https://www.oireachtas.ie/en/members/member/varadkar-leo/`,
      `https://www.oireachtas.ie/en/tds/leo-varadkar/`,
      `https://www.oireachtas.ie/en/members/td/leo-varadkar/`
    ];
    
    for (const testUrl of urlPatterns) {
      console.log(`\nTrying URL: ${testUrl}`);
      
      try {
        const response = await fetch(testUrl);
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const html = await response.text();
          console.log(`Got HTML response, length: ${html.length}`);
          
          // Look for Leo Varadkar specifically
          if (html.toLowerCase().includes('leo varadkar')) {
            console.log('✅ Found Leo Varadkar on this page!');
            
            // Look for image patterns around his name
            const nameIndex = html.toLowerCase().indexOf('leo varadkar');
            const contextHtml = html.substring(Math.max(0, nameIndex - 1000), nameIndex + 1000);
            
            const imageMatches = contextHtml.match(/src="([^"]*\.(jpg|jpeg|png|webp))"/gi);
            if (imageMatches) {
              console.log('Images near Leo Varadkar:');
              imageMatches.forEach(match => console.log(`  - ${match}`));
            }
          }
          
          // Also check if this is a listing page
          if (html.toLowerCase().includes('members') || html.toLowerCase().includes('tds')) {
            console.log('This appears to be a members listing page');
          }
        }
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
    }
    
    // Look for image patterns
    const imagePatterns = [
      /src="([^"]*member[^"]*\.(jpg|jpeg|png|webp))"/gi,
      /src="([^"]*photo[^"]*\.(jpg|jpeg|png|webp))"/gi,
      /src="([^"]*images[^"]*\.(jpg|jpeg|png|webp))"/gi
    ];
    
    let photoUrl = null;
    
    for (const pattern of imagePatterns) {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`Found ${matches.length} potential photo matches:`);
        matches.forEach(match => console.log(`  - ${match}`));
        
        const photoMatch = matches[0].match(/src="([^"]*)"/);
        if (photoMatch) {
          photoUrl = photoMatch[1];
          break;
        }
      }
    }
    
    if (!photoUrl) {
      console.log('No photo URL found in HTML');
      // Let's look at what images we do have
      const allImages = html.match(/src="([^"]*\.(jpg|jpeg|png|webp))"/gi);
      if (allImages) {
        console.log('All images found:');
        allImages.slice(0, 10).forEach(img => console.log(`  - ${img}`));
      }
      return;
    }
    
    if (photoUrl.startsWith('/')) {
      photoUrl = `https://www.oireachtas.ie${photoUrl}`;
    }
    
    console.log(`Found photo URL: ${photoUrl}`);
    
    // Download the photo
    const photoResponse = await fetch(photoUrl);
    if (!photoResponse.ok) {
      console.log(`Failed to download photo: ${photoResponse.status}`);
      return;
    }
    
    const photoBuffer = await photoResponse.buffer();
    const extension = path.extname(photoUrl) || '.jpg';
    const filename = `${testMember.memberCode}${extension}`;
    const filepath = path.join(photoDir, filename);
    
    await writeFile(filepath, photoBuffer);
    
    console.log(`✅ Successfully downloaded photo: ${filename}`);
    console.log(`File size: ${photoBuffer.length} bytes`);
    
  } catch (error) {
    console.error('Error in photo scraping test:', error.message);
  }
}

testPhotoScraping();
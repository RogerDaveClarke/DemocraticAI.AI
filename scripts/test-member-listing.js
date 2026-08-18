/**
 * Test scraping member profiles from the listing page
 */

const fetch = require('node-fetch');

async function testMemberListing() {
  try {
    console.log('Fetching members listing page...');
    
    const response = await fetch('https://www.oireachtas.ie/en/members/tds/');
    if (!response.ok) {
      console.log(`Failed to fetch listing: ${response.status}`);
      return;
    }
    
    const html = await response.text();
    console.log(`Got HTML response, length: ${html.length}`);
    
    // Look for member profile links
    const memberLinkPattern = /href="([^"]*\/members\/[^"]*)"[^>]*>([^<]*)/gi;
    const matches = [...html.matchAll(memberLinkPattern)];
    
    console.log(`Found ${matches.length} potential member links:`);
    
    matches.slice(0, 10).forEach((match, index) => {
      const [fullMatch, url, text] = match;
      console.log(`${index + 1}. URL: ${url} | Text: ${text.trim()}`);
    });
    
    // Look for a specific pattern that might include images
    const memberCardPattern = /<div[^>]*member[^>]*>[\s\S]*?<\/div>/gi;
    const cardMatches = [...html.matchAll(memberCardPattern)];
    
    if (cardMatches.length > 0) {
      console.log(`\nFound ${cardMatches.length} member card patterns`);
      console.log('First card HTML:');
      console.log(cardMatches[0][0].substring(0, 500) + '...');
    }
    
    // Look for any image with member or photo in the path
    const imagePattern = /<img[^>]*src="([^"]*(?:member|photo|thumb)[^"]*)"[^>]*>/gi;
    const imageMatches = [...html.matchAll(imagePattern)];
    
    console.log(`\nFound ${imageMatches.length} images with member/photo patterns:`);
    imageMatches.slice(0, 5).forEach((match, index) => {
      console.log(`${index + 1}. ${match[1]}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMemberListing();
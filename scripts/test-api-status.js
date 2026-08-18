// Quick test to check active status via API
const fetch = require('node-fetch');

async function testActiveStatus() {
  console.log('🔍 Testing API responses...');
  
  try {
    // Test all members
    const allResponse = await fetch('http://localhost:8080/api/members?active_only=false&limit=5');
    const allData = await allResponse.json();
    
    console.log('\n📊 All members (active_only=false):');
    console.log(`Total: ${allData.total}, Returned: ${allData.members.length}`);
    console.log('Sample members:');
    allData.members.forEach(member => {
      console.log(`- ${member.fullName}: isActive=${member.isActive}, currentParty=${member.currentParty}, currentHouse=${member.currentHouse}`);
    });
    
    // Test active only
    const activeResponse = await fetch('http://localhost:8080/api/members?active_only=true&limit=5');
    const activeData = await activeResponse.json();
    
    console.log('\n✅ Active members only (active_only=true):');
    console.log(`Total: ${activeData.total}, Returned: ${activeData.members.length}`);
    console.log('Sample members:');
    activeData.members.forEach(member => {
      console.log(`- ${member.fullName}: isActive=${member.isActive}, currentParty=${member.currentParty}, currentHouse=${member.currentHouse}`);
    });
    
    // Test party filtering
    console.log('\n🔍 Testing party filtering...');
    const partyResponse = await fetch('http://localhost:8080/api/members?party=Fine Gael&limit=3&active_only=false');
    const partyData = await partyResponse.json();
    
    console.log('Fine Gael members:');
    console.log(`Total: ${partyData.total}, Returned: ${partyData.members.length}`);
    partyData.members.forEach(member => {
      console.log(`- ${member.fullName}: currentParty=${member.currentParty}, isActive=${member.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testActiveStatus();
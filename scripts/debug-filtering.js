// Test to check if filtering is actually working by examining specific members
const fetch = require('node-fetch');

async function debugFiltering() {
  console.log('🔍 Debugging API filtering...\n');
  
  try {
    // First, get a few members and their actual data
    console.log('1. Getting sample member data:');
    const sampleResponse = await fetch('http://localhost:8080/api/members?limit=10&active_only=false');
    const sampleData = await sampleResponse.json();
    
    console.log(`Total members: ${sampleData.total}`);
    console.log('Sample members and their parties:');
    sampleData.members.forEach((member, i) => {
      console.log(`  ${i+1}. ${member.fullName}: party=${member.currentParty}, active=${member.isActive}`);
    });
    
    // Find a specific party to test with
    const testParty = sampleData.members.find(m => m.currentParty)?.currentParty;
    console.log(`\n2. Testing filtering for party: ${testParty}`);
    
    if (testParty) {
      const partyResponse = await fetch(`http://localhost:8080/api/members?party=${testParty}&limit=5&active_only=false`);
      const partyData = await partyResponse.json();
      
      console.log(`Total members for ${testParty}: ${partyData.total}`);
      console.log('Returned members:');
      partyData.members.forEach((member, i) => {
        const isCorrectParty = member.currentParty === testParty;
        console.log(`  ${i+1}. ${member.fullName}: party=${member.currentParty} ${isCorrectParty ? '✅' : '❌'}`);
      });
    }
    
    // Test active filtering
    console.log('\n3. Testing active filtering:');
    const activeResponse = await fetch('http://localhost:8080/api/members?active_only=true&limit=5');
    const activeData = await activeResponse.json();
    
    console.log(`Total active members: ${activeData.total}`);
    console.log('Returned members:');
    activeData.members.forEach((member, i) => {
      const isCorrectActive = member.isActive === true;
      console.log(`  ${i+1}. ${member.fullName}: isActive=${member.isActive} ${isCorrectActive ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugFiltering();
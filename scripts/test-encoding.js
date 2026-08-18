// Test the exact query parameters being sent
const fetch = require('node-fetch');

async function testQueryParams() {
  console.log('🔍 Testing query parameter encoding...\n');
  
  try {
    // Test with different encodings
    const tests = [
      { name: 'Original', value: 'Sinn_Féin' },
      { name: 'URL Encoded', value: encodeURIComponent('Sinn_Féin') },
      { name: 'Without accent', value: 'Sinn_Fein' }
    ];
    
    for (const test of tests) {
      console.log(`Testing ${test.name}: "${test.value}"`);
      const url = `http://localhost:8080/api/members?party=${test.value}&limit=3&active_only=false`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Total: ${data.total}, Returned: ${data.members.length}`);
      console.log('Returned members:');
      data.members.forEach((member, i) => {
        console.log(`  ${i+1}. ${member.fullName}: party=${member.currentParty}`);
      });
      
      if (data.members.length > 0 && data.members.every(m => m.currentParty === 'Sinn_Féin')) {
        console.log('✅ All returned members match the filter!');
      } else if (data.members.length === 0) {
        console.log('⚠️ No members returned');
      } else {
        console.log('❌ Some returned members do not match the filter');
      }
      console.log('---');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQueryParams();
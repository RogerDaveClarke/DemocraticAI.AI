// Test what values we're actually getting for party parameter
const fetch = require('node-fetch');

async function testParameterValues() {
  console.log('🔍 Testing parameter evaluation...\n');
  
  try {
    // Let's test various ways to send the party parameter
    const tests = [
      'Sinn_Féin',
      'Fine_Gael', 
      'Fianna_Fáil'
    ];
    
    for (const testParty of tests) {
      console.log(`Testing party: "${testParty}"`);
      
      // Simulate the same logic as the API
      const party = testParty;
      const activeOnly = false;
      
      console.log(`  party: "${party}" (type: ${typeof party}, length: ${party?.length}, truthy: ${!!party})`);
      console.log(`  activeOnly: ${activeOnly} (type: ${typeof activeOnly})`);
      
      // Test the conditions
      if (party) {
        console.log(`  ✅ if(party) condition would be true`);
      } else {
        console.log(`  ❌ if(party) condition would be false`);
      }
      
      if (activeOnly) {
        console.log(`  ✅ if(activeOnly) condition would be true`);
      } else {
        console.log(`  ❌ if(activeOnly) condition would be false`);
      }
      
      console.log('---');
    }
    
    // Test with actual API call to see response
    console.log('Testing actual API call:');
    const response = await fetch('http://localhost:8080/api/members?party=Fine_Gael&limit=1&active_only=false');
    const data = await response.json();
    console.log(`API returned: total=${data.total}, first member=${data.members[0]?.fullName}, party=${data.members[0]?.currentParty}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testParameterValues();
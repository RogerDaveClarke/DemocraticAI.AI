const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8080/api';

async function testFiltering() {
  console.log('🧪 Testing API filtering functionality...\n');
  
  try {
    // 1. Test basic members endpoint
    console.log('1. Testing basic members endpoint...');
    const basicResponse = await fetch(`${API_BASE}/members?limit=5`);
    const basicData = await basicResponse.json();
    
    console.log(`   Total members: ${basicData.total}`);
    console.log(`   Returned: ${basicData.members.length}`);
    console.log(`   Sample member: ${basicData.members[0]?.fullName}`);
    console.log(`   Has current fields: Party=${!!basicData.members[0]?.currentParty}, House=${!!basicData.members[0]?.currentHouse}, Active=${basicData.members[0]?.isActive}`);
    console.log('');
    
    // 2. Test filters endpoint
    console.log('2. Testing filters endpoint...');
    const filtersResponse = await fetch(`${API_BASE}/filters`);
    const filtersData = await filtersResponse.json();
    
    console.log(`   Parties available: ${filtersData.parties.length}`);
    console.log(`   Houses available: ${filtersData.houses.length}`);
    console.log(`   Constituencies available: ${filtersData.constituencies.length}`);
    
    // Pick test values
    const testParty = filtersData.parties.find(p => p.memberCount > 5)?.partyCode;
    const testHouse = filtersData.houses.find(h => h.memberCount > 10)?.houseCode + '-' + filtersData.houses.find(h => h.memberCount > 10)?.houseNo;
    const testConstituency = filtersData.constituencies.find(c => c.memberCount > 2)?.representCode;
    
    console.log(`   Test party: ${testParty}`);
    console.log(`   Test house: ${testHouse}`);
    console.log(`   Test constituency: ${testConstituency}`);
    console.log('');
    
    // 3. Test party filtering
    if (testParty) {
      console.log('3. Testing party filtering...');
      const partyResponse = await fetch(`${API_BASE}/members?party=${testParty}&limit=10`);
      const partyData = await partyResponse.json();
      
      console.log(`   Members in ${testParty}: ${partyData.total}`);
      console.log(`   Returned: ${partyData.members.length}`);
      
      // Verify all returned members have the correct party
      const incorrectParty = partyData.members.filter(m => m.currentParty !== testParty);
      if (incorrectParty.length > 0) {
        console.log(`   ❌ ERROR: ${incorrectParty.length} members with wrong party`);
      } else {
        console.log(`   ✅ All members have correct party`);
      }
      console.log('');
    }
    
    // 4. Test house filtering
    if (testHouse) {
      console.log('4. Testing house filtering...');
      const houseResponse = await fetch(`${API_BASE}/members?house=${testHouse}&limit=10`);
      const houseData = await houseResponse.json();
      
      console.log(`   Members in ${testHouse}: ${houseData.total}`);
      console.log(`   Returned: ${houseData.members.length}`);
      
      // Verify all returned members have the correct house
      const incorrectHouse = houseData.members.filter(m => m.currentHouse !== testHouse);
      if (incorrectHouse.length > 0) {
        console.log(`   ❌ ERROR: ${incorrectHouse.length} members with wrong house`);
      } else {
        console.log(`   ✅ All members have correct house`);
      }
      console.log('');
    }
    
    // 5. Test constituency filtering
    if (testConstituency) {
      console.log('5. Testing constituency filtering...');
      const constituencyResponse = await fetch(`${API_BASE}/members?constituency=${testConstituency}&limit=10`);
      const constituencyData = await constituencyResponse.json();
      
      console.log(`   Members in ${testConstituency}: ${constituencyData.total}`);
      console.log(`   Returned: ${constituencyData.members.length}`);
      
      // Verify all returned members have the correct constituency
      const incorrectConstituency = constituencyData.members.filter(m => m.currentConstituency !== testConstituency);
      if (incorrectConstituency.length > 0) {
        console.log(`   ❌ ERROR: ${incorrectConstituency.length} members with wrong constituency`);
      } else {
        console.log(`   ✅ All members have correct constituency`);
      }
      console.log('');
    }
    
    // 6. Test active only filtering
    console.log('6. Testing active filtering...');
    const activeResponse = await fetch(`${API_BASE}/members?active_only=true&limit=20`);
    const activeData = await activeResponse.json();
    
    console.log(`   Active members: ${activeData.total}`);
    console.log(`   Returned: ${activeData.members.length}`);
    
    // Verify all returned members are active
    const inactiveMembers = activeData.members.filter(m => !m.isActive);
    if (inactiveMembers.length > 0) {
      console.log(`   ❌ ERROR: ${inactiveMembers.length} inactive members returned`);
    } else {
      console.log(`   ✅ All members are active`);
    }
    
    // Show some active members
    console.log('   Sample active members:');
    activeData.members.slice(0, 5).forEach(m => {
      console.log(`     - ${m.fullName} (${m.currentParty || 'No party'}, ${m.currentHouse || 'No house'})`);
    });
    console.log('');
    
    // 7. Test combined filtering
    if (testParty && testHouse) {
      console.log('7. Testing combined filtering...');
      const combinedResponse = await fetch(`${API_BASE}/members?party=${testParty}&active_only=true&limit=10`);
      const combinedData = await combinedResponse.json();
      
      console.log(`   Active ${testParty} members: ${combinedData.total}`);
      console.log(`   Returned: ${combinedData.members.length}`);
      
      // Verify filtering worked
      const wrongFilter = combinedData.members.filter(m => m.currentParty !== testParty || !m.isActive);
      if (wrongFilter.length > 0) {
        console.log(`   ❌ ERROR: ${wrongFilter.length} members don't match combined filter`);
      } else {
        console.log(`   ✅ Combined filtering works correctly`);
      }
    }
    
    console.log('\n🎉 Filtering test completed!');
    
  } catch (error) {
    console.error('❌ Error testing filtering:', error);
  }
}

testFiltering();
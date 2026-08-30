/**
 * Local Data Ingestion Script for Oireachtas Data
 * Populates Firestore with members, parties, houses, and constituencies
 */

const { Firestore } = require('@google-cloud/firestore');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

function safePhotoFilename(memberCode) {
  const filename = `${memberCode}.jpg`;
  if (!/^[A-Za-z0-9._-]+\.jpg$/.test(filename)) {
    throw new Error(`Invalid member photo filename: ${filename}`);
  }
  return filename;
}

// Initialize Firestore
const firestore = new Firestore({
  projectId: 'replace-with-your-project-id'
});

class OireachtasIngester {
  constructor() {
    this.baseUrl = 'https://api.oireachtas.ie/v1';
    this.batchSize = 500; // Firestore batch limit
    this.photoDir = path.join(__dirname, 'member-photos');
    this.ensurePhotoDirectory();
  }

  async ensurePhotoDirectory() {
    try {
      await mkdir(this.photoDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async downloadMemberPhoto(memberCode, fullName) {
    try {
      // Use the direct Oireachtas image API
      const photoUrl = `https://data.oireachtas.ie/ie/oireachtas/member/id/${memberCode}/image/thumb`;
      
      console.log(`Downloading photo for ${fullName}: ${photoUrl}`);
      
      const photoResponse = await fetch(photoUrl);
      if (!photoResponse.ok) {
        console.log(`❌ No photo available for ${fullName} (${photoResponse.status})`);
        return null;
      }
      
      const photoBuffer = await photoResponse.buffer();
      
      // Check if it's actually an image (not an error page)
      if (photoBuffer.length < 1000) {
        console.log(`❌ Photo too small for ${fullName}, likely not found`);
        return null;
      }
      
      const filename = safePhotoFilename(memberCode);
      const filepath = `${this.photoDir}${path.sep}${filename}`;
      
      await writeFile(filepath, photoBuffer);
      
      console.log(`✅ Downloaded photo for ${fullName}: ${filename} (${photoBuffer.length} bytes)`);
      
      // Return the photo URL for storage in database
      return photoUrl;
      
    } catch (error) {
      console.error('Error downloading photo for', fullName, error.message);
      return null;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Add delay to be respectful to the API
        await this.delay(500);
        
        return data;
      } catch (error) {
        console.error('Attempt', i + 1, 'failed:', error.message);
        if (i === maxRetries - 1) throw error;
        await this.delay(2000); // Wait 2 seconds before retry
      }
    }
  }

  async paginatedFetch(endpoint, params = {}) {
    const allResults = [];
    let skip = 0;
    const limit = 50; // API max limit
    
    while (true) {
      const queryParams = new URLSearchParams({
        ...params,
        limit: limit.toString(),
        skip: skip.toString()
      });
      
      const url = `${this.baseUrl}/${endpoint}?${queryParams}`;
      
      try {
        const data = await this.fetchWithRetry(url);
        
        // Handle different response structures
        let results = [];
        if (data.results) results = data.results;
        else if (data.houses) results = data.houses;
        else if (data.parties) results = data.parties;
        else if (data.constituencies) results = data.constituencies;
        else {
          console.warn(`Unknown response structure for ${endpoint}`);
          break;
        }
        
        if (!results || results.length === 0) break;
        
        allResults.push(...results);
        console.log(`Fetched ${results.length} items from ${endpoint} (total: ${allResults.length})`);
        
        // If we got fewer results than the limit, we're done
        if (results.length < limit) break;
        
        skip += limit;
        
      } catch (error) {
        console.error('Error fetching endpoint', endpoint, error.message);
        break;
      }
    }
    
    return allResults;
  }

  async storeBatch(collectionName, data, idField) {
    if (!data || data.length === 0) {
      console.log(`No data to store for ${collectionName}`);
      return;
    }

    console.log(`Storing ${data.length} documents in ${collectionName}...`);
    
    const collection = firestore.collection(collectionName);
    const batch = firestore.batch();
    let batchCount = 0;
    let totalStored = 0;

    for (const item of data) {
      try {
        // Extract document ID and process item based on collection type
        let docId;
        let processedItem;
        
        if (collectionName === 'houses' && item.house) {
          docId = item.house.houseCode + '-' + item.house.houseNo;
          processedItem = {
            ...item.house,
            houseId: docId
          };
        } else if (collectionName === 'constituencies' && item.constituencyOrPanel) {
          docId = item.constituencyOrPanel.representCode;
          processedItem = {
            ...item.constituencyOrPanel,
            house: item.house,
            constituencyCode: docId
          };
        } else if (collectionName === 'parties' && item.party) {
          docId = item.party.partyCode;
          processedItem = {
            ...item.party,
            house: item.house
          };
        } else if (collectionName === 'members' && item.member) {
          docId = item.member.memberCode;
          processedItem = item.member;
        } else {
          // For other cases, use the original structure
          docId = item[idField];
          processedItem = item;
        }
        
        if (!docId) {
          console.warn('Missing document ID for item in collection', collectionName, item);
          continue;
        }

        const docRef = collection.doc(String(docId));
        
        // Add metadata
        const enrichedItem = {
          ...processedItem,
          updated_at: new Date(),
          ingested_at: new Date()
        };

        batch.set(docRef, enrichedItem);
        batchCount++;
        
        // Commit batch when we reach the limit
        if (batchCount >= this.batchSize) {
          await batch.commit();
          totalStored += batchCount;
          console.log(`Committed batch of ${batchCount} documents to ${collectionName} (total: ${totalStored})`);
          
          // Create new batch
          const newBatch = firestore.batch();
          Object.assign(batch, newBatch);
          batchCount = 0;
        }
      } catch (error) {
        console.error('Error processing item for collection', collectionName, error.message);
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      totalStored += batchCount;
      console.log(`Committed final batch of ${batchCount} documents to ${collectionName}`);
    }

    console.log(`✅ Successfully stored ${totalStored} documents in ${collectionName}`);
  }

  async fetchMembers() {
    console.log('\n📥 Fetching members...');
    
    // Fetch all members without chamber restriction
    const allMembers = await this.paginatedFetch('members');

    console.log(`📊 Total members fetched: ${allMembers.length}`);
    
    // Add photo downloading for current members (limit to reasonable number for testing)
    console.log('\n📸 Starting photo download process...');
    const membersWithPhotos = [];
    
    for (let i = 0; i < Math.min(allMembers.length, 50); i++) { // Limit to first 50 for testing
      const member = allMembers[i];
      if (member.member) {
        const photoUrl = await this.downloadMemberPhoto(
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
    
    // Add remaining members without photos
    for (let i = 50; i < allMembers.length; i++) {
      membersWithPhotos.push(allMembers[i]);
    }
    
    return membersWithPhotos;
  }

  async fetchParties() {
    console.log('\n📥 Fetching parties...');
    const parties = await this.paginatedFetch('parties');
    console.log(`📊 Total parties fetched: ${parties.length}`);
    return parties;
  }

  async fetchHouses() {
    console.log('\n📥 Fetching houses...');
    const houses = await this.paginatedFetch('houses');
    console.log(`📊 Total houses fetched: ${houses.length}`);
    return houses;
  }

  async fetchConstituencies() {
    console.log('\n📥 Fetching constituencies...');
    const constituencies = await this.paginatedFetch('constituencies');
    console.log(`📊 Total constituencies fetched: ${constituencies.length}`);
    return constituencies;
  }

  async storeMetadata(counts) {
    console.log('\n💾 Storing ingestion metadata...');
    
    const metadata = {
      last_ingestion: new Date(),
      counts,
      status: 'completed',
      version: '1.0.0'
    };

    await firestore.collection('metadata').doc('last_ingestion').set(metadata);
    console.log('✅ Metadata stored successfully');
  }

  async run() {
    const startTime = Date.now();
    
    console.log('🚀 Starting Oireachtas data ingestion...');
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    
    try {
      // Fetch all data concurrently
      console.log('\n🔄 Fetching data from Oireachtas API...');
      
      const [members, parties, houses, constituencies] = await Promise.all([
        this.fetchMembers(),
        this.fetchParties(), 
        this.fetchHouses(),
        this.fetchConstituencies()
      ]);

      // Store all data
      console.log('\n💾 Storing data in Firestore...');
      
      await Promise.all([
        this.storeBatch('members', members, 'memberCode'),
        this.storeBatch('parties', parties, 'partyCode'),
        this.storeBatch('houses', houses, 'houseCode'),
        this.storeBatch('constituencies', constituencies, 'representCode')
      ]);

      // Store metadata
      const counts = {
        members: members.length,
        parties: parties.length,
        houses: houses.length,
        constituencies: constituencies.length
      };

      await this.storeMetadata(counts);

      const duration = (Date.now() - startTime) / 1000;
      
      console.log('\n🎉 Ingestion completed successfully!');
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
      console.log('📊 Summary:');
      console.log(`   • Members: ${counts.members}`);
      console.log(`   • Parties: ${counts.parties}`);
      console.log(`   • Houses: ${counts.houses}`);
      console.log(`   • Constituencies: ${counts.constituencies}`);
      
      return counts;

    } catch (error) {
      console.error('❌ Ingestion failed:', error.message);
      console.error(error);
      throw error;
    }
  }
}

// Run the ingestion if this script is executed directly
if (require.main === module) {
  const ingester = new OireachtasIngester();
  
  ingester.run()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = OireachtasIngester;
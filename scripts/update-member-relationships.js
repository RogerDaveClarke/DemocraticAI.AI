const { Firestore } = require('@google-cloud/firestore');

class MemberRelationshipUpdater {
  constructor() {
    this.db = new Firestore();
  }

  // Determine if a membership is current/active
  isCurrentMembership(membership) {
    const now = new Date();
    const endDate = membership.dateRange?.end;
    
    // If no end date, it's current
    if (!endDate) return true;
    
    // If end date is in the future, it's current
    const membershipEnd = new Date(endDate);
    return membershipEnd > now;
  }

  // Get the most recent membership for relationship data
  getCurrentRelationships(memberships) {
    if (!memberships || memberships.length === 0) {
      return {
        currentParty: null,
        currentHouse: null,
        currentConstituency: null,
        isActive: false
      };
    }

    // Find current memberships (no end date or end date in future)
    const currentMemberships = memberships.filter(m => 
      this.isCurrentMembership(m.membership)
    );

    // If no current memberships, get the most recent one
    let targetMembership;
    if (currentMemberships.length > 0) {
      // Use the most recent current membership
      targetMembership = currentMemberships.sort((a, b) => 
        new Date(b.membership.dateRange.start) - new Date(a.membership.dateRange.start)
      )[0];
    } else {
      // Use the most recent membership overall
      targetMembership = memberships.sort((a, b) => 
        new Date(b.membership.dateRange.start) - new Date(a.membership.dateRange.start)
      )[0];
    }

    const membership = targetMembership.membership;
    
    // Extract current party
    let currentParty = null;
    if (membership.parties && membership.parties.length > 0) {
      // Get the most recent party for this membership
      const sortedParties = membership.parties.sort((a, b) => 
        new Date(b.party.dateRange.start) - new Date(a.party.dateRange.start)
      );
      currentParty = sortedParties[0].party.partyCode;
    }

    // Extract current house
    let currentHouse = null;
    if (membership.house) {
      currentHouse = `${membership.house.houseCode}-${membership.house.houseNo}`;
    }

    // Extract current constituency/representation
    let currentConstituency = null;
    if (membership.represents && membership.represents.length > 0) {
      currentConstituency = membership.represents[0].represent.representCode;
    }

    // Determine if currently active
    const isActive = currentMemberships.length > 0;

    return {
      currentParty,
      currentHouse,
      currentConstituency,
      isActive
    };
  }

  async updateMemberRelationships() {
    try {
      console.log('🔄 Updating member relationships for filtering...');
      
      // Get all members
      const snapshot = await this.db.collection('members').get();
      console.log(`📊 Found ${snapshot.docs.length} members to update\n`);
      
      let updated = 0;
      let errors = 0;
      const batch = this.db.batch();
      let batchCount = 0;
      
      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();
          
          // Get current relationships from memberships
          const relationships = this.getCurrentRelationships(data.memberships);
          
          console.log(`Processing: ${data.fullName}`);
          console.log(`  Party: ${relationships.currentParty || 'None'}`);
          console.log(`  House: ${relationships.currentHouse || 'None'}`);
          console.log(`  Constituency: ${relationships.currentConstituency || 'None'}`);
          console.log(`  Active: ${relationships.isActive}`);
          console.log('');
          
          // Update the document with relationship fields
          batch.update(doc.ref, {
            currentParty: relationships.currentParty,
            currentHouse: relationships.currentHouse,
            currentConstituency: relationships.currentConstituency,
            isActive: relationships.isActive,
            updated_at: new Date()
          });
          
          batchCount++;
          updated++;
          
          // Commit batch if it reaches 500 operations (Firestore limit)
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`💾 Committed batch of ${batchCount} updates`);
            
            // Create new batch
            const newBatch = this.db.batch();
            Object.assign(batch, newBatch);
            batchCount = 0;
          }
          
        } catch (error) {
          console.error('❌ Error processing member', data.fullName, error.message);
          errors++;
        }
      }
      
      // Commit final batch if there are remaining operations
      if (batchCount > 0) {
        await batch.commit();
        console.log(`💾 Committed final batch of ${batchCount} updates`);
      }
      
      console.log(`\n🎉 Relationship update completed!`);
      console.log(`📊 Summary:`);
      console.log(`   ✅ Successfully updated: ${updated}`);
      console.log(`   ❌ Errors: ${errors}`);
      
    } catch (error) {
      console.error('❌ Error updating relationships:', error);
    }
  }
}

// Run the update
async function main() {
  const updater = new MemberRelationshipUpdater();
  await updater.updateMemberRelationships();
}

main().catch(console.error);
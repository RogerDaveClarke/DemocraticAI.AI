"""
Script to update specific ministers in Firestore database
Ensures they have correct names, photos, and are marked as active
"""

import os
import sys
from google.cloud import firestore

# Key ministers we want to ensure are in the database
KEY_MINISTERS = [
    {
        'memberCode': 'Micheál-Martin.D.1981-03-09',
        'fullName': 'Micheál Martin',
        'showAs': 'Micheál Martin',
        'currentParty': 'Fianna_Fáil',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Cork South-Central',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Micheál-Martin.D.1981-03-09/image/thumb'
    },
    {
        'memberCode': 'Simon-Harris.D.2011-03-09',
        'fullName': 'Simon Harris',
        'showAs': 'Simon Harris',
        'currentParty': 'Fine_Gael',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Wicklow',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Simon-Harris.D.2011-03-09/image/thumb'
    },
    {
        'memberCode': 'Paschal-Donohoe.D.2011-03-09',
        'fullName': 'Paschal Donohoe',
        'showAs': 'Paschal Donohoe',
        'currentParty': 'Fine_Gael',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Dublin Central',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Paschal-Donohoe.D.2011-03-09/image/thumb'
    },
    {
        'memberCode': 'Jack-Chambers.D.2016-10-03',
        'fullName': 'Jack Chambers',
        'showAs': 'Jack Chambers',
        'currentParty': 'Fianna_Fáil',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Dublin West',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Jack-Chambers.D.2016-10-03/image/thumb'
    },
    {
        'memberCode': 'Helen-McEntee.D.2013-07-03',
        'fullName': 'Helen McEntee',
        'showAs': 'Helen McEntee',
        'currentParty': 'Fine_Gael',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Meath East',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Helen-McEntee.D.2013-07-03/image/thumb'
    },
    {
        'memberCode': 'Darragh-O\'Brien.D.2007-06-14',
        'fullName': 'Darragh O\'Brien',
        'showAs': 'Darragh O\'Brien',
        'currentParty': 'Fianna_Fáil',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Dublin Fingal',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Darragh-O%27Brien.D.2007-06-14/image/thumb'
    },
    {
        'memberCode': 'Jennifer-Carroll-MacNeill.D.2020-02-17',
        'fullName': 'Jennifer Carroll MacNeill',
        'showAs': 'Jennifer Carroll MacNeill',
        'currentParty': 'Fine_Gael',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Dún Laoghaire',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Jennifer-Carroll-MacNeill.D.2020-02-17/image/thumb'
    },
    {
        'memberCode': 'Jim-O\'Callaghan.D.2007-06-14',
        'fullName': 'Jim O\'Callaghan',
        'showAs': 'Jim O\'Callaghan',
        'currentParty': 'Fianna_Fáil',
        'currentHouse': 'Dáil',
        'currentConstituency': 'Dublin Bay South',
        'isActive': True,
        'photoUrl': 'https://data.oireachtas.ie/ie/oireachtas/member/id/Jim-O%27Callaghan.D.2007-06-14/image/thumb'
    }
]

def update_ministers():
    """Update key ministers in Firestore"""
    print("Initializing Firestore client...")
    db = firestore.Client()
    
    print(f"\nUpdating {len(KEY_MINISTERS)} key ministers...")
    
    updated_count = 0
    for minister in KEY_MINISTERS:
        try:
            doc_ref = db.collection('members').document(minister['memberCode'])
            doc_ref.set(minister, merge=True)
            print(f"✓ Updated: {minister['fullName']} ({minister['memberCode']})")
            updated_count += 1
        except Exception as e:
            print(f"✗ Error updating {minister['fullName']}: {e}")
    
    print(f"\nSuccessfully updated {updated_count}/{len(KEY_MINISTERS)} ministers")
    
    # Verify updates
    print("\nVerifying updates...")
    for minister in KEY_MINISTERS:
        try:
            doc_ref = db.collection('members').document(minister['memberCode'])
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                active_status = "✓ Active" if data.get('isActive') else "✗ Inactive"
                has_photo = "✓" if data.get('photoUrl') else "✗"
                print(f"{minister['fullName']:30} | {active_status:12} | Photo: {has_photo}")
            else:
                print(f"{minister['fullName']:30} | ✗ NOT FOUND")
        except Exception as e:
            print(f"{minister['fullName']:30} | ✗ Error: {e}")

if __name__ == '__main__':
    try:
        update_ministers()
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)

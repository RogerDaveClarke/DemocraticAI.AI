# Encrypted Bill Storage - Security Architecture

## Overview

The "Create Your Own Bill" feature implements **client-side encryption** with **zero-knowledge architecture**, ensuring that user-generated legislative content is completely private and cannot be read by anyone except the user - not even GCP administrators.

## Security Architecture

### 1. **Client-Side Encryption (AES-256-GCM)**

All bill content is encrypted in the user's browser before being uploaded to cloud storage:

- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Encryption Location**: 100% in the browser using Web Crypto API
- **Key Storage**: Encryption keys are **never** stored or transmitted to the server

### 2. **Zero-Knowledge Architecture**

```
User Browser                    GCP Cloud Storage
─────────────                  ──────────────────
                               
1. Draft Bill                  
   ↓                           
2. Encrypt with                
   User Key (AES-256)          
   ↓                           
3. Upload Encrypted  ────────→ 4. Store Encrypted Blob
   Blob                           (Unreadable by anyone
                                   without the key)
                               
5. Download         ←───────── 6. Return Encrypted Blob
   Encrypted Blob              
   ↓                           
7. Decrypt with                
   User Key                    
   ↓                           
8. Display Bill                
```

**Key Point**: The server and GCP administrators only ever see encrypted data. They cannot decrypt it.

### 3. **How It Works**

#### Encryption Process:
1. User writes a bill in the markdown editor
2. When "Save Bill" is clicked:
   - A unique encryption key is derived from the user's session identifier
   - The title and content are encrypted separately (each with its own IV)
   - The encrypted data is uploaded to GCP Cloud Storage
   - A local cache copy is also kept in localStorage for offline access

#### Decryption Process:
1. User selects a bill from the dropdown
2. The encrypted blob is downloaded from GCP Cloud Storage
3. The same encryption key is derived from the user's session
4. The content is decrypted in the browser
5. The decrypted bill is displayed in the editor

### 4. **Encryption Key Management**

The encryption key is derived from a **user identifier** that is unique per session:

```typescript
// Current implementation (development)
let userId = sessionStorage.getItem('user_encryption_id');
if (!userId) {
  userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  sessionStorage.setItem('user_encryption_id', userId);
}
```

**For Production**: This should be replaced with the user's authentication token or a cryptographic hash of their Firebase/Auth0 user ID.

## GCP Setup

### Step 1: Create a Cloud Storage Bucket

```bash
# Create the bucket


# Set CORS policy (required for browser uploads)
cat > cors.json << EOF
[
  {
    "origin": ["https://yourdomain.com", "http://localhost:5173"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://oireachtas-user-bills
```

### Step 2: Set Up IAM Permissions

Create a service account for the application:

```bash
# Create service account
gcloud iam service-accounts create oireachtas-bills-app \
    --display-name="Oireachtas Bills App"

# Grant minimal permissions (only to write/read/delete objects)
gsutil iam ch serviceAccount:oireachtas-bills-app@PROJECT_ID.iam.gserviceaccount.com:objectAdmin \
    gs://oireachtas-user-bills
```

### Step 3: Configure Authentication

The application needs a way to get authentication tokens for GCP API calls.

#### Option A: Using Firebase Authentication (Recommended)

If you're using Firebase Auth, update the `getGCPAuthToken()` function:

```typescript
async function getGCPAuthToken(): Promise<string> {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}
```

Then configure Firebase to work with your GCP project.

#### Option B: Using OAuth 2.0

Implement OAuth 2.0 flow to get access tokens for the Cloud Storage API.

### Step 4: Set Environment Variables

Create a `.env` file in the project root:

```env
# GCP Cloud Storage Bucket for user bills
VITE_GCP_BILLS_BUCKET=oireachtas-user-bills

# GCP Project ID (optional, for additional features)
VITE_GCP_PROJECT_ID=your-project-id
```

## Security Guarantees

### ✅ What is Protected:

1. **Bill Content**: Fully encrypted, unreadable by anyone except the user
2. **Bill Titles**: Separately encrypted with unique IVs
3. **Metadata**: Only non-sensitive data (timestamps, IDs) is visible

### ✅ Who Cannot Read Your Bills:

- GCP Administrators
- Database administrators
- Application developers
- Government agencies (without a court order and the user's cooperation)
- Hackers who compromise the server (they only get encrypted blobs)

### ⚠️ Important Security Considerations:

1. **Key Loss**: If a user loses their session/authentication, they **cannot recover their bills**. This is a trade-off for zero-knowledge security.

2. **Browser Storage**: The encryption key is temporarily stored in `sessionStorage`. If an attacker gains access to the user's browser, they could potentially extract the key.

3. **Production Authentication**: The current implementation uses a random session ID. For production, replace this with a proper authentication token.

## Production Deployment Checklist

- [ ] Replace `getUserIdentifier()` with proper authentication-based key derivation
- [ ] Implement proper GCP authentication (Firebase Auth or OAuth 2.0)
- [ ] Set up CORS policy on the GCP bucket
- [ ] Configure IAM permissions correctly
- [ ] Add key backup/recovery mechanism (optional, but reduces zero-knowledge guarantee)
- [ ] Implement rate limiting on API calls
- [ ] Add monitoring and logging (without logging decrypted content)
- [ ] Test encryption/decryption with different user sessions
- [ ] Implement automatic cleanup of old bills (if desired)

## Testing the Security

### Test 1: Verify Encryption
1. Save a bill
2. Go to GCP Console → Cloud Storage → Browse the bucket
3. Download the JSON file
4. Verify that `encryptedTitle` and `encryptedContent` are base64-encoded gibberish

### Test 2: Verify Decryption
1. Save a bill
2. Close the browser
3. Reopen the app (in development, the session persists)
4. Load the bill - it should decrypt correctly

### Test 3: Verify Zero-Knowledge
1. Save a bill as User A (session A)
2. Clear `sessionStorage` to simulate User B (session B)
3. Try to load the bill - it should fail to decrypt (since User B has a different key)

## Code Locations

- **Encryption Utilities**: `src/utils/encryptedBillStorage.ts`
- **UI Component**: `src/components/features/fun/CreateYourOwnBill.tsx`
- **Configuration**: `.env` file

## Support

If you have questions about the security architecture or need help with setup, please refer to:
- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [GCP Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [PBKDF2 Key Derivation](https://en.wikipedia.org/wiki/PBKDF2)

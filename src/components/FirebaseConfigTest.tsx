/**
 * Firebase Configuration Test Component
 * Helps diagnose authentication and MFA setup issues
 */

import { useState } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { auth } from '../config/firebase';
import { CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';

export default function FirebaseConfigTest() {
  const { currentUser, isEmailVerified, hasMFA } = useFirebaseAuth();
  const [showDetails, setShowDetails] = useState(false);

  const checks = [
    {
      name: 'Firebase Initialized',
      status: !!auth,
      details: auth ? 'Firebase app is initialized' : 'Firebase app not initialized'
    },
    {
      name: 'User Authenticated',
      status: !!currentUser,
      details: currentUser ? `Signed in as ${currentUser.email}` : 'No user signed in'
    },
    {
      name: 'Email Verified',
      status: isEmailVerified,
      details: isEmailVerified ? 'Email is verified' : 'Email verification pending'
    },
    {
      name: '2FA Enrolled',
      status: hasMFA,
      details: hasMFA ? '2FA is enabled' : '2FA not enabled'
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Shield className="w-6 h-6" />
      </button>

      {showDetails && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-96">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Firebase Configuration Status</h3>
          
          <div className="space-y-3 mb-4">
            {checks.map((check, index) => (
              <div key={index} className="flex items-start gap-3">
                {check.status ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{check.name}</p>
                  <p className="text-xs text-gray-600">{check.details}</p>
                </div>
              </div>
            ))}
          </div>

          {currentUser && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">User Details:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><strong>UID:</strong> {currentUser.uid}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Provider:</strong> {currentUser.providerData[0]?.providerId || 'N/A'}</p>
                <p><strong>Created:</strong> {new Date(currentUser.metadata.creationTime!).toLocaleDateString()}</p>
                <p><strong>Last Sign In:</strong> {new Date(currentUser.metadata.lastSignInTime!).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {!hasMFA && currentUser && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800 space-y-1">
                  <p className="font-semibold">To enable 2FA with authenticator apps:</p>
                  <p>1. Enable <strong>Firebase Identity Platform</strong> in Google Cloud Console</p>
                  <p>2. Enable TOTP in Firebase Console (Authentication → Settings)</p>
                  <p className="text-yellow-600 mt-2">
                    Note: Standard Firebase Auth only supports SMS. Identity Platform adds TOTP support.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDetails(false)}
            className="mt-4 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

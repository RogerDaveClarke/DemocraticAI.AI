/**
 * MFA Verification Modal
 * Prompts for 2FA code during sign-in
 */

import { useState } from 'react';
import { Shield, X, AlertCircle } from 'lucide-react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface MFAVerificationModalProps {
  onClose: () => void;
}

export default function MFAVerificationModal({ onClose }: MFAVerificationModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mfaResolver, resolveMFASignIn } = useFirebaseAuth();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/research';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mfaResolver) {
      setError('No MFA session found. Please try signing in again.');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resolveMFASignIn(mfaResolver, verificationCode);
      onClose();
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
                <p className="text-blue-50 text-sm">Enter your verification code</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Open your authenticator app and enter the 6-digit verification code to complete sign-in.
              </p>
            </div>

            <div>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Verifying...' : 'Verify and Sign In'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

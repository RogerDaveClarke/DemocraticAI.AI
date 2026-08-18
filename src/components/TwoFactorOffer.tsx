/**
 * Two-Factor Authentication Offer Component
 * Prompts new users to enable 2FA after account creation
 */

import { Shield, Check, Lock } from 'lucide-react';
import TwoFactorSetup from './TwoFactorSetup';
import { useState } from 'react';

interface TwoFactorOfferProps {
  userEmail: string;
  onSkip: () => void;
  onComplete: () => void;
}

export default function TwoFactorOffer({ userEmail, onSkip, onComplete }: TwoFactorOfferProps) {
  const [showSetup, setShowSetup] = useState(false);

  if (showSetup) {
    return <TwoFactorSetup onClose={onComplete} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-8 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Secure Your Account
          </h2>
          <p className="text-blue-50">
            Add an extra layer of protection with 2FA
          </p>
        </div>

        <div className="px-8 py-8">
          {/* Account Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Account created for</p>
            <p className="text-lg font-semibold text-gray-900">{userEmail}</p>
          </div>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">
              Why enable Two-Factor Authentication?
            </h3>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Enhanced Security</h4>
                <p className="text-sm text-gray-600">
                  Protect your account from unauthorized access, even if your password is compromised.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Industry Standard</h4>
                <p className="text-sm text-gray-600">
                  Uses TOTP (Time-based One-Time Password) authentication, trusted by major platforms worldwide.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Works Offline</h4>
                <p className="text-sm text-gray-600">
                  No SMS required - works with authenticator apps like Google Authenticator, Authy, and more.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Setup Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Quick setup:</strong> Takes less than 2 minutes. Just scan a QR code with your authenticator app!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowSetup(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3.5 px-6 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg"
            >
              Enable Two-Factor Authentication
            </button>
            
            <button
              onClick={onSkip}
              className="w-full bg-white text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
            >
              Skip for Now
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              You can always enable 2FA later from your account settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

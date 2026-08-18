/**
 * Two-Factor Authentication Setup Component
 * Allows users to enable/disable 2FA with authenticator apps
 */

import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { Shield, Smartphone, AlertCircle, Check, X, KeyRound } from 'lucide-react';
import QRCode from 'qrcode';
import type { TotpSecret } from 'firebase/auth';
import { multiFactor } from 'firebase/auth';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ValidatedForm } from '@/components/ui/validated-form';

interface TwoFactorSetupProps {
  onClose: () => void;
}

const verifyCodeSchema = z.object({
  verificationCode: z
    .string()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit code'),
});

export default function TwoFactorSetup({ onClose }: TwoFactorSetupProps) {
  const { currentUser, hasMFA, enrollTOTP, verifyTOTPEnrollment, unenrollMFA } = useFirebaseAuth();
  
  const [step, setStep] = useState<'intro' | 'setup' | 'verify'>('intro');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user already has MFA enrolled
  useEffect(() => {
    if (hasMFA) {
      setStep('intro'); // Show unenroll option
    }
  }, [hasMFA]);

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting 2FA enrollment...');
      const { secret, qrCodeUrl } = await enrollTOTP();
      console.log('TOTP secret generated successfully');
      console.log('QR Code URL:', qrCodeUrl);
      
      setTotpSecret(secret);
      
      // Generate QR code image
      console.log('Generating QR code image...');
      const qrDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log('QR code generated successfully');
      
      setQrCodeDataUrl(qrDataUrl);
      setStep('setup');
    } catch (err: any) {
      console.error('Error in handleStartSetup:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide more specific error messages
      if (err.code === 'auth/user-token-expired') {
        setError('Your session has expired. Please sign out and sign in again.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('For security, please sign out and sign in again before enabling 2FA.');
      } else if (err.message?.includes('multi-factor')) {
        setError('Multi-factor authentication is not enabled for this project. Please contact support.');
      } else {
        setError(`Failed to generate QR code: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (verificationCode: string) => {
    if (!totpSecret) {
      setError('Setup key is missing. Please scan the QR code again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyTOTPEnrollment(verificationCode, totpSecret);
      setStep('intro');
      setQrCodeDataUrl('');
      setTotpSecret(null);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!currentUser) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
    );
    
    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      // Get the first enrolled factor UID
      const enrolledFactors = multiFactor(currentUser).enrolledFactors;
      const factorUid = enrolledFactors[0]?.uid;
      if (factorUid) {
        await unenrollMFA(factorUid);
      }
    } catch (err) {
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
                <p className="text-blue-50 text-sm">Add an extra layer of security</p>
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
            <div className="mb-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 mb-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{error}</p>
                  {error.includes('multi-factor') && (
                    <div className="text-xs text-red-600 mt-2 space-y-1">
                      <p>TOTP multi-factor authentication requires <strong>Firebase Identity Platform</strong>.</p>
                      <p>Identity Platform includes authenticator app support (TOTP), while standard Firebase Authentication only supports SMS.</p>
                    </div>
                  )}
                  {(error.includes('session') || error.includes('expired') || error.includes('sign in again')) && (
                    <p className="text-xs text-red-600 mt-2">
                      For security reasons, please sign out and sign back in, then try again.
                    </p>
                  )}
                </div>
              </div>
              
              {error.includes('multi-factor') && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="font-semibold text-blue-900 mb-2">Administrator Setup Required:</p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Step 1: Enable Identity Platform</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700 ml-2 text-xs">
                        <li>Go to Google Cloud Console</li>
                        <li>Search for "Identity Platform"</li>
                        <li>Click "Enable Identity Platform"</li>
                        <li>Wait for upgrade to complete</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Step 2: Enable TOTP in Firebase</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700 ml-2 text-xs">
                        <li>Go to Firebase Console</li>
                        <li>Authentication → Settings tab</li>
                        <li>Multi-factor authentication section</li>
                        <li>Enable TOTP (Authenticator app)</li>
                        <li>Save changes</li>
                      </ol>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      <strong>Note:</strong> Identity Platform is free for most use cases and adds TOTP support.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Intro / Status Step */}
          {step === 'intro' && (
            <div className="space-y-6">
              {hasMFA ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">2FA is Enabled</h3>
                      <p className="text-sm text-green-700">
                        Your account is protected with two-factor authentication using an authenticator app.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleDisable2FA}
                      disabled={loading}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Enhanced Security</h3>
                        <p className="text-sm text-blue-700">
                          Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">Compatible Authenticator Apps:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Google Authenticator</li>
                        <li>Microsoft Authenticator</li>
                        <li>Authy</li>
                        <li>1Password</li>
                        <li>Any TOTP-compatible app</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleStartSetup}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Maybe Later
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Setup Step - Show QR Code */}
          {step === 'setup' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Code</h3>
                <p className="text-sm text-gray-600">
                  Open your authenticator app and scan this QR code
                </p>
              </div>

              {qrCodeDataUrl && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="2FA QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 text-center">
                  Can't scan the QR code? Manually enter the setup key in your authenticator app.
                </p>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-green-700 transition-colors font-medium"
              >
                I've Scanned the QR Code
              </button>
            </div>
          )}

          {/* Verify Step - Enter Code */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter Verification Code</h3>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <ValidatedForm
                schema={verifyCodeSchema}
                defaultValues={{ verificationCode: '' }}
                submitLabel={loading ? 'Verifying...' : 'Verify and Enable 2FA'}
                className="space-y-4"
                onSubmit={async (values) => {
                  await handleVerifyCode(values.verificationCode);
                }}
              >
                {(form) => (
                  <>
                    <FormField
                      control={form.control}
                      name="verificationCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="000000"
                              maxLength={6}
                              autoFocus
                              className="px-4 py-3 text-center font-mono text-2xl tracking-widest"
                              value={field.value ?? ''}
                              onChange={(event) => {
                                const value = event.target.value.replace(/\D/g, '').slice(0, 6);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <p className="text-center text-xs text-gray-500">
                            Enter the 6-digit code from your authenticator app
                          </p>
                          <FormMessage className="text-center" />
                        </FormItem>
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => setStep('setup')}
                      className="w-full rounded-lg bg-gray-100 py-3 px-4 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      Back to QR Code
                    </button>
                  </>
                )}
              </ValidatedForm>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Authentication Page
 * Sign in / Sign up with Email/Password or GitHub
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { Github, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import MFAVerificationModal from '../components/MFAVerificationModal';
import TwoFactorOffer from '../components/TwoFactorOffer';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail, signInWithGitHub, sendVerificationEmail, mfaResolver, currentUser } = useFirebaseAuth();
  
  // If user is already authenticated, redirect immediately without rendering the auth form
  useEffect(() => {
    if (currentUser) {
      const from = (location.state as any)?.from?.pathname || '/research';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [show2FAOffer, setShow2FAOffer] = useState(false);

  // Redirect after successful auth
  const from = (location.state as any)?.from?.pathname || '/research';

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setShowVerificationNotice(true);
        // Don't navigate yet - user needs to verify email
      } else {
        await signInWithEmail(email, password);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      // Check if MFA is required
      if (error.code === 'auth/multi-factor-auth-required') {
        setShowMFAModal(true);
      } else {
        console.error('Auth error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubAuth = async () => {
    // Prevent double authentication attempts
    if (loading || isAuthenticating) {
      return;
    }
    
    setLoading(true);
    setIsAuthenticating(true);
    try {
      await signInWithGitHub();
      const from = (location.state as any)?.from?.pathname || '/research';
      navigate(from, { replace: true });
    } catch (error: any) {
      // Don't show error for user cancellation or auth in progress
      if (error.code !== 'auth/popup-closed-by-user' && error.message !== 'Authentication already in progress') {
        // Error toast is already handled in the context
      }
    } finally {
      setLoading(false);
      setIsAuthenticating(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
    } catch (error) {
      console.error('Resend verification error:', error);
    }
  };

  const handleContinueTo2FA = () => {
    setShowVerificationNotice(false);
    setShow2FAOffer(true);
  };

  const handleSkip2FA = () => {
    setShow2FAOffer(false);
    setIsSignUp(false);
    // Reset form
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleComplete2FA = () => {
    setShow2FAOffer(false);
    setIsSignUp(false);
    // Reset form
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // Don't render the auth form if user is already authenticated
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show 2FA offer after email verification notice
  if (show2FAOffer) {
    return <TwoFactorOffer userEmail={email} onSkip={handleSkip2FA} onComplete={handleComplete2FA} />;
  }

  if (showVerificationNotice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-2">
              We've sent a verification email to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please check your inbox and click the verification link to activate your account.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next Step:</strong> After verifying your email, you can enhance your account security with two-factor authentication!
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleContinueTo2FA}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-green-700 transition-colors font-semibold"
              >
                Continue to Security Setup
              </button>
              <button
                onClick={handleResendVerification}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Resend Verification Email
              </button>
              <button
                onClick={() => setShowVerificationNotice(false)}
                className="w-full bg-white text-gray-600 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors border border-gray-300"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
          <h2 className="text-center text-3xl font-extrabold text-white">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-center text-sm text-green-100">
            {isSignUp ? 'Sign up to explore Parliament data' : 'Sign in to continue'}
          </p>
        </div>

        <div className="px-8 py-8">
          {/* GitHub OAuth */}
          <button
            onClick={handleGitHubAuth}
            disabled={loading || isAuthenticating}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Github className="h-5 w-5 mr-2" />
            Continue with GitHub
          </button>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="sr-only">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="First name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle Sign In/Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFirstName('');
                setLastName('');
              }}
              className="text-sm text-green-600 hover:text-green-500 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
      
      {/* MFA Verification Modal */}
      {showMFAModal && mfaResolver && (
        <MFAVerificationModal onClose={() => setShowMFAModal(false)} />
      )}
    </div>
  );
}

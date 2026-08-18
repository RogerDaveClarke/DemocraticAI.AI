/**
 * Firebase Authentication Context
 * Parliament Explorer - Simple Firebase Auth
 */

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  GithubAuthProvider,
  UserCredential,
  multiFactor,
  MultiFactorResolver,
  TotpMultiFactorGenerator,
  TotpSecret
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface FirebaseAuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  isEmailVerified: boolean;
  hasMFA: boolean;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signInWithGitHub: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  enrollTOTP: () => Promise<{ secret: TotpSecret; qrCodeUrl: string }>;
  verifyTOTPEnrollment: (verificationCode: string, secret: TotpSecret) => Promise<void>;
  unenrollMFA: (factorUid: string) => Promise<void>;
  resolveMFASignIn: (resolver: MultiFactorResolver, verificationCode: string) => Promise<UserCredential>;
  mfaResolver: MultiFactorResolver | null;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [hasMFA, setHasMFA] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  
  // Track authentication state to prevent concurrent calls
  const authInProgress = useRef(false);

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified (but don't show success toast)
      if (!result.user.emailVerified) {
        toast.warning('Please verify your email address to access all features.');
      }
      
      return result;
    } catch (error: any) {
      // Check if this is an MFA required error
      if (error.code === 'auth/multi-factor-auth-required') {
        setMfaResolver(error.resolver);
        throw error;
      }
      
      const message = error.code === 'auth/wrong-password' 
        ? 'Incorrect password' 
        : error.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : error.message || 'Failed to sign in';
      toast.error(message);
      throw error;
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Automatically send verification email after signup
      await sendEmailVerification(userCredential.user);
      
      toast.success('Account created! Please check your email to verify your account.');
      return userCredential;
    } catch (error: any) {
      const message = error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : error.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : error.message || 'Failed to create account';
      toast.error(message);
      throw error;
    }
  };

  // Sign in with GitHub
  const signInWithGitHub = async () => {
    // Prevent concurrent authentication attempts
    if (authInProgress.current) {
      throw new Error('Authentication already in progress');
    }
    
    authInProgress.current = true;
    
    try {
      const provider = new GithubAuthProvider();
      // Add scopes for GitHub
      provider.addScope('user:email');
      provider.addScope('read:user');
      
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error: any) {
      // Don't show error for user cancellation or auth in progress
      if (error.code === 'auth/popup-closed-by-user') {
        // User cancelled - this is normal behavior
      } else if (error.message === 'Authentication already in progress') {
        // Duplicate attempt prevented
      } else {
        const message = error.code === 'auth/account-exists-with-different-credential'
          ? 'An account already exists with this email using a different sign-in method'
          : error.message || 'Failed to sign in with GitHub';
        toast.error(message);
      }
      throw error;
    } finally {
      authInProgress.current = false;
    }
  };

  // Send email verification
  const sendVerificationEmail = async () => {
    if (currentUser && !currentUser.emailVerified) {
      try {
        await sendEmailVerification(currentUser);
        toast.success('Verification email sent! Please check your inbox.');
      } catch (error: any) {
        toast.error('Failed to send verification email. Please try again later.');
        throw error;
      }
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.removeItem('authToken');
      // Remove success toast notification
    } catch (error: any) {
      toast.error('Failed to sign out');
      throw error;
    }
  };

  // Get current ID token
  const getIdToken = async (): Promise<string | null> => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        return token;
      } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
      }
    }
    return null;
  };

  // Enroll TOTP (Authenticator App) - Step 1: Generate secret and QR code
  const enrollTOTP = async (): Promise<{ secret: TotpSecret; qrCodeUrl: string }> => {
    if (!currentUser) {
      throw new Error('User must be signed in to enroll MFA');
    }

    try {
      console.log('Getting multi-factor session...');
      const multiFactorSession = await multiFactor(currentUser).getSession();
      console.log('Multi-factor session obtained');
      
      console.log('Generating TOTP secret...');
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
      console.log('TOTP secret generated');
      
      // Generate QR code URL for authenticator apps
      const accountName = currentUser.email || currentUser.uid || 'user@parliament';
      const issuer = 'Parliament AI';
      
      console.log('Generating QR code URL for:', accountName);
      const qrCodeUrl = totpSecret.generateQrCodeUrl(accountName, issuer);
      console.log('QR code URL generated:', qrCodeUrl);
      
      return { secret: totpSecret, qrCodeUrl };
    } catch (error: any) {
      console.error('Error enrolling TOTP:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide specific error messages
      if (error.code === 'auth/user-token-expired') {
        toast.error('Session expired. Please sign in again.');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign out and sign in again to enable 2FA.');
      } else if (error.message?.includes('not enabled') || error.message?.includes('multi-factor')) {
        toast.error('TOTP requires Firebase Identity Platform. Please contact administrator.');
      } else {
        toast.error('Failed to generate authenticator code. Please try again.');
      }
      throw error;
    }
  };

  // Verify TOTP enrollment - Step 2: Confirm with verification code
  const verifyTOTPEnrollment = async (verificationCode: string, secret: TotpSecret) => {
    if (!currentUser) {
      throw new Error('User must be signed in to verify MFA enrollment');
    }

    try {
      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        secret,
        verificationCode
      );
      
      await multiFactor(currentUser).enroll(multiFactorAssertion, 'Authenticator App');
      setHasMFA(true);
      toast.success('Two-factor authentication enabled successfully!');
    } catch (error: any) {
      console.error('Error verifying TOTP:', error);
      toast.error('Invalid verification code. Please try again.');
      throw error;
    }
  };

  // Unenroll MFA
  const unenrollMFA = async (factorUid: string) => {
    if (!currentUser) {
      throw new Error('User must be signed in to unenroll MFA');
    }

    try {
      const enrolledFactors = multiFactor(currentUser).enrolledFactors;
      const factor = enrolledFactors.find(f => f.uid === factorUid);
      
      if (factor) {
        await multiFactor(currentUser).unenroll(factor);
        setHasMFA(false);
        toast.success('Two-factor authentication disabled');
      }
    } catch (error: any) {
      console.error('Error unenrolling MFA:', error);
      toast.error('Failed to disable two-factor authentication');
      throw error;
    }
  };

  // Resolve MFA sign-in with verification code
  const resolveMFASignIn = async (resolver: MultiFactorResolver, verificationCode: string): Promise<UserCredential> => {
    try {
      const selectedHint = resolver.hints[0]; // Use first enrolled factor (TOTP)
      
      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForSignIn(
        selectedHint.uid,
        verificationCode
      );
      
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
      setMfaResolver(null);
      toast.success('Signed in successfully!');
      return userCredential;
    } catch (error: any) {
      console.error('Error resolving MFA sign-in:', error);
      toast.error('Invalid verification code. Please try again.');
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Reset auth progress flag when state changes
      authInProgress.current = false;
      
      // Reload user to get latest emailVerified status
      if (user) {
        await user.reload();
      }
      
      setCurrentUser(user);
      setIsEmailVerified(user?.emailVerified || false);
      setHasMFA(user ? multiFactor(user).enrolledFactors.length > 0 : false);
      setLoading(false);


    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    isEmailVerified,
    hasMFA,
    signInWithEmail,
    signUpWithEmail,
    signInWithGitHub,
    logout,
    sendVerificationEmail,
    getIdToken,
    enrollTOTP,
    verifyTOTPEnrollment,
    unenrollMFA,
    resolveMFASignIn,
    mfaResolver
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {!loading && children}
    </FirebaseAuthContext.Provider>
  );
}

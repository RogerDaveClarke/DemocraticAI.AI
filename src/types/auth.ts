/**
 * Authentication Types
 * Parliament Explorer - MFA Authentication System
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'moderator';
  mfaEnabled: boolean;
  mfaVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profilePicture?: string;
  // OAuth provider fields
  googleId?: string;
  microsoftId?: string;
  authProvider: 'google' | 'microsoft';
  isEmailVerified: boolean;
  // Microsoft-specific fields
  tenantId?: string;
  jobTitle?: string;
  department?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

// Remove password-based interfaces
// export interface LoginCredentials - REMOVED
// export interface RegisterCredentials - REMOVED

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationRequest {
  token: string;
  secret?: string; // For initial setup
}

export interface GoogleOAuthCredentials {
  credential: string; // JWT ID token from Google
  clientId: string;
}

export interface MicrosoftOAuthCredentials {
  accessToken: string; // Microsoft access token
  idToken?: string; // Optional ID token
}

export interface GoogleProfile {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

export interface MicrosoftProfile {
  id: string; // Microsoft user ID
  mail: string;
  displayName: string;
  givenName: string;
  surname: string;
  userPrincipalName: string;
  jobTitle?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  mfaRequired?: boolean;
  mfaSetup?: MFASetupResponse;
  requiresMfaSetup?: boolean; // New OAuth users need MFA
}

export interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  
  // OAuth Actions - No password methods
  loginWithGoogle: (googleCredentials: GoogleOAuthCredentials) => Promise<AuthResponse>;
  loginWithMicrosoft: (microsoftCredentials: MicrosoftOAuthCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  verifyMFA: (verification: MFAVerificationRequest) => Promise<AuthResponse>;
  setupMFA: () => Promise<MFASetupResponse>;
  refreshAuth: () => Promise<boolean>;
  
  // Utilities
  hasRole: (role: string | string[]) => boolean;
  isAdmin: () => boolean;
}
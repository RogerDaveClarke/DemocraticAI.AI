/**
 * Authentication API Types for Cloud Run API
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

export interface UserDocument extends User {
  // No password fields - OAuth only
  mfaSecret?: string;
  mfaBackupCodes: string[];
  refreshTokens: string[];
  loginAttempts: number;
  lockoutUntil?: string;
}

// Remove password-based credentials
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

export interface GoogleProfile {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

export interface MicrosoftOAuthCredentials {
  accessToken: string; // Microsoft access token
  idToken?: string; // Optional ID token
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
  requiresMfaSetup?: boolean; // New Google OAuth users need MFA
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  mfaVerified: boolean;
  iat: number;
  exp: number;
}
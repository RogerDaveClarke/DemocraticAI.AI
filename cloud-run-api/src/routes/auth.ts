/**
 * Authentication API
 * Parliament Explorer - OAuth-Only Authentication System (No Passwords)
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import axios from 'axios';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';
// import { ConfidentialClientApplication } from '@azure/msal-node';
import SecurityLogger from '../utils/SecurityLogger';
import {
  User,
  UserDocument,
  MFASetupResponse,
  MFAVerificationRequest,
  AuthResponse,
  JWTPayload,
  GoogleOAuthCredentials,
  GoogleProfile,
  MicrosoftOAuthCredentials,
  MicrosoftProfile
} from '../types/auth';

const router = express.Router();
const db = new Firestore();
const securityLogger = SecurityLogger.getInstance();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (process.env.LEGACY_AUTH_ROUTES === 'true' && (!JWT_SECRET || !JWT_REFRESH_SECRET)) {
  console.error('[auth] JWT_SECRET and JWT_REFRESH_SECRET must be set when LEGACY_AUTH_ROUTES=true');
  process.exit(1);
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const APP_NAME = 'Democratic AI';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || '';
// const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
// const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';

// Access Control - Single User Mode
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS ? 
  process.env.ALLOWED_EMAILS.split(',').map(email => email.trim().toLowerCase()) : 
  [];
const SINGLE_USER_MODE = process.env.SINGLE_USER_MODE === 'true';

// Initialize OAuth clients
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
// microsoftClient would be used for Microsoft OAuth (currently disabled)
// const microsoftClient = new ConfidentialClientApplication({
//   auth: {
//     clientId: MICROSOFT_CLIENT_ID,
//     clientSecret: MICROSOFT_CLIENT_SECRET,
//     authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID || 'common'}`
//   }
// });

// Rate limiting middleware - 10 auth attempts per IP per 15 minutes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Utility functions
const generateTokens = (user: User): { accessToken: string; refreshToken: string } => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    mfaVerified: user.mfaVerified
  };

  const accessToken = jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET as string, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

// Utility function for email validation (currently unused)
// const validateEmail = (email: string): boolean => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// Microsoft Graph API helper
const getMicrosoftUserProfile = async (accessToken: string): Promise<MicrosoftProfile> => {
  const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

const sanitizeUser = (userDoc: UserDocument): User => {
  const { mfaSecret, mfaBackupCodes, refreshTokens, loginAttempts, lockoutUntil, ...user } = userDoc;
  return user;
};

// Authentication middleware
export const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      await securityLogger.logAuthFailure(
        'AUTH_MISSING_KEY',
        req.ip || 'unknown',
        req.originalUrl,
        'No authentication token provided'
      );
      res.status(401).json({ success: false, message: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as JWTPayload;
    
    // Get user from database
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    if (!userDoc.exists) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    const userData = userDoc.data() as UserDocument;
    req.user = sanitizeUser(userData);
    next();
  } catch (error) {
    await securityLogger.logAuthFailure(
      'AUTH_INVALID_KEY',
      req.ip || 'unknown',
      req.originalUrl,
      `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// OAuth-only authentication - password endpoints removed
// Users must authenticate with Google or Microsoft OAuth

// POST /api/auth/google
router.post('/google', authRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { credential, clientId }: GoogleOAuthCredentials = req.body;

    if (!credential || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Google credential and client ID are required'
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const googleProfile: GoogleProfile = {
      sub: payload.sub,
      email: payload.email!,
      email_verified: payload.email_verified!,
      name: payload.name!,
      given_name: payload.given_name!,
      family_name: payload.family_name!,
      picture: payload.picture
    };

    // Single User Mode Access Control
    if (SINGLE_USER_MODE && ALLOWED_EMAILS.length > 0) {
      if (!ALLOWED_EMAILS.includes(googleProfile.email.toLowerCase())) {
        await securityLogger.logAuthFailure(
          'AUTH_FAILURE',
          req.ip || 'unknown',
          req.originalUrl,
          `Access denied for unauthorized email: ${googleProfile.email}`
        );
        
        return res.status(403).json({
          success: false,
          message: 'Access denied. This application is restricted to authorized users only.'
        });
      }
    }

    // Check if user exists
    let userQuery = await db.collection('users').where('email', '==', googleProfile.email.toLowerCase()).get();
    
    // Also check by Google ID if user doesn't exist by email
    if (userQuery.empty) {
      userQuery = await db.collection('users').where('googleId', '==', googleProfile.sub).get();
    }

    let userDoc: UserDocument;

    if (userQuery.empty) {
      // Create new Google OAuth user
      const userId = db.collection('users').doc().id;
      
      userDoc = {
        id: userId,
        email: googleProfile.email.toLowerCase(),
        firstName: googleProfile.given_name,
        lastName: googleProfile.family_name,
        role: 'user',
        mfaEnabled: false,
        mfaVerified: false,
        createdAt: new Date().toISOString(),
        authProvider: 'google',
        isEmailVerified: googleProfile.email_verified,
        googleId: googleProfile.sub,
        profilePicture: googleProfile.picture,
        refreshTokens: [],
        loginAttempts: 0,
        mfaBackupCodes: []
      };

      await db.collection('users').doc(userId).set(userDoc);

      await securityLogger.logSecurityEvent('AUTH_SUCCESS', {
        reason: 'New user registration via Google OAuth',
        userId,
        email: googleProfile.email.toLowerCase(),
        provider: 'google'
      }, {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method
      });
    } else {
      // Update existing user with Google info
      const existingUser = userQuery.docs[0].data() as UserDocument;
      
      // If this was a different OAuth account, convert to Google OAuth
      if (existingUser.authProvider !== 'google') {
        existingUser.authProvider = 'google';
        existingUser.googleId = googleProfile.sub;
        existingUser.isEmailVerified = googleProfile.email_verified;
        existingUser.profilePicture = googleProfile.picture;
        
        await db.collection('users').doc(existingUser.id).update({
          authProvider: 'google',
          googleId: googleProfile.sub,
          isEmailVerified: googleProfile.email_verified,
          profilePicture: googleProfile.picture,
          lastLoginAt: new Date().toISOString()
        });
      } else {
        // Update last login
        await db.collection('users').doc(existingUser.id).update({
          lastLoginAt: new Date().toISOString()
        });
      }

      userDoc = existingUser;

      await securityLogger.logSecurityEvent('AUTH_SUCCESS', {
        reason: 'User login via Google OAuth',
        userId: existingUser.id,
        email: googleProfile.email.toLowerCase(),
        provider: 'google'
      }, {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method
      });
    }

    // Generate JWT tokens
    const tokens = generateTokens(sanitizeUser(userDoc));

    // Store refresh token
    await db.collection('users').doc(userDoc.id).update({
      refreshTokens: [...(userDoc.refreshTokens || []), tokens.refreshToken]
    });

    const response: AuthResponse = {
      success: true,
      message: 'Google OAuth login successful',
      user: sanitizeUser(userDoc),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      requiresMfaSetup: !userDoc.mfaEnabled
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Google OAuth error:', error);
    
    await securityLogger.logAuthFailure(
      'AUTH_FAILURE',
      req.ip || 'unknown',
      req.originalUrl,
      `Google OAuth verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return res.status(500).json({
      success: false,
      message: 'Google OAuth authentication failed'
    });
  }
});

// POST /api/auth/microsoft - Microsoft OAuth authentication
router.post('/microsoft', authRateLimit, async (req: express.Request, res: express.Response) => {
  try {
    const { accessToken }: MicrosoftOAuthCredentials = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Microsoft access token is required'
      });
    }

    // Get user profile from Microsoft Graph
    const microsoftProfile = await getMicrosoftUserProfile(accessToken);
    
    const email = microsoftProfile.mail || microsoftProfile.userPrincipalName;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not found in Microsoft profile'
      });
    }

    // Check if user exists
    let userQuery = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    
    // Also check by Microsoft ID if user doesn't exist by email
    if (userQuery.empty) {
      userQuery = await db.collection('users').where('microsoftId', '==', microsoftProfile.id).get();
    }

    let userDoc: UserDocument;

    if (userQuery.empty) {
      // Create new Microsoft OAuth user
      const userId = db.collection('users').doc().id;
      
      userDoc = {
        id: userId,
        email: email.toLowerCase(),
        firstName: microsoftProfile.givenName || '',
        lastName: microsoftProfile.surname || '',
        role: 'user',
        mfaEnabled: false,
        mfaVerified: false,
        createdAt: new Date().toISOString(),
        authProvider: 'microsoft',
        isEmailVerified: true, // Microsoft handles email verification
        microsoftId: microsoftProfile.id,
        tenantId: MICROSOFT_TENANT_ID,
        jobTitle: microsoftProfile.jobTitle,
        department: microsoftProfile.officeLocation,
        profilePicture: undefined,
        refreshTokens: [],
        loginAttempts: 0,
        mfaBackupCodes: []
      };

      await db.collection('users').doc(userId).set(userDoc);

      await securityLogger.logSecurityEvent('AUTH_SUCCESS', {
        reason: 'New user registration via Microsoft OAuth',
        userId,
        email: email.toLowerCase(),
        provider: 'microsoft'
      }, {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method
      });
    } else {
      // Update existing user with Microsoft info
      const existingUser = userQuery.docs[0].data() as UserDocument;
      
      // If this was a different OAuth account, convert to Microsoft OAuth
      if (existingUser.authProvider !== 'microsoft') {
        existingUser.authProvider = 'microsoft';
        existingUser.microsoftId = microsoftProfile.id;
        existingUser.tenantId = MICROSOFT_TENANT_ID;
        existingUser.jobTitle = microsoftProfile.jobTitle;
        existingUser.department = microsoftProfile.officeLocation;
        existingUser.isEmailVerified = true;
        
        await db.collection('users').doc(existingUser.id).update({
          authProvider: 'microsoft',
          microsoftId: microsoftProfile.id,
          tenantId: MICROSOFT_TENANT_ID,
          jobTitle: microsoftProfile.jobTitle,
          department: microsoftProfile.officeLocation,
          isEmailVerified: true,
          lastLoginAt: new Date().toISOString()
        });
      } else {
        // Update last login
        await db.collection('users').doc(existingUser.id).update({
          lastLoginAt: new Date().toISOString()
        });
      }

      userDoc = existingUser;

      await securityLogger.logSecurityEvent('AUTH_SUCCESS', {
        reason: 'User login via Microsoft OAuth',
        userId: existingUser.id,
        email: email.toLowerCase(),
        provider: 'microsoft'
      }, {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method
      });
    }

    // Generate JWT tokens
    const tokens = generateTokens(sanitizeUser(userDoc));

    // Store refresh token
    await db.collection('users').doc(userDoc.id).update({
      refreshTokens: [...(userDoc.refreshTokens || []), tokens.refreshToken]
    });

    const response: AuthResponse = {
      success: true,
      message: 'Microsoft OAuth login successful',
      user: sanitizeUser(userDoc),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      requiresMfaSetup: !userDoc.mfaEnabled
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    
    await securityLogger.logAuthFailure(
      'AUTH_FAILURE',
      req.ip || 'unknown',
      req.originalUrl,
      `Microsoft OAuth verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return res.status(500).json({
      success: false,
      message: 'Microsoft OAuth authentication failed'
    });
  }
});

// POST /api/auth/mfa/setup
router.post('/mfa/setup', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${APP_NAME} (${user.email})`,
      issuer: APP_NAME,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Store secret and backup codes temporarily (not enabled until verified)
    await db.collection('users').doc(user.id).update({
      mfaSecret: secret.base32,
      mfaBackupCodes: backupCodes
    });

    const response: MFASetupResponse = {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('MFA setup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during MFA setup'
    });
  }
});

// POST /api/auth/mfa/verify
router.post('/mfa/verify', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const { token, secret }: MFAVerificationRequest = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'MFA token is required'
      });
    }

    // Get user's MFA secret
    const userDoc = await db.collection('users').doc(user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data() as UserDocument;
    const mfaSecret = secret || userData.mfaSecret;

    if (!mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA not set up. Please set up MFA first.'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: mfaSecret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (!verified) {
      // Check if it's a backup code
      const isBackupCode = userData.mfaBackupCodes?.includes(token);
      
      if (!isBackupCode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid MFA token'
        });
      }

      // Remove used backup code
      const updatedBackupCodes = userData.mfaBackupCodes?.filter(code => code !== token) || [];
      await db.collection('users').doc(user.id).update({
        mfaBackupCodes: updatedBackupCodes
      });
    }

    // Enable MFA and mark as verified
    await db.collection('users').doc(user.id).update({
      mfaEnabled: true,
      mfaVerified: true
    });

    // Generate new tokens with MFA verified
    const updatedUser = { ...user, mfaEnabled: true, mfaVerified: true };
    const tokens = generateTokens(updatedUser);

    const response: AuthResponse = {
      success: true,
      message: 'MFA verification successful',
      user: updatedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('MFA verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during MFA verification'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Remove refresh token from user's stored tokens
      const userDoc = await db.collection('users').doc(user.id).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as UserDocument;
        const updatedTokens = userData.refreshTokens?.filter(rt => rt !== token) || [];
        
        await db.collection('users').doc(user.id).update({
          refreshTokens: updatedTokens
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
});

export default router;
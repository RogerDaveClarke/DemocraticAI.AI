/**
 * Protected Route Component
 * Requires authentication to render children
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export default function ProtectedRoute({ children, requireEmailVerification = false }: ProtectedRouteProps) {
  const { currentUser, isEmailVerified, loading, sendVerificationEmail } = useFirebaseAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth page
  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Require email verification if specified (and not GitHub auth which auto-verifies)
  if (requireEmailVerification && !isEmailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Email Verification Required</h3>
          <p className="mt-2 text-sm text-gray-600 mb-2">
            Please verify your email address to access the application. Check your inbox for the verification link.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Email: <strong>{currentUser?.email}</strong>
          </p>
          <div className="space-y-3">
            <button
              onClick={() => sendVerificationEmail()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Resend Verification Email
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

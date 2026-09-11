import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';

let termination: Promise<void> | null = null;

export function isTerminalAuthError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  return ['auth/id-token-revoked', 'auth/session-cookie-revoked', 'auth/user-disabled', 'auth/user-not-found', 'auth/user-token-expired', 'auth/invalid-user-token'].includes(code);
}

export function terminateAuthenticatedSession(): Promise<void> {
  if (termination) return termination;

  termination = (async () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user_encryption_id');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('chat-metrics');
    localStorage.removeItem('recent-research-queries');
    localStorage.removeItem('oireachtas_user_bills_cache');
    try {
      await signOut(auth);
    } finally {
      window.dispatchEvent(new CustomEvent('auth:session-terminated'));
      termination = null;
    }
  })();

  return termination;
}
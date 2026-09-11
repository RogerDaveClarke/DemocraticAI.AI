import { useState, useEffect } from 'react';
import { onIdTokenChanged, getRedirectResult, User } from 'firebase/auth';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { isTerminalAuthError, terminateAuthenticatedSession } from '../utils/authSession';

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

export function useAuth(): { state: AuthState; user: User | null; redirectError: string | null } {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let unsubscribeAccess: Unsubscribe = () => {};

    const validateCurrentSession = () => {
      auth.currentUser?.getIdToken(true).catch((error) => {
        if (isTerminalAuthError(error)) void terminateAuthenticatedSession();
      });
    };

    getRedirectResult(auth)
      .then((result) => {
        if (result) console.log('[auth] redirect sign-in succeeded:', result.user.email);
      })
      .catch((e) => {
        console.error('[auth] redirect error:', e.code, e.message);
        setRedirectError(e.code ?? 'auth/unknown');
      })
      .finally(() => {
        unsubscribe = onIdTokenChanged(auth, (u) => {
          unsubscribeAccess();
          setUser(u);
          setState(u ? 'authenticated' : 'unauthenticated');
          if (u) {
            unsubscribeAccess = onSnapshot(doc(db, 'account_access', u.uid), (snapshot) => {
              if (snapshot.exists() && snapshot.data().active === false) void terminateAuthenticatedSession();
            }, (error) => console.error('[auth] account status listener failed:', error.code));
          }
        });
      });

    const refreshInterval = window.setInterval(validateCurrentSession, 60_000);
    const handleVisibility = () => { if (document.visibilityState === 'visible') validateCurrentSession(); };
    window.addEventListener('focus', validateCurrentSession);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      unsubscribeAccess();
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', validateCurrentSession);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return { state, user, redirectError };
}

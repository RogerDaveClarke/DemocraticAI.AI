import { useState, useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult, User } from 'firebase/auth';
import { auth } from '../config/firebase';

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

export function useAuth(): { state: AuthState; user: User | null; redirectError: string | null } {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    getRedirectResult(auth)
      .then((result) => {
        if (result) console.log('[auth] redirect sign-in succeeded:', result.user.email);
      })
      .catch((e) => {
        console.error('[auth] redirect error:', e.code, e.message);
        setRedirectError(e.code ?? 'auth/unknown');
      })
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (u) => {
          setUser(u);
          setState(u ? 'authenticated' : 'unauthenticated');
        });
      });

    return () => unsubscribe();
  }, []);

  return { state, user, redirectError };
}

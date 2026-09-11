import { useState, useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return onIdTokenChanged(auth, async (user) => {
      if (!user) { setIsAdmin(false); return; }
      try {
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims['admin'] === true);
      } catch {
        setIsAdmin(false);
      }
    });
  }, []);

  return isAdmin;
}

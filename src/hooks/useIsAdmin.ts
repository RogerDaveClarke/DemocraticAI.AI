import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setIsAdmin(false); return; }
      const token = await user.getIdTokenResult();
      setIsAdmin(token.claims['admin'] === true);
    });
  }, []);

  return isAdmin;
}

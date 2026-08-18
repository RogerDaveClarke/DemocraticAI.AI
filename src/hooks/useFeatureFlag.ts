import { useState, useEffect } from 'react';
import { fetchAndActivate, getValue } from 'firebase/remote-config';
import { doc, getDoc } from 'firebase/firestore';
import { remoteConfig, db, auth } from '../config/firebase';
import { type FeatureFlag, featureFlagDefaults } from '../config/featureFlags';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [value, setValue] = useState<boolean>(featureFlagDefaults[flag]);

  useEffect(() => {
    const uid = auth.currentUser?.uid ?? null;

    const rcCheck = fetchAndActivate(remoteConfig)
      .then(() => getValue(remoteConfig, flag).asBoolean())
      .catch(() => featureFlagDefaults[flag]);

    // Per-user override in Firestore takes precedence over the global Remote Config value.
    const overrideCheck = uid
      ? getDoc(doc(db, 'feature_overrides', flag))
          .then(snap => {
            if (!snap.exists()) return null;
            const users: { uid: string }[] = snap.data().users ?? [];
            return users.some(u => u.uid === uid) ? true : null;
          })
          .catch(() => null)
      : Promise.resolve(null);

    Promise.all([rcCheck, overrideCheck]).then(([rc, override]) => {
      setValue(override !== null ? override : rc);
    });
  }, [flag]);

  return value;
}

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PROFILE, PROFILES, type ProfileConfig } from '../../domain/profiles.ts';
import { browserStore } from '../../platform/storage.ts';
import {
  deleteAllLocalData,
  readUserProfile,
  writeUserProfile,
  type UserProfile,
} from '../../platform/userProfile.ts';

/** The on-device profile; null until onboarding finishes. Applies the text scale to the page. */
export function useUserProfile() {
  const [user, setUser] = useState<UserProfile | null>(() => readUserProfile(browserStore));
  const config: ProfileConfig = PROFILES[user?.profile ?? DEFAULT_PROFILE];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.profile = config.id;
    root.style.setProperty('--text-scale', String(config.textScale));
  }, [config]);

  const save = useCallback((next: UserProfile) => {
    setUser(next);
    writeUserProfile(browserStore, next);
  }, []);

  const deleteAll = useCallback(() => {
    deleteAllLocalData(browserStore);
    setUser(null);
  }, []);

  return { user, config, save, deleteAll };
}

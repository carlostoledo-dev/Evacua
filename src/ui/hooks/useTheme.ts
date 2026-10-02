import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { browserStore, STORAGE_KEYS } from '../../platform/storage.ts';
import {
  isThemePreference,
  resolveTheme,
  THEME_BAR_COLOR,
  type Theme,
  type ThemePreference,
} from '../theme.ts';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

function readStoredPreference(): ThemePreference {
  const stored = browserStore.read(STORAGE_KEYS.theme);
  return isThemePreference(stored) ? stored : 'system';
}

/** Theme preference (stored on the device) and the theme actually in effect. */
export function useTheme(): {
  preference: ThemePreference;
  theme: Theme;
  setPreference: (preference: ThemePreference) => void;
} {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference);
  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (preference === 'system') delete root.dataset.theme;
    else root.dataset.theme = preference;
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = THEME_BAR_COLOR[theme];
    }
  }, [preference, theme]);

  const changePreference = useCallback((next: ThemePreference) => {
    setPreference(next);
    browserStore.write(STORAGE_KEYS.theme, next);
  }, []);

  return { preference, theme, setPreference: changePreference };
}

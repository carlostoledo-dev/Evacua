/**
 * On-device key/value storage: language, theme and the local profile (optional first name and
 * profile type). Nothing here is ever sent anywhere; location is never stored.
 */
export interface KeyValueStore {
  /** Returns the stored value, or null if missing or if storage is unavailable. */
  read(key: string): string | null;
  /** Returns false instead of throwing when storage is unavailable or full. */
  write(key: string, value: string): boolean;
  /** Removes a key; silently does nothing when storage is unavailable. */
  remove(key: string): void;
}

export const STORAGE_KEYS = {
  locale: 'evacua:locale',
  theme: 'evacua:theme',
  user: 'evacua:user',
  kit: 'evacua:kit',
} as const;

/**
 * Wraps Web Storage so any failure (private mode, disabled storage, quota, SecurityError
 * on access) degrades to "not stored" and the app keeps working with defaults.
 */
export function createSafeStore(getStorage: () => Storage): KeyValueStore {
  return {
    read(key) {
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value) {
      try {
        getStorage().setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        getStorage().removeItem(key);
      } catch {
        // Nothing stored, nothing to remove.
      }
    },
  };
}

export const browserStore: KeyValueStore = createSafeStore(() => window.localStorage);

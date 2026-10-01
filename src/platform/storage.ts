/**
 * On-device key/value storage. Only non-personal preferences (language, later the profile)
 * are ever stored here; location is never persisted.
 */
export interface KeyValueStore {
  /** Returns the stored value, or null if missing or if storage is unavailable. */
  read(key: string): string | null;
  /** Returns false instead of throwing when storage is unavailable or full. */
  write(key: string, value: string): boolean;
}

export const STORAGE_KEYS = {
  locale: 'evacua:locale',
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
  };
}

export const browserStore: KeyValueStore = createSafeStore(() => window.localStorage);

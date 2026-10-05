import { describe, expect, it } from 'vitest';
import { createSafeStore, STORAGE_KEYS } from './storage.ts';
import {
  createUserProfile,
  deleteAllLocalData,
  readUserProfile,
  writeUserProfile,
} from './userProfile.ts';

function memoryStore() {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => {
      data.clear();
    },
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => {
      data.delete(key);
    },
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  return { store: createSafeStore(() => storage), data };
}

describe('user profile on the device', () => {
  it('has no profile before onboarding', () => {
    expect(readUserProfile(memoryStore().store)).toBeNull();
  });

  it('round-trips a profile', () => {
    const { store } = memoryStore();
    writeUserProfile(store, createUserProfile('senior'));
    expect(readUserProfile(store)).toEqual({ version: 1, profile: 'senior', tourDone: false });
  });

  it('drops a name stored by an earlier build: no personal data is kept', () => {
    const { store, data } = memoryStore();
    data.set(STORAGE_KEYS.user, JSON.stringify({ version: 1, name: 'Ana', profile: 'adult' }));
    const profile = readUserProfile(store);
    expect(profile).toEqual({ version: 1, profile: 'adult', tourDone: false });
    if (profile) writeUserProfile(store, profile);
    expect(data.get(STORAGE_KEYS.user)).not.toContain('Ana');
  });

  it('treats corrupted or tampered data as "no profile" instead of crashing', () => {
    const { store, data } = memoryStore();
    data.set(STORAGE_KEYS.user, '{not json');
    expect(readUserProfile(store)).toBeNull();
    data.set(STORAGE_KEYS.user, JSON.stringify({ version: 1, profile: 'admin' }));
    expect(readUserProfile(store)).toBeNull();
  });

  it('"Borrar mis datos" removes every key Evacua stores', () => {
    const { store, data } = memoryStore();
    writeUserProfile(store, createUserProfile('adult'));
    store.write(STORAGE_KEYS.locale, 'en');
    store.write(STORAGE_KEYS.theme, 'dark');
    deleteAllLocalData(store);
    expect(data.size).toBe(0);
  });
});

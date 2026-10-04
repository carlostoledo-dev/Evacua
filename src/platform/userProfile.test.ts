import { describe, expect, it } from 'vitest';
import { createSafeStore, STORAGE_KEYS } from './storage.ts';
import {
  createUserProfile,
  deleteAllLocalData,
  NAME_MAX_LENGTH,
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

  it('round-trips a profile, trimming the name', () => {
    const { store } = memoryStore();
    writeUserProfile(store, createUserProfile('  Ana  ', 'senior'));
    expect(readUserProfile(store)).toEqual({
      version: 1,
      name: 'Ana',
      profile: 'senior',
      tourDone: false,
    });
  });

  it('keeps the name optional and short', () => {
    expect(createUserProfile('', 'child').name).toBe('');
    expect(createUserProfile('x'.repeat(100), 'adult').name).toHaveLength(NAME_MAX_LENGTH);
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
    writeUserProfile(store, createUserProfile('Ana', 'adult'));
    store.write(STORAGE_KEYS.locale, 'en');
    store.write(STORAGE_KEYS.theme, 'dark');
    deleteAllLocalData(store);
    expect(data.size).toBe(0);
  });
});

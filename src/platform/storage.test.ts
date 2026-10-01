import { describe, expect, it } from 'vitest';
import { createSafeStore } from './storage.ts';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => {
      data.clear();
    },
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function throwingStorage(): Storage {
  const fail = (): never => {
    throw new DOMException('Storage disabled', 'SecurityError');
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

describe('createSafeStore', () => {
  it('reads back what it wrote, and null for missing keys', () => {
    const storage = memoryStorage();
    const store = createSafeStore(() => storage);
    expect(store.read('missing')).toBeNull();
    expect(store.write('k', 'v')).toBe(true);
    expect(store.read('k')).toBe('v');
  });

  it('returns null and false when storage methods throw', () => {
    const store = createSafeStore(throwingStorage);
    expect(store.read('k')).toBeNull();
    expect(store.write('k', 'v')).toBe(false);
  });

  it('survives storage that cannot even be accessed', () => {
    const store = createSafeStore(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(store.read('k')).toBeNull();
    expect(store.write('k', 'v')).toBe(false);
  });
});

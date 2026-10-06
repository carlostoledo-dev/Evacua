import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from './dictionaries/index.ts';
import { esCL } from './dictionaries/es-CL.ts';
import { DEFAULT_LOCALE, isLocale, LOCALES, resolveInitialLocale } from './locales.ts';
import { placeholdersOf, translate, type MessageKey } from './translate.ts';

const SOURCE_KEYS = Object.keys(esCL).sort();

describe('dictionaries', () => {
  it.each(LOCALES)('%s has exactly the same keys as es-CL', (locale) => {
    expect(Object.keys(DICTIONARIES[locale]).sort()).toEqual(SOURCE_KEYS);
  });

  it.each(LOCALES)('%s has no empty messages', (locale) => {
    for (const message of Object.values(DICTIONARIES[locale])) {
      expect(message.trim()).not.toBe('');
    }
  });

  it.each(LOCALES)('%s uses the same {placeholders} as es-CL for every key', (locale) => {
    for (const key of SOURCE_KEYS as MessageKey[]) {
      expect(placeholdersOf(DICTIONARIES[locale][key]), key).toEqual(placeholdersOf(esCL[key]));
    }
  });

  it('always names the authorities in the disclaimer, in every locale', () => {
    for (const locale of LOCALES) {
      const body = DICTIONARIES[locale]['disclaimer.body'];
      expect(body).toContain('SENAPRED');
      expect(body).toContain('SHOA');
      expect(body).toContain('Coronel');
      // The one-line version always on screen also names them.
      const short = DICTIONARIES[locale]['disclaimer.short'];
      expect(short).toContain('SENAPRED');
      expect(short).toContain('SHOA');
    }
  });
});

describe('translate', () => {
  it('returns the message for a key', () => {
    expect(translate(esCL, 'update.apply')).toBe('Actualizar');
  });

  it('fills placeholders', () => {
    expect(translate(esCL, 'footer.version', { version: '1.2.3' })).toBe('Versión 1.2.3');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translate(esCL, 'footer.version', { other: 'x' })).toBe('Versión {version}');
  });
});

describe('resolveInitialLocale', () => {
  it('prefers a valid stored choice over the browser languages', () => {
    expect(resolveInitialLocale('en', ['es-CL'])).toBe('en');
  });

  it('ignores an invalid stored value', () => {
    expect(resolveInitialLocale('fr', ['en-US'])).toBe('en');
  });

  it('maps any Spanish variant to es-CL', () => {
    expect(resolveInitialLocale(null, ['es-AR', 'en'])).toBe('es-CL');
  });

  it('uses the first supported browser language', () => {
    expect(resolveInitialLocale(null, ['de-DE', 'en-GB', 'es'])).toBe('en');
  });

  it('falls back to the default locale', () => {
    expect(resolveInitialLocale(null, ['de-DE'])).toBe(DEFAULT_LOCALE);
    expect(resolveInitialLocale(null, [])).toBe(DEFAULT_LOCALE);
  });
});

describe('isLocale', () => {
  it('accepts supported locales only', () => {
    expect(isLocale('es-CL')).toBe(true);
    expect(isLocale('es')).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

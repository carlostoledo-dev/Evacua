import { describe, expect, it } from 'vitest';
import { isThemePreference, resolveTheme } from './theme.ts';

describe('resolveTheme', () => {
  it('follows the device when the preference is "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('honors an explicit choice regardless of the device', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
});

describe('isThemePreference', () => {
  it('accepts only known preferences', () => {
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

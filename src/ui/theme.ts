export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type Theme = 'light' | 'dark';

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** "system" follows the device; anything else is the user's explicit choice. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

/** Browser chrome color per theme (address bar, task switcher). Matches --color-header in CSS. */
export const THEME_BAR_COLOR: Readonly<Record<Theme, string>> = {
  light: '#0a1a3f',
  dark: '#050c1f',
};

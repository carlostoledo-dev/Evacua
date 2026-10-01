export const LOCALES = ['es-CL', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es-CL';

/** Each language is named in its own language, whatever the active locale is. */
export const LOCALE_NATIVE_NAMES: Readonly<Record<Locale, string>> = {
  'es-CL': 'Español',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the starting locale: a valid stored choice wins, then the first browser language
 * we support (any Spanish → es-CL, any English → en), then the default.
 */
export function resolveInitialLocale(
  stored: string | null,
  browserLanguages: readonly string[],
): Locale {
  if (isLocale(stored)) return stored;
  for (const tag of browserLanguages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (primary === 'es') return 'es-CL';
    if (primary === 'en') return 'en';
  }
  return DEFAULT_LOCALE;
}

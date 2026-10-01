import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEYS, type KeyValueStore } from '../platform/storage.ts';
import { DICTIONARIES } from './dictionaries/index.ts';
import { I18nContext, type I18nValue } from './I18nContext.ts';
import { resolveInitialLocale, type Locale } from './locales.ts';
import { translate } from './translate.ts';

interface I18nProviderProps {
  store: KeyValueStore;
  children: ReactNode;
}

export function I18nProvider({ store, children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(() =>
    resolveInitialLocale(store.read(STORAGE_KEYS.locale), navigator.languages),
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const changeLocale = useCallback(
    (next: Locale) => {
      setLocale(next);
      store.write(STORAGE_KEYS.locale, next);
    },
    [store],
  );

  const value = useMemo<I18nValue>(() => {
    const dictionary = DICTIONARIES[locale];
    return {
      locale,
      setLocale: changeLocale,
      t: (key, params) => translate(dictionary, key, params),
    };
  }, [locale, changeLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

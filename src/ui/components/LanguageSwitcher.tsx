import { useI18n } from '../../i18n/I18nContext.ts';
import { LOCALE_NATIVE_NAMES, LOCALES } from '../../i18n/locales.ts';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="language-switcher" role="group" aria-label={t('language.label')}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          onClick={() => {
            setLocale(option);
          }}
        >
          {LOCALE_NATIVE_NAMES[option]}
        </button>
      ))}
    </div>
  );
}

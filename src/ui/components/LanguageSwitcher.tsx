import { useI18n } from '../../i18n/I18nContext.ts';
import { LOCALE_NATIVE_NAMES, LOCALES } from '../../i18n/locales.ts';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <fieldset className="choice-list">
      <legend>{t('language.label')}</legend>
      {LOCALES.map((option) => (
        <label key={option} className="choice" lang={option}>
          <input
            type="radio"
            name="language"
            value={option}
            checked={option === locale}
            onChange={() => {
              setLocale(option);
            }}
          />
          <span>{LOCALE_NATIVE_NAMES[option]}</span>
        </label>
      ))}
    </fieldset>
  );
}

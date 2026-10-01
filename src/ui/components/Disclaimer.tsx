import { useI18n } from '../../i18n/I18nContext.ts';
import { WarningIcon } from './icons.tsx';

/** Permanent notice: the app supports, never replaces, the authorities. Not dismissible. */
export function Disclaimer() {
  const { t } = useI18n();
  return (
    <aside className="disclaimer" aria-labelledby="disclaimer-title">
      <WarningIcon />
      <p>
        <strong id="disclaimer-title">{t('disclaimer.title')}</strong>{' '}
        <span>{t('disclaimer.body')}</span>
      </p>
    </aside>
  );
}

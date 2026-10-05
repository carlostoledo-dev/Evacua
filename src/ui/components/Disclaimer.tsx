import { useI18n } from '../../i18n/I18nContext.ts';
import { WarningIcon } from './icons.tsx';

/**
 * Permanent notice: the app supports, never replaces, the authorities. Not dismissible.
 * `card`: a rounded card inside the page flow (onboarding) instead of the bar above the tabs.
 */
export function Disclaimer({ card = false }: { card?: boolean }) {
  const { t } = useI18n();
  return (
    <aside
      className={card ? 'disclaimer disclaimer--card' : 'disclaimer'}
      aria-labelledby="disclaimer-title"
    >
      <WarningIcon />
      <p>
        <strong id="disclaimer-title">{t('disclaimer.title')}</strong>{' '}
        <span>{t('disclaimer.body')}</span>
      </p>
    </aside>
  );
}

import { useI18n } from '../../i18n/I18nContext.ts';
import { ChevronRightIcon, WarningIcon } from './icons.tsx';

/**
 * Permanent notice: the app supports, never replaces, the authorities. Not dismissible.
 * Bar above the tabs: one always-visible line naming the authorities; a tap unfolds the full
 * notice (native <details>, so keyboard and screen readers work).
 * `card`: the full notice as a rounded card inside the page flow (onboarding).
 */
export function Disclaimer({ card = false }: { card?: boolean }) {
  const { t } = useI18n();
  if (card) {
    return (
      <aside className="disclaimer disclaimer--card" aria-labelledby="disclaimer-title">
        <WarningIcon />
        <p>
          <strong id="disclaimer-title">{t('disclaimer.title')}</strong>{' '}
          <span>{t('disclaimer.body')}</span>
        </p>
      </aside>
    );
  }
  return (
    <aside className="disclaimer" aria-labelledby="disclaimer-title">
      <details className="disclaimer__details">
        <summary>
          <WarningIcon />
          <span className="disclaimer__short">
            <strong id="disclaimer-title" className="visually-hidden">
              {t('disclaimer.title')}
            </strong>
            {t('disclaimer.short')}
          </span>
          <span className="visually-hidden">{t('disclaimer.more')}</span>
          <ChevronRightIcon className="icon disclaimer__chevron" />
        </summary>
        <p>{t('disclaimer.body')}</p>
      </details>
    </aside>
  );
}

import { useId } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import { ChevronRightIcon, WarningIcon } from './icons.tsx';

interface DisclaimerProps {
  /** A rounded card with the full notice inside the page flow, instead of the app-bar line. */
  card?: boolean;
  /** False when another notice on the same screen is already the landmark. */
  landmark?: boolean;
  /**
   * Over the map: a support card ("Información de apoyo") whose arrow opens the official
   * guidance. Without it: the one-line amber band of the other screens.
   */
  onMore?: () => void;
}

/**
 * Permanent notice: the app supports, never replaces, the authorities. Not dismissible.
 * In the app bar it is one short line naming SENAPRED and SHOA (screen readers hear the full
 * notice); the full text is also shown as a card in the onboarding and in "Qué hacer".
 */
export function Disclaimer({ card = false, landmark = true, onMore }: DisclaimerProps) {
  const { t } = useI18n();
  const titleId = useId();
  const Tag = landmark ? 'aside' : 'div';
  if (card) {
    return (
      <Tag className="disclaimer disclaimer--card" aria-labelledby={landmark ? titleId : undefined}>
        <WarningIcon />
        <p>
          <strong id={titleId}>{t('disclaimer.title')}</strong> <span>{t('disclaimer.body')}</span>
        </p>
      </Tag>
    );
  }
  return (
    <aside
      className={onMore ? 'disclaimer disclaimer--support' : 'disclaimer'}
      aria-labelledby={titleId}
    >
      <WarningIcon />
      <p>
        <strong id={titleId} className="visually-hidden">
          {t('disclaimer.title')}
        </strong>
        <span aria-hidden="true">{t('disclaimer.short')}</span>
        <span className="visually-hidden">{t('disclaimer.body')}</span>
      </p>
      {onMore && (
        <button
          type="button"
          className="disclaimer__more"
          aria-label={t('disclaimer.open')}
          onClick={onMore}
        >
          <ChevronRightIcon className="icon" />
        </button>
      )}
    </aside>
  );
}

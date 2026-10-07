import type { ManeuverKind } from '../../domain/navigation.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { ManeuverText } from '../navigationText.ts';
import { ArrowUpIcon, CrossIcon } from './icons.tsx';

interface NavigationBannerProps {
  kind: ManeuverKind;
  text: ManeuverText;
  /** Leave the route (same as "Salir de ruta" in the sheet). */
  onClose: () => void;
}

/**
 * The next direction in large type on a blue card over the map, like a car navigator. The arrow
 * turns with the maneuver (CSS, by data-kind); the words always say it too. Screen readers get
 * the instruction from a live region in the route sheet, once per new instruction.
 */
export function NavigationBanner({ kind, text, onClose }: NavigationBannerProps) {
  const { t } = useI18n();
  return (
    <section className="nav-banner" aria-label={t('nav.next')} data-testid="nav-banner">
      <span className="nav-banner__arrow" data-kind={kind}>
        <ArrowUpIcon className="icon" />
      </span>
      <p className="nav-banner__text">
        <strong>{text.action}</strong> <span>{text.lead}</span>
      </p>
      <button
        type="button"
        className="nav-banner__close"
        aria-label={t('nav.close')}
        onClick={onClose}
      >
        <CrossIcon className="icon" />
      </button>
    </section>
  );
}

import type { ManeuverKind } from '../../domain/navigation.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { ManeuverText } from '../navigationText.ts';
import { ArrowUpIcon } from './icons.tsx';

interface NavigationBannerProps {
  kind: ManeuverKind;
  text: ManeuverText;
}

/**
 * The next direction in large type, on top of the map, like a car navigator. The arrow turns
 * with the maneuver (CSS, by data-kind); the words always say it too. Screen readers get the
 * instruction from a live region in the route panel, once per new instruction, not per meter.
 */
export function NavigationBanner({ kind, text }: NavigationBannerProps) {
  const { t } = useI18n();
  return (
    <section className="nav-banner" aria-label={t('nav.next')} data-testid="nav-banner">
      <span className="nav-banner__arrow" data-kind={kind}>
        <ArrowUpIcon className="icon" />
      </span>
      <p className="nav-banner__text">
        <strong>{text.lead}</strong> <span>{text.action}</span>
      </p>
    </section>
  );
}

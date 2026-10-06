// The words of a turn-by-turn instruction: shown in the banner and read aloud, from one source.
import { NAV_NOW_M } from '../domain/constants.ts';
import type { Maneuver, ManeuverKind } from '../domain/navigation.ts';
import type { MessageKey, MessageParams } from '../i18n/translate.ts';
import { formatDistance } from './format.ts';

type Translate = (key: MessageKey, params?: MessageParams) => string;

const ACTION: Record<Exclude<ManeuverKind, 'arrive'>, MessageKey> = {
  'slight-left': 'nav.slightLeft',
  'slight-right': 'nav.slightRight',
  left: 'nav.left',
  right: 'nav.right',
  'sharp-left': 'nav.sharpLeft',
  'sharp-right': 'nav.sharpRight',
};

export interface ManeuverText {
  /** "En 80 m", "Ahora", or the remaining distance when there is no turn left. */
  lead: string;
  /** "gira a la derecha por Freire". */
  action: string;
  spoken: string;
  /** Changes only when the instruction itself changes, not with every meter walked. */
  key: string;
}

export function describeManeuver(
  maneuver: Maneuver,
  destination: 'meeting-point' | 'safe-area',
  t: Translate,
  locale: string,
): ManeuverText {
  const arrive = maneuver.kind === 'arrive';
  const now = !arrive && maneuver.meters < NAV_NOW_M;
  const lead = arrive
    ? formatDistance(maneuver.meters, locale)
    : now
      ? t('nav.now')
      : t('nav.in', { distance: formatDistance(maneuver.meters, locale) });
  const base =
    maneuver.kind === 'arrive'
      ? t(destination === 'meeting-point' ? 'nav.arriveMeeting' : 'nav.arriveSafe')
      : t(ACTION[maneuver.kind]);
  const action = maneuver.street ? `${base} ${t('nav.onto', { street: maneuver.street })}` : base;
  return {
    lead,
    action,
    spoken: `${lead}, ${action}.`,
    key: `${maneuver.kind}|${maneuver.street ?? ''}|${now ? 'now' : 'ahead'}`,
  };
}

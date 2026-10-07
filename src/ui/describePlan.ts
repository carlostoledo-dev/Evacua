// Turns an evacuation plan into the exact sentences shown on screen and read aloud, adapted to
// the profile. One source for both, so voice never says something the screen does not.
import { bearingDegrees, compassPoint } from '../domain/geo.ts';
import type { ProfileConfig } from '../domain/profiles.ts';
import type { EvacuationPlan, StraightLineReason, TimeRange } from '../domain/routing.ts';
import type { MessageKey, MessageParams } from '../i18n/translate.ts';
import { formatDistance } from './format.ts';

type Translate = (key: MessageKey, params?: MessageParams) => string;

/** One step of a route, laid out for a glance: what to do, how far and where, how long. */
export interface PlanItem {
  kind: 'exit' | 'meeting-point' | 'safe-area';
  title: string;
  detail: string;
  /** Null when the profile hides times (children follow an adult). */
  time: string | null;
}

export interface PlanDescription {
  tone: 'danger' | 'safe' | 'warning';
  headline: string;
  /** Full sentences: read aloud, and shown when there is no route to lay out. */
  steps: string[];
  /** The same steps as `steps`, for the on-screen route summary (empty without a route). */
  items: PlanItem[];
  notes: string[];
  straightLine: boolean;
}

const STRAIGHT_LINE_REASON: Record<StraightLineReason, MessageKey> = {
  'no-graph': 'route.straightLine.noGraph',
  'far-from-network': 'route.straightLine.farFromNetwork',
  'no-path': 'route.straightLine.noPath',
};

type Route = Extract<EvacuationPlan, { kind: 'route' }>;

/** The route's street names, with "a dirt trail" for the unnamed trail segments. */
export function displayStreets(route: Route, t: Translate): (string | null)[] {
  return route.streets.map(
    (street, i) => street ?? (route.segments[i] === 'trail' ? t('route.trailName') : null),
  );
}

/** "PE029" from the official code "08102PE029". */
export function shortCode(code: string): string {
  return code.replace(/^\d+/, '');
}

function tidy(sentence: string): string {
  return sentence.replace(/\s+([.,])/g, '$1').trim();
}

/** "30–60 min" or "unos 20 min", as the profile shows times; null when it hides them. */
export function formatShortTime(
  range: TimeRange,
  profile: Pick<ProfileConfig, 'time'>,
  t: Translate,
): string | null {
  if (profile.time === 'range') {
    // "1–1 min" reads oddly: one number when both ends match.
    if (range.fastestMinutes === range.slowestMinutes) {
      return t('route.time.single', { minutes: range.fastestMinutes });
    }
    return t('route.time.rangeShort', { fast: range.fastestMinutes, slow: range.slowestMinutes });
  }
  if (profile.time === 'slow') return t('route.time.slowShort', { slow: range.slowestMinutes });
  return null;
}

export function describePlan(
  plan: EvacuationPlan,
  options: {
    t: Translate;
    locale: string;
    profile: ProfileConfig;
    sectorName: string;
  },
): PlanDescription {
  const { t, locale, profile, sectorName } = options;
  const distance = (meters: number) => formatDistance(meters, locale);
  const time = (range: TimeRange) => {
    if (profile.time === 'range') {
      return t('route.time.range', { fast: range.fastestMinutes, slow: range.slowestMinutes });
    }
    if (profile.time === 'slow') return t('route.time.slow', { slow: range.slowestMinutes });
    return '';
  };
  const shortTime = (range: TimeRange) => formatShortTime(range, profile, t);
  const base = { steps: [], items: [], notes: [], straightLine: false };

  if (plan.kind === 'outside-service-area') {
    return { ...base, tone: 'warning', headline: t('route.outside', { sector: sectorName }) };
  }
  if (plan.kind === 'already-safe') {
    return { ...base, tone: 'safe', headline: t('route.alreadySafe') };
  }
  if (plan.kind === 'no-destination') {
    return { ...base, tone: 'warning', headline: t('route.noDestination') };
  }

  const tone = plan.inDangerZone ? 'danger' : 'safe';
  const headline = t(plan.inDangerZone ? 'route.inDanger' : 'route.notInDanger');

  if (plan.kind === 'straight-line') {
    return {
      tone,
      headline,
      items: [],
      straightLine: true,
      steps: [
        t('route.straightLine.title'),
        t('route.straightLine.body', {
          code: shortCode(plan.destination.code),
          distance: distance(plan.meters),
          direction: t(`compass.${plan.compass}`),
        }),
      ],
      notes: [t(STRAIGHT_LINE_REASON[plan.reason])],
    };
  }

  const steps: string[] = [];
  const items: PlanItem[] = [];
  if (plan.metersToSafety !== null && plan.timeToSafety) {
    steps.push(
      tidy(
        t('route.toSafety', {
          distance: distance(plan.metersToSafety),
          time: time(plan.timeToSafety),
        }),
      ),
    );
    items.push({
      kind: 'exit',
      title: t('route.item.exit'),
      detail: t('route.item.exitDetail', { distance: distance(plan.metersToSafety) }),
      time: shortTime(plan.timeToSafety),
    });
  }
  if (plan.destination.kind === 'meeting-point') {
    // General direction from where the user stands, so "where to go" makes sense without a map.
    const start = plan.path[0] ?? plan.destination.coordinates;
    const direction = t(
      `compass.${compassPoint(bearingDegrees(start, plan.destination.coordinates))}`,
    );
    const code = shortCode(plan.destination.code);
    steps.push(
      tidy(
        t(plan.inDangerZone ? 'route.toMeetingPoint' : 'route.nearestMeetingPoint', {
          code,
          direction,
          distance: distance(plan.meters),
          time: time(plan.time),
        }),
      ),
    );
    items.push({
      kind: 'meeting-point',
      title: t('route.item.meetingPoint', { code }),
      detail: t(items.length > 0 ? 'route.item.meetingDetailTotal' : 'route.item.meetingDetail', {
        distance: distance(plan.meters),
        direction,
      }),
      time: shortTime(plan.time),
    });
  } else {
    steps.push(t('route.toSafeArea'));
    items.push({
      kind: 'safe-area',
      title: t('route.item.safeArea'),
      detail: t('route.toSafeArea'),
      time: null,
    });
  }
  const notes = profile.time === 'hidden' ? [] : [t('route.timeNote')];
  if (plan.trailMeters > 0) {
    notes.unshift(t('route.trailNote', { distance: distance(plan.trailMeters) }));
  }
  return { tone, headline, steps, items, notes, straightLine: false };
}

/** What the voice reads: the same sentences, in the same order. */
export function spokenText(description: PlanDescription, guardian: string | null): string {
  return [guardian, description.headline, ...description.steps]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

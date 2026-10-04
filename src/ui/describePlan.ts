// Turns an evacuation plan into the exact sentences shown on screen and read aloud, adapted to
// the profile. One source for both, so voice never says something the screen does not.
import type { HazardId } from '../domain/hazards.ts';
import type { ProfileConfig } from '../domain/profiles.ts';
import type { EvacuationPlan, StraightLineReason, TimeRange } from '../domain/routing.ts';
import type { MessageKey, MessageParams } from '../i18n/translate.ts';
import { formatDistance } from './format.ts';

type Translate = (key: MessageKey, params?: MessageParams) => string;

export interface PlanDescription {
  tone: 'danger' | 'safe' | 'warning';
  headline: string;
  intro: string | null;
  steps: string[];
  notes: string[];
  straightLine: boolean;
}

const STRAIGHT_LINE_REASON: Record<StraightLineReason, MessageKey> = {
  'no-graph': 'route.straightLine.noGraph',
  'far-from-network': 'route.straightLine.farFromNetwork',
  'no-path': 'route.straightLine.noPath',
};

/** "PE029" from the official code "08102PE029". */
export function shortCode(code: string): string {
  return code.replace(/^\d+/, '');
}

function tidy(sentence: string): string {
  return sentence.replace(/\s+([.,])/g, '$1').trim();
}

export function describePlan(
  plan: EvacuationPlan,
  options: {
    t: Translate;
    locale: string;
    profile: ProfileConfig;
    hazard: HazardId;
    sectorName: string;
  },
): PlanDescription {
  const { t, locale, profile, hazard, sectorName } = options;
  const distance = (meters: number) => formatDistance(meters, locale);
  const time = (range: TimeRange) => {
    if (profile.time === 'range') {
      return t('route.time.range', { fast: range.fastestMinutes, slow: range.slowestMinutes });
    }
    if (profile.time === 'slow') return t('route.time.slow', { slow: range.slowestMinutes });
    return '';
  };
  const base = { intro: null, steps: [], notes: [], straightLine: false };

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
  const intro = hazard === 'earthquake' && plan.inDangerZone ? t('route.earthquakeFirst') : null;

  if (plan.kind === 'straight-line') {
    return {
      tone,
      headline,
      intro,
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
  if (plan.metersToSafety !== null && plan.timeToSafety) {
    steps.push(
      tidy(
        t('route.toSafety', {
          distance: distance(plan.metersToSafety),
          time: time(plan.timeToSafety),
        }),
      ),
    );
  }
  if (plan.destination.kind === 'meeting-point') {
    steps.push(
      tidy(
        t(plan.inDangerZone ? 'route.toMeetingPoint' : 'route.nearestMeetingPoint', {
          code: shortCode(plan.destination.code),
          distance: distance(plan.meters),
          time: time(plan.time),
        }),
      ),
    );
  } else {
    steps.push(t('route.toSafeArea'));
  }
  return {
    tone,
    headline,
    intro,
    steps,
    notes: profile.time === 'hidden' ? [] : [t('route.timeNote')],
    straightLine: false,
  };
}

/** What the voice reads: the same sentences, in the same order. */
export function spokenText(description: PlanDescription, guardian: string | null): string {
  return [guardian, description.headline, description.intro, ...description.steps]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

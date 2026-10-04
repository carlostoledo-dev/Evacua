import { describe, expect, it } from 'vitest';
import type { HazardId } from '../domain/hazards.ts';
import { PROFILES } from '../domain/profiles.ts';
import type { EvacuationPlan } from '../domain/routing.ts';
import { esCL } from '../i18n/dictionaries/es-CL.ts';
import { translate, type MessageKey, type MessageParams } from '../i18n/translate.ts';
import { describePlan, shortCode, spokenText } from './describePlan.ts';

const t = (key: MessageKey, params?: MessageParams) => translate(esCL, key, params);
const route: EvacuationPlan = {
  kind: 'route',
  inDangerZone: true,
  destination: { kind: 'meeting-point', code: '08102PE029', coordinates: [-73.14, -37.01] },
  path: [],
  meters: 619,
  time: { fastestMinutes: 6, slowestMinutes: 12 },
  metersToSafety: 174,
  timeToSafety: { fastestMinutes: 2, slowestMinutes: 4 },
};
const describe_ = (plan: EvacuationPlan, profile = PROFILES.adult, hazard: HazardId = 'tsunami') =>
  describePlan(plan, { t, locale: 'es-CL', profile, hazard, sectorName: 'Yobilo' });

describe('describePlan', () => {
  it('adult: full time range on each step', () => {
    const d = describe_(route);
    expect(d.tone).toBe('danger');
    expect(d.steps).toEqual([
      'Sal del área de peligro: 170 m a pie (2–4 min).',
      'Luego, punto de encuentro PE029: 620 m en total (6–12 min).',
    ]);
    expect(d.notes).toHaveLength(1);
  });

  it('senior: only the gentle-pace time', () => {
    expect(describe_(route, PROFILES.senior).steps[0]).toBe(
      'Sal del área de peligro: 170 m a pie (unos 4 min a paso tranquilo).',
    );
  });

  it('child: no times and no time note', () => {
    const d = describe_(route, PROFILES.child);
    expect(d.steps[0]).toBe('Sal del área de peligro: 170 m a pie.');
    expect(d.notes).toEqual([]);
  });

  it('earthquake adds the protect-first intro inside the evacuation area', () => {
    expect(describe_(route, PROFILES.adult, 'earthquake').intro).toContain('Primero protégete');
  });

  it('describes outside-sector and straight-line plans without inventing a route', () => {
    expect(describe_({ kind: 'outside-service-area' }).headline).toContain(
      'fuera del sector piloto (Yobilo)',
    );
    const line = describe_({
      kind: 'straight-line',
      reason: 'far-from-network',
      inDangerZone: true,
      destination: { kind: 'meeting-point', code: '08102PE030', coordinates: [0, 0] },
      meters: 1460,
      bearing: 90,
      compass: 'E',
    });
    expect(line.straightLine).toBe(true);
    expect(line.steps.join(' ')).toContain('línea recta, no un camino');
    expect(line.steps.join(' ')).toContain('1,5 km en línea recta, hacia el este');
  });

  it('voice reads exactly the visible sentences, guardian message first', () => {
    const d = describe_(route, PROFILES.child);
    expect(spokenText(d, 'Busca a tu adulto.')).toBe(
      ['Busca a tu adulto.', d.headline, ...d.steps].join(' '),
    );
  });

  it('shortens official meeting point codes', () => {
    expect(shortCode('08102PE029')).toBe('PE029');
  });
});

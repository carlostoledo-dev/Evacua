import { describe, expect, it } from 'vitest';
import { esCL } from '../i18n/dictionaries/es-CL.ts';
import { translate, type MessageKey, type MessageParams } from '../i18n/translate.ts';
import { describeManeuver } from './navigationText.ts';

const t = (key: MessageKey, params?: MessageParams) => translate(esCL, key, params);

describe('describeManeuver', () => {
  it('says how far, what to do and on which street', () => {
    const text = describeManeuver(
      { kind: 'right', meters: 82, street: 'Freire' },
      'meeting-point',
      t,
      'es-CL',
    );
    expect(text.lead).toBe('En 80 m');
    expect(text.action).toBe('gira a la derecha por Freire');
    expect(text.spoken).toBe('En 80 m, gira a la derecha por Freire.');
  });

  it('says "now" close to the turn, and the key changes only then', () => {
    const ahead = describeManeuver(
      { kind: 'left', meters: 120, street: null },
      'meeting-point',
      t,
      'es-CL',
    );
    const closer = describeManeuver(
      { kind: 'left', meters: 60, street: null },
      'meeting-point',
      t,
      'es-CL',
    );
    const now = describeManeuver(
      { kind: 'left', meters: 12, street: null },
      'meeting-point',
      t,
      'es-CL',
    );
    expect(now.lead).toBe('Ahora');
    expect(ahead.key).toBe(closer.key);
    expect(now.key).not.toBe(ahead.key);
  });

  it('without turns left, it gives the remaining distance to the destination', () => {
    const text = describeManeuver(
      { kind: 'arrive', meters: 300, street: 'Yobilo' },
      'safe-area',
      t,
      'es-CL',
    );
    expect(text.spoken).toBe('300 m, sigue hasta la zona segura por Yobilo.');
  });
});

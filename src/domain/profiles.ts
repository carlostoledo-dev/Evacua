// Profiles are presets: data, not branches. UI code reads these fields instead of checking ids.

// Ordered by age: the profile picker lists them in this order.
export const PROFILE_IDS = ['child', 'adult', 'senior'] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

export interface ProfileConfig {
  id: ProfileId;
  /** Multiplier for the base font size. */
  textScale: number;
  /**
   * How walking time is shown: the full FEMA range, only the slow (mobility-impaired) pace,
   * or not at all (children follow an adult; no timing pressure).
   */
  time: 'range' | 'slow' | 'hidden';
  /** Read the instructions aloud automatically when a route appears. */
  autoSpeak: boolean;
  /** Fewer elements and bigger controls: one primary action, three steps. */
  simpleMode: boolean;
  /** Layers, 3D and "find me" buttons over the map (older adults: none, one big button). */
  mapButtons: boolean;
  /** Show "Busca a tu adulto o profesor y sigue el plan". */
  guardianMessage: boolean;
}

export const PROFILES: Readonly<Record<ProfileId, ProfileConfig>> = {
  adult: {
    id: 'adult',
    textScale: 1,
    time: 'range',
    autoSpeak: false,
    simpleMode: false,
    mapButtons: true,
    guardianMessage: false,
  },
  senior: {
    id: 'senior',
    textScale: 1.3,
    time: 'slow',
    autoSpeak: true,
    simpleMode: true,
    mapButtons: false,
    guardianMessage: false,
  },
  child: {
    id: 'child',
    textScale: 1.15,
    time: 'hidden',
    autoSpeak: false,
    simpleMode: true,
    mapButtons: true,
    guardianMessage: true,
  },
};

export const DEFAULT_PROFILE: ProfileId = 'adult';

export function isProfileId(value: unknown): value is ProfileId {
  return typeof value === 'string' && (PROFILE_IDS as readonly string[]).includes(value);
}

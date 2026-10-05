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
  /** Show "Busca a tu adulto o profesor y sigue el plan". */
  guardianMessage: boolean;
  /** Offer the game-like drill (modo simulacro). */
  drill: boolean;
}

export const PROFILES: Readonly<Record<ProfileId, ProfileConfig>> = {
  adult: {
    id: 'adult',
    textScale: 1,
    time: 'range',
    autoSpeak: false,
    simpleMode: false,
    guardianMessage: false,
    drill: false,
  },
  senior: {
    id: 'senior',
    textScale: 1.3,
    time: 'slow',
    autoSpeak: true,
    simpleMode: true,
    guardianMessage: false,
    drill: false,
  },
  child: {
    id: 'child',
    textScale: 1.15,
    time: 'hidden',
    autoSpeak: false,
    simpleMode: true,
    guardianMessage: true,
    drill: true,
  },
};

export const DEFAULT_PROFILE: ProfileId = 'adult';

export function isProfileId(value: unknown): value is ProfileId {
  return typeof value === 'string' && (PROFILE_IDS as readonly string[]).includes(value);
}

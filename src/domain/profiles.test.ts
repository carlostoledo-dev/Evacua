import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE, isProfileId, PROFILE_IDS, PROFILES } from './profiles.ts';

describe('profiles', () => {
  it('defines one preset per profile id, keyed consistently', () => {
    for (const id of PROFILE_IDS) expect(PROFILES[id].id).toBe(id);
    expect(PROFILE_IDS).toContain(DEFAULT_PROFILE);
  });

  it('senior: larger text, slow-pace time, simple mode and voice', () => {
    expect(PROFILES.senior).toMatchObject({ time: 'slow', autoSpeak: true, simpleMode: true });
    expect(PROFILES.senior.textScale).toBeGreaterThan(PROFILES.adult.textScale);
  });

  it('child: guardian message, drill mode and no timing pressure', () => {
    expect(PROFILES.child).toMatchObject({ guardianMessage: true, drill: true, time: 'hidden' });
  });

  it('validates ids', () => {
    expect(isProfileId('senior')).toBe(true);
    expect(isProfileId('admin')).toBe(false);
    expect(isProfileId(undefined)).toBe(false);
  });
});

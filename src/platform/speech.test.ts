import { describe, expect, it } from 'vitest';
import { pickVoice } from './speech.ts';

const voice = (lang: string, localService: boolean, name = lang) =>
  ({ lang, localService, name }) as SpeechSynthesisVoice;

describe('pickVoice', () => {
  it('prefers an on-device voice for the exact language, then the same language', () => {
    const exact = voice('es-CL', true);
    expect(pickVoice([voice('en-US', true), voice('es-ES', true), exact], 'es-CL')).toBe(exact);
    const sameLanguage = voice('es-ES', true);
    expect(pickVoice([voice('en-US', true), sameLanguage], 'es-CL')).toBe(sameLanguage);
  });

  it('never uses a cloud voice, even when it is the only one for the language', () => {
    const cloud = voice('es-ES', false, 'Google español');
    expect(pickVoice([cloud, voice('en-US', true)], 'es-CL')).toBeNull();
    const local = voice('es-US', true);
    expect(pickVoice([cloud, local], 'es-CL')).toBe(local);
  });

  it('uses the system default while the browser has not listed its voices', () => {
    expect(pickVoice([], 'es-CL')).toBe('default');
  });
});

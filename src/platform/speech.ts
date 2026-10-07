// Text-to-speech with the device's own voices (Web Speech API). Only voices that run on the
// device are used: some browsers also offer cloud voices (e.g. "Google español" in desktop
// Chrome) that send the text, which can name the streets around the user, to a server. When
// only such voices exist for the language, nothing is spoken; the same text is always on screen.

export type SpeakResult = 'speaking' | 'unsupported';

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

export function speechSupported(): boolean {
  return synth() !== null;
}

/**
 * An on-device voice for the language (e.g. "es-CL" → any local "es" voice); `'default'` while
 * the browser has not listed its voices yet (its default voice is the system's own); null when
 * the only voices for the language are remote.
 */
export function pickVoice(
  voices: readonly SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice | 'default' | null {
  if (voices.length === 0) return 'default';
  const local = voices.filter((v) => v.localService);
  const primary = lang.toLowerCase().split('-')[0] ?? lang;
  return (
    local.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    local.find((v) => v.lang.toLowerCase().startsWith(primary)) ??
    null
  );
}

export function speak(text: string, lang: string): SpeakResult {
  const engine = synth();
  if (!engine) return 'unsupported';
  engine.cancel(); // never stack messages
  const voice = pickVoice(engine.getVoices(), lang);
  if (voice === null) return 'unsupported';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  if (voice !== 'default') utterance.voice = voice;
  engine.speak(utterance);
  return 'speaking';
}

export function stopSpeaking(): void {
  synth()?.cancel();
}

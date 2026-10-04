// Text-to-speech with the phone's own voices (Web Speech API): no network, no external service.
// Always paired with the same text on screen; when no voice exists, the caller keeps the text.

export type SpeakResult = 'speaking' | 'unsupported';

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

export function speechSupported(): boolean {
  return synth() !== null;
}

/** Picks a voice for the language (e.g. "es-CL" → any "es" voice), or null to use the default. */
function pickVoice(engine: SpeechSynthesis, lang: string): SpeechSynthesisVoice | null {
  const voices = engine.getVoices();
  const primary = lang.toLowerCase().split('-')[0] ?? lang;
  return (
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(primary)) ??
    null
  );
}

export function speak(text: string, lang: string): SpeakResult {
  const engine = synth();
  if (!engine) return 'unsupported';
  engine.cancel(); // never stack messages
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  const voice = pickVoice(engine, lang);
  if (voice) utterance.voice = voice;
  engine.speak(utterance);
  return 'speaking';
}

export function stopSpeaking(): void {
  synth()?.cancel();
}

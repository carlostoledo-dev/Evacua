import { useCallback, useEffect, useState } from 'react';
import { speak, speechSupported, stopSpeaking } from '../../platform/speech.ts';

/** Speak/stop with a single flag; stops speaking when the component goes away. */
export function useSpeech(lang: string) {
  const [supported] = useState(speechSupported);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => stopSpeaking, []);

  const say = useCallback(
    (text: string) => {
      setSpeaking(speak(text, lang) === 'speaking');
    },
    [lang],
  );

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  return { supported, speaking, say, stop };
}

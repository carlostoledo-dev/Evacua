import { useCallback, useEffect, useRef, useState } from 'react';
import { speak, speechSupported, stopSpeaking } from '../../platform/speech.ts';

/** Speak/stop with a single flag; stops speaking when the component goes away. */
export function useSpeech(lang: string) {
  const [supported] = useState(speechSupported);
  const [speaking, setSpeaking] = useState(false);
  // Only the latest utterance may end "speaking": cancelling an earlier one also fires its end.
  const utteranceRef = useRef(0);

  useEffect(() => stopSpeaking, []);

  const say = useCallback(
    (text: string) => {
      const id = ++utteranceRef.current;
      const result = speak(text, lang, () => {
        if (utteranceRef.current === id) setSpeaking(false);
      });
      setSpeaking(result === 'speaking');
    },
    [lang],
  );

  const stop = useCallback(() => {
    utteranceRef.current++;
    stopSpeaking();
    setSpeaking(false);
  }, []);

  return { supported, speaking, say, stop };
}

import { useSyncExternalStore } from 'react';
import {
  canPromptInstall,
  isIos,
  isStandalone,
  promptInstall,
  subscribeInstall,
} from '../../platform/install.ts';

export type InstallState = 'installed' | 'prompt' | 'ios' | 'manual';

function snapshot(): InstallState {
  if (isStandalone()) return 'installed';
  if (canPromptInstall()) return 'prompt';
  if (isIos()) return 'ios';
  return 'manual';
}

/** How the app can be installed right now, and the action for the native prompt. */
export function useInstall(): { state: InstallState; install: () => Promise<unknown> } {
  const state = useSyncExternalStore(subscribeInstall, snapshot, () => 'manual' as const);
  return { state, install: promptInstall };
}

import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export type OfflineReadiness = 'pending' | 'ready' | 'unsupported' | 'error';

export interface ServiceWorkerState {
  offline: OfflineReadiness;
  updateAvailable: boolean;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

/**
 * Registers the service worker and reports whether the app is fully cached for offline use.
 * A service worker only becomes active after its precache completed, so an active
 * registration (from an earlier visit) or the first `offlineReady` event both mean "ready".
 */
export function useServiceWorker(): ServiceWorkerState {
  const [alreadyActive, setAlreadyActive] = useState(false);
  const [failed, setFailed] = useState(false);

  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration?.active) setAlreadyActive(true);
    },
    onRegisterError() {
      setFailed(true);
    },
  });

  let offline: OfflineReadiness;
  if (!('serviceWorker' in navigator)) offline = 'unsupported';
  else if (failed) offline = 'error';
  else if (offlineReady || alreadyActive) offline = 'ready';
  else offline = 'pending';

  return {
    offline,
    updateAvailable: needRefresh,
    applyUpdate: () => {
      void updateServiceWorker(true);
    },
    dismissUpdate: () => {
      setNeedRefresh(false);
    },
  };
}

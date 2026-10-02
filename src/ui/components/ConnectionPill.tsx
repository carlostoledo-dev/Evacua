import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import type { OfflineReadiness } from '../hooks/useServiceWorker.ts';
import { CheckIcon, CrossIcon, HourglassIcon, NoSignalIcon } from './icons.tsx';

interface ConnectionPillProps {
  offline: OfflineReadiness;
  online: boolean;
}

/** One compact status for the app bar: "offline" wins, then offline readiness. */
export function ConnectionPill({ offline, online }: ConnectionPillProps) {
  const { t } = useI18n();
  let state: string;
  let key: MessageKey;
  let icon: ReactNode;
  if (!online) {
    state = 'offline';
    key = 'status.pill.offline';
    icon = <NoSignalIcon />;
  } else if (offline === 'ready') {
    state = 'ready';
    key = 'status.pill.ready';
    icon = <CheckIcon />;
  } else if (offline === 'pending') {
    state = 'pending';
    key = 'status.pill.pending';
    icon = <HourglassIcon />;
  } else {
    state = 'error';
    key = 'status.pill.unavailable';
    icon = <CrossIcon />;
  }
  return (
    <p className="pill" data-state={state} role="status" data-testid="connection-pill">
      {icon}
      <span>{t(key)}</span>
    </p>
  );
}

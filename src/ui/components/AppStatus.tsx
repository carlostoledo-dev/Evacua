import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { MessageKey } from '../../i18n/translate.ts';
import type { OfflineReadiness } from '../hooks/useServiceWorker.ts';
import { CheckIcon, CrossIcon, HourglassIcon, NoSignalIcon, SignalIcon } from './icons.tsx';

const OFFLINE_STATUS: Record<OfflineReadiness, { key: MessageKey; icon: ReactNode }> = {
  ready: { key: 'status.offline.ready', icon: <CheckIcon /> },
  pending: { key: 'status.offline.pending', icon: <HourglassIcon /> },
  unsupported: { key: 'status.offline.unsupported', icon: <CrossIcon /> },
  error: { key: 'status.offline.error', icon: <CrossIcon /> },
};

interface AppStatusProps {
  offline: OfflineReadiness;
  online: boolean;
}

/** Offline readiness and connectivity, each shown with an icon and text (never color alone). */
export function AppStatus({ offline, online }: AppStatusProps) {
  const { t } = useI18n();
  const offlineStatus = OFFLINE_STATUS[offline];
  return (
    <section className="app-status" aria-label={t('status.label')}>
      <p className="status-chip" data-state={offline} role="status" data-testid="offline-status">
        {offlineStatus.icon}
        <span>{t(offlineStatus.key)}</span>
      </p>
      <p
        className="status-chip"
        data-state={online ? 'online' : 'offline'}
        role="status"
        data-testid="network-status"
      >
        {online ? <SignalIcon /> : <NoSignalIcon />}
        <span>{t(online ? 'status.network.online' : 'status.network.offline')}</span>
      </p>
    </section>
  );
}

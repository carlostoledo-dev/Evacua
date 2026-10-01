import type { LayerStatus } from '../../data/consistency.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { ShieldCheckIcon, WarningIcon } from './icons.tsx';

/** Provenance badge shown on every layer: icon + text, never color alone. */
export function LayerBadge({ status }: { status: LayerStatus }) {
  const { t } = useI18n();
  return (
    <span className="badge" data-status={status}>
      {status === 'verified' ? <ShieldCheckIcon /> : <WarningIcon />}
      <span>{t(status === 'verified' ? 'layer.badge.verified' : 'layer.badge.demo')}</span>
    </span>
  );
}

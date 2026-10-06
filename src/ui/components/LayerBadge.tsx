import type { LayerStatus } from '../../data/consistency.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { ShieldCheckIcon, WarningIcon } from './icons.tsx';

/**
 * Provenance badge shown on every layer: icon + text, never color alone.
 * `compact`: a short word on screen (the map legend); screen readers still hear the full label.
 */
export function LayerBadge({
  status,
  compact = false,
}: {
  status: LayerStatus;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const verified = status === 'verified';
  const label = t(verified ? 'layer.badge.verified' : 'layer.badge.demo');
  return (
    <span className={compact ? 'badge badge--compact' : 'badge'} data-status={status}>
      {verified ? <ShieldCheckIcon /> : <WarningIcon />}
      {compact ? (
        <>
          <span aria-hidden="true">
            {t(verified ? 'layer.badge.verifiedShort' : 'layer.badge.demoShort')}
          </span>
          <span className="visually-hidden">{label}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </span>
  );
}

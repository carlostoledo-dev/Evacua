import type { ReactNode } from 'react';
import type { LoadedLayer } from '../../data/loader.ts';
import type { LayerRole } from '../../data/schema.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { ROLE_LABEL } from '../labels.ts';
import { LayerBadge } from './LayerBadge.tsx';
import { LayersIcon } from './icons.tsx';

// Swatches repeat the map's shapes (hatch, solid line, dashed line, dot) so the legend never
// relies on color alone. Colors come from CSS custom properties shared with the theme.
const SWATCH: Record<LayerRole, ReactNode> = {
  'evacuation-area': (
    <svg viewBox="0 0 32 20" width="32" height="20" aria-hidden="true" focusable="false">
      <defs>
        <pattern
          id="legend-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="2" height="6" className="swatch-area-stroke" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="30" height="18" className="swatch-area" />
      <rect x="1" y="1" width="30" height="18" fill="url(#legend-hatch)" />
    </svg>
  ),
  'safe-line': (
    <svg viewBox="0 0 32 20" width="32" height="20" aria-hidden="true" focusable="false">
      <line x1="2" y1="10" x2="30" y2="10" className="swatch-safe-line" />
    </svg>
  ),
  'evacuation-route': (
    <svg viewBox="0 0 32 20" width="32" height="20" aria-hidden="true" focusable="false">
      <line x1="2" y1="10" x2="30" y2="10" className="swatch-route" />
    </svg>
  ),
  'meeting-point': (
    <svg viewBox="0 0 32 20" width="32" height="20" aria-hidden="true" focusable="false">
      <circle cx="16" cy="10" r="7" className="swatch-point" />
    </svg>
  ),
};

/** Collapsible legend floating over the map (native <details>: keyboard and screen readers work). */
export function MapLegend({ layers }: { layers: readonly LoadedLayer[] }) {
  const { t } = useI18n();
  return (
    <details className="map-legend" data-testid="map-legend">
      <summary>
        <LayersIcon />
        <span>{t('map.legend')}</span>
      </summary>
      <ul aria-label={t('map.legend')}>
        {layers.map((layer) => (
          <li key={layer.entry.id} data-testid={`legend-${layer.entry.id}`}>
            {SWATCH[layer.entry.role]}
            <span className="map-legend__name">{t(ROLE_LABEL[layer.entry.role])}</span>
            <LayerBadge status={layer.status} />
          </li>
        ))}
      </ul>
    </details>
  );
}

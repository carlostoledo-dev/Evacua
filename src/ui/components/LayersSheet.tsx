import type { ReactNode } from 'react';
import type { LoadedLayer } from '../../data/loader.ts';
import type { LayerRole } from '../../data/schema.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { ROLE_LABEL } from '../labels.ts';
import { LayerBadge } from './LayerBadge.tsx';
import { SheetDialog } from './SheetDialog.tsx';

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

/** Relief: a little mountain with its shaded side. */
const RELIEF_SWATCH: ReactNode = (
  <svg viewBox="0 0 32 20" width="32" height="20" aria-hidden="true" focusable="false">
    <path d="M2 18 12 5l5 6 3-3 10 10Z" className="swatch-relief" />
    <path d="M12 5 9 18h8Z" className="swatch-relief-shade" />
  </svg>
);

interface LayersSheetProps {
  open: boolean;
  onClose: () => void;
  layers: readonly LoadedLayer[];
  hidden: ReadonlySet<string>;
  onToggle: (layerId: string) => void;
  /** Null when the commune has no relief data. */
  relief: boolean | null;
  onReliefChange: (on: boolean) => void;
  threeD: boolean;
  onThreeDChange: (on: boolean) => void;
}

/**
 * "Capas", as an iOS sheet: each official layer with its legend swatch, its source badge and a
 * switch; the relief; and the 2D / 3D view. It is also the map legend (shapes, not color only).
 */
export function LayersSheet({
  open,
  onClose,
  layers,
  hidden,
  onToggle,
  relief,
  onReliefChange,
  threeD,
  onThreeDChange,
}: LayersSheetProps) {
  const { t } = useI18n();
  return (
    <SheetDialog open={open} onClose={onClose} title={t('layers.title')} testId="layers-sheet">
      <ul className="settings-list" aria-label={t('map.legend')} data-testid="map-legend">
        {layers.map((layer) => (
          <li
            key={layer.entry.id}
            className="settings-row"
            data-testid={`legend-${layer.entry.id}`}
          >
            <label className="settings-row__label">
              <span className="settings-row__icon">{SWATCH[layer.entry.role]}</span>
              <span className="settings-row__text">
                <span>{t(ROLE_LABEL[layer.entry.role])}</span>
                <LayerBadge status={layer.status} compact />
              </span>
              <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={!hidden.has(layer.entry.id)}
                onChange={() => {
                  onToggle(layer.entry.id);
                }}
              />
            </label>
          </li>
        ))}
      </ul>
      {relief !== null && (
        <div className="settings-list">
          <div className="settings-row">
            <label className="settings-row__label">
              <span className="settings-row__icon">{RELIEF_SWATCH}</span>
              <span className="settings-row__text">
                <span>{t('layers.relief')}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={relief || threeD}
                disabled={threeD}
                onChange={(event) => {
                  onReliefChange(event.target.checked);
                }}
              />
            </label>
          </div>
        </div>
      )}
      <fieldset className="segmented">
        <legend>{t('layers.view')}</legend>
        {([false, true] as const).map((on) => (
          <label key={String(on)} className="segmented__option">
            <input
              type="radio"
              name="map-view"
              checked={threeD === on}
              onChange={() => {
                onThreeDChange(on);
              }}
            />
            <span>{t(on ? 'layers.view3d' : 'layers.view2d')}</span>
          </label>
        ))}
      </fieldset>
    </SheetDialog>
  );
}

import { useId } from 'react';
import type { DemoLocation } from '../../data/schema.ts';
import { useI18n } from '../../i18n/I18nContext.ts';

interface LocationChooserProps {
  demoLocations: readonly DemoLocation[];
  onGps: () => void;
  onPick: () => void;
  onSimulate: (demo: DemoLocation) => void;
}

/** The three ways to say where you are: GPS, a tap on the map, or a labeled DEMO point. */
export function LocationChooser({
  demoLocations,
  onGps,
  onPick,
  onSimulate,
}: LocationChooserProps) {
  const { t, locale } = useI18n();
  const selectId = useId();
  return (
    <div className="location-chooser">
      <button type="button" className="button button--primary button--block" onClick={onGps}>
        {t('location.useGps')}
      </button>
      <button type="button" className="button button--block" onClick={onPick}>
        {t('location.pickOnMap')}
      </button>
      {demoLocations.length > 0 && (
        <div className="demo-select">
          <label htmlFor={selectId}>
            <span className="badge" data-status="demo">
              {t('location.demoBadge')}
            </span>{' '}
            {t('location.simulate')}
          </label>
          <select
            id={selectId}
            value=""
            onChange={(event) => {
              const demo = demoLocations.find((d) => d.id === event.target.value);
              if (demo) onSimulate(demo);
            }}
          >
            <option value="" disabled>
              {t('location.simulatePlaceholder')}
            </option>
            {demoLocations.map((demo) => (
              <option key={demo.id} value={demo.id}>
                {demo.label[locale]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

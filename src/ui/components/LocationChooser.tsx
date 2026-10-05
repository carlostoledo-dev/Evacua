import { useId, type ComponentType } from 'react';
import type { DemoLocation } from '../../data/schema.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { ChevronRightIcon, PinIcon, WalkIcon } from './icons.tsx';

interface ActionCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  primary?: boolean;
  onClick: () => void;
}

/** A big tappable card: icon, title, one-line hint and a chevron. */
function ActionCard({ icon: Icon, title, hint, primary = false, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      className={primary ? 'action-card action-card--primary' : 'action-card'}
      onClick={onClick}
    >
      <span className="action-card__badge">
        <Icon className="icon action-card__icon" />
      </span>
      <span className="action-card__text">
        <strong>{title}</strong>
        <span>{hint}</span>
      </span>
      <ChevronRightIcon className="icon action-card__chevron" />
    </button>
  );
}

interface LocationChooserProps {
  demoLocations: readonly DemoLocation[];
  /** Simple mode: one primary button (GPS); the other options are folded away. */
  simple: boolean;
  onGps: () => void;
  onPick: () => void;
  onSimulate: (demo: DemoLocation) => void;
}

/** The three ways to say where you are: GPS, a tap on the map, or a labeled DEMO point. */
export function LocationChooser({
  demoLocations,
  simple,
  onGps,
  onPick,
  onSimulate,
}: LocationChooserProps) {
  const { t, locale } = useI18n();
  const selectId = useId();

  const others = (
    <>
      <ActionCard
        icon={PinIcon}
        title={t('location.pickOnMap')}
        hint={t('location.pickOnMapHint')}
        onClick={onPick}
      />
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
    </>
  );

  return (
    <div className={simple ? 'location-chooser location-chooser--simple' : 'location-chooser'}>
      <ActionCard
        icon={WalkIcon}
        title={t('location.findRoute')}
        hint={t('location.useGps')}
        primary
        onClick={onGps}
      />
      {simple ? (
        <details className="more-options">
          <summary>{t('route.moreOptions')}</summary>
          <div className="location-chooser">{others}</div>
        </details>
      ) : (
        others
      )}
    </div>
  );
}

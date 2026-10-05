import { lazy, Suspense, type CSSProperties } from 'react';
import type { LoadedLayer } from '../../data/loader.ts';
import type { DemoLocation } from '../../data/schema.ts';
import type { HazardId } from '../../domain/hazards.ts';
import type { ProfileConfig } from '../../domain/profiles.ts';
import type { EvacuationPlan } from '../../domain/routing.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { HazardSelector } from '../components/HazardSelector.tsx';
import { MapLegend } from '../components/MapLegend.tsx';
import { RoutePanel } from '../components/RoutePanel.tsx';
import type { CommuneState } from '../hooks/useCommuneData.ts';
import { useElementHeight } from '../hooks/useElementHeight.ts';
import { locationPosition, type LocationState } from '../hooks/useLocation.ts';
import type { Theme } from '../theme.ts';

// MapLibre is large; it is only downloaded once there is data to draw.
const MapView = lazy(() => import('../map/MapView.tsx'));

export interface LocationActions {
  locateWithGps: () => void;
  simulate: (demoId: string, position: [number, number]) => void;
  startPicking: () => void;
  pick: (position: [number, number]) => void;
  clear: () => void;
}

interface MapScreenProps {
  active: boolean;
  commune: CommuneState;
  hazard: HazardId;
  onHazardChange: (hazard: HazardId) => void;
  visibleLayers: readonly LoadedLayer[];
  theme: Theme;
  onShowData: () => void;
  location: LocationState;
  locationActions: LocationActions;
  plan: EvacuationPlan | null;
  profile: ProfileConfig;
}

const NO_DEMO_LOCATIONS: readonly DemoLocation[] = [];

/**
 * Stays mounted while other screens are shown (hidden), so the map is not rebuilt on every
 * tab switch; a hidden map does not render, so it costs no battery.
 */
export function MapScreen({
  active,
  commune,
  hazard,
  onHazardChange,
  visibleLayers,
  theme,
  onShowData,
  location,
  locationActions,
  plan,
  profile,
}: MapScreenProps) {
  const { t } = useI18n();
  const [topRef, topHeight] = useElementHeight();
  const [sheetRef, sheetHeight] = useElementHeight();
  const route = plan?.kind === 'route' ? plan : null;
  const overlay = {
    position: locationPosition(location),
    path: route?.path ?? null,
    destination:
      route?.destination.coordinates ??
      (plan?.kind === 'straight-line' ? plan.destination.coordinates : null),
  };
  const demoLocations =
    commune.status === 'ready' ? commune.data.manifest.demoLocations : NO_DEMO_LOCATIONS;

  return (
    <section
      className="screen screen--map"
      aria-labelledby="view-title-map"
      hidden={!active}
      style={
        {
          '--top-h': `${String(topHeight)}px`,
          '--sheet-h': `${String(sheetHeight)}px`,
        } as CSSProperties
      }
    >
      <h1 id="view-title-map" className="visually-hidden" tabIndex={-1}>
        {t('map.title')}
      </h1>
      <div className="map-area" data-tour="map">
        {commune.status === 'ready' && (
          <>
            <Suspense
              fallback={
                <p className="map-placeholder" role="status">
                  {t('map.loading')}
                </p>
              }
            >
              <MapView
                commune={commune.data}
                hazard={hazard}
                theme={theme}
                overlay={overlay}
                picking={location.kind === 'picking'}
                onPick={locationActions.pick}
                demo={location.kind === 'demo'}
                insets={{ top: topHeight, bottom: sheetHeight }}
              />
            </Suspense>
            <MapLegend layers={visibleLayers} />
          </>
        )}
        {commune.status === 'loading' && (
          <p className="map-placeholder" role="status">
            {t('data.loading')}
          </p>
        )}
        {commune.status === 'error' && (
          <div className="map-placeholder" role="alert">
            <p>{t('map.dataError')}</p>
            <button type="button" className="button button--primary" onClick={onShowData}>
              {t('map.showData')}
            </button>
          </div>
        )}
      </div>
      <div className="map-top" ref={topRef} data-tour="hazard">
        <HazardSelector value={hazard} onChange={onHazardChange} compact />
      </div>
      {commune.status === 'ready' && (
        <div className="map-sheet" ref={sheetRef}>
          <RoutePanel
            location={location}
            plan={plan}
            hazard={hazard}
            profile={profile}
            sectorName={commune.data.manifest.sector.name}
            demoLocations={demoLocations}
            onGps={locationActions.locateWithGps}
            onPick={locationActions.startPicking}
            onSimulate={(demo) => {
              locationActions.simulate(demo.id, demo.coordinates);
            }}
            onClear={locationActions.clear}
          />
        </div>
      )}
    </section>
  );
}

import { lazy, Suspense, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { LoadedLayer } from '../../data/loader.ts';
import type { DemoLocation } from '../../data/schema.ts';
import { headingAlong, nextManeuver } from '../../domain/navigation.ts';
import type { ProfileConfig } from '../../domain/profiles.ts';
import type { EvacuationPlan } from '../../domain/routing.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { ArrivedScreen } from '../components/ArrivedScreen.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { ChevronRightIcon, MenuIcon, WarningIcon } from '../components/icons.tsx';
import { LayersSheet } from '../components/LayersSheet.tsx';
import { MenuSheet } from '../components/MainMenu.tsx';
import { NavigationBanner } from '../components/NavigationBanner.tsx';
import { RoutePanel } from '../components/RoutePanel.tsx';
import { formatShortTime, shortCode } from '../describePlan.ts';
import { formatDistance } from '../format.ts';
import type { CommuneState } from '../hooks/useCommuneData.ts';
import { useElementHeight } from '../hooks/useElementHeight.ts';
import { locationPosition, type LocationState } from '../hooks/useLocation.ts';
import { useNavigation } from '../hooks/useNavigation.ts';
import { describeManeuver } from '../navigationText.ts';
import type { Theme } from '../theme.ts';
import type { View } from '../views.ts';

// MapLibre is large: it is a separate chunk, but its download starts as soon as this screen's
// module loads, in parallel with the sector data, instead of after it.
const mapViewModule = import('../map/MapView.tsx');
const MapView = lazy(() => mapViewModule);

export interface LocationActions {
  locateWithGps: () => void;
  track: () => void;
  stopTracking: () => void;
  simulate: (demoId: string | null, position: [number, number]) => void;
  startPicking: () => void;
  pick: (position: [number, number]) => void;
  clear: () => void;
}

interface MapScreenProps {
  active: boolean;
  commune: CommuneState;
  visibleLayers: readonly LoadedLayer[];
  theme: Theme;
  onShowData: () => void;
  location: LocationState;
  locationActions: LocationActions;
  plan: EvacuationPlan | null;
  profile: ProfileConfig;
  /** The offline status icon and the "new version" prompt, shown with the notice on top. */
  status: ReactNode;
  prompt: ReactNode;
  /** Opens one of the screens behind the map. */
  onNavigate: (view: Exclude<View, 'map'>) => void;
  onReplayTour: () => void;
}

const NO_DEMO_LOCATIONS: readonly DemoLocation[] = [];
/** The route sheet floats this far above the bottom edge (`.map-sheet` bottom: 0.5rem). */
const SHEET_GAP_PX = 8;

/**
 * The map screen, as in the design: cards on top (danger or the next turn, and the permanent
 * notice), the map with its buttons, and the route sheet at the bottom; layers and the quick
 * menu open as sheets, and arriving fills the screen.
 *
 * Stays mounted while other screens are shown (hidden), so the map is not rebuilt each time; a
 * hidden map does not render, so it costs no battery.
 */
export function MapScreen({
  active,
  commune,
  visibleLayers,
  theme,
  onShowData,
  location,
  locationActions,
  plan,
  profile,
  status,
  prompt,
  onNavigate,
  onReplayTour,
}: MapScreenProps) {
  const { t, locale } = useI18n();
  const [topRef, topHeight] = useElementHeight();
  const [sheetRef, sheetHeight] = useElementHeight();
  const route = plan?.kind === 'route' ? plan : null;
  const navigation = useNavigation(location, plan, locationActions);
  const guiding = navigation.active && !navigation.arrived ? route : null;
  const maneuver = useMemo(
    () => (guiding ? nextManeuver(guiding.path, guiding.streets) : null),
    [guiding],
  );
  const maneuverText =
    maneuver && guiding ? describeManeuver(maneuver, guiding.destination.kind, t, locale) : null;

  // Map view state, set from the map buttons and the layers sheet.
  const [threeD, setThreeD] = useState(false);
  const [relief, setRelief] = useState(false);
  const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<string>>(() => new Set());
  const [layersOpen, setLayersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Route details under the summary; a new kind of location starts with the summary only.
  const [expandedFor, setExpandedFor] = useState<LocationState['kind'] | null>(null);
  const expanded = expandedFor === location.kind;
  // Swiped all the way down: only a slim bar, to see the most map. Also per location kind.
  const [minimizedFor, setMinimizedFor] = useState<LocationState['kind'] | null>(null);
  const minimized = minimizedFor === location.kind;
  const setMinimized = (on: boolean) => {
    setMinimizedFor(on ? location.kind : null);
  };
  const setExpanded = (open: boolean) => {
    setExpandedFor(open ? location.kind : null);
  };

  const overlay = {
    heading: guiding ? headingAlong(guiding.path) : null,
    position: locationPosition(location),
    path: route?.path ?? null,
    endsOffStreet: route?.destination.kind === 'meeting-point',
    destination:
      route?.destination.coordinates ??
      (plan?.kind === 'straight-line' ? plan.destination.coordinates : null),
    destinationLabel:
      route?.destination.kind === 'meeting-point'
        ? shortCode(route.destination.code)
        : plan?.kind === 'straight-line'
          ? shortCode(plan.destination.code)
          : route
            ? t('route.goHere')
            : null,
  };
  // The map runs under the floating cards and sheet; these are the parts that stay uncovered.
  const insets = {
    top: topHeight,
    bottom: sheetHeight > 0 ? sheetHeight + SHEET_GAP_PX : 0,
  };
  const demoLocations =
    commune.status === 'ready' ? commune.data.manifest.demoLocations : NO_DEMO_LOCATIONS;
  const inDanger =
    plan !== null && 'inDangerZone' in plan && plan.inDangerZone && !navigation.active;

  const routeTime = route ? formatShortTime(route.time, profile, t) : null;
  const menuSummary = route
    ? {
        title:
          route.destination.kind === 'meeting-point'
            ? shortCode(route.destination.code)
            : t('route.item.safeArea'),
        subtitle: routeTime
          ? t('route.summary', { distance: formatDistance(route.meters, locale), time: routeTime })
          : formatDistance(route.meters, locale),
      }
    : null;
  const stopAndClear = () => {
    navigation.stop();
    locationActions.clear();
  };

  return (
    <section
      className="screen screen--map"
      aria-labelledby="view-title-map"
      hidden={!active}
      style={
        {
          '--top-h': `${String(insets.top)}px`,
          '--sheet-h': `${String(insets.bottom)}px`,
        } as CSSProperties
      }
    >
      <h1 id="view-title-map" className="visually-hidden" tabIndex={-1}>
        {t('map.title')}
      </h1>
      <div className="map-area" data-tour="map">
        {commune.status === 'ready' && (
          <Suspense
            fallback={
              <p className="map-placeholder" role="status">
                {t('map.loading')}
              </p>
            }
          >
            <MapView
              commune={commune.data}
              theme={theme}
              overlay={overlay}
              picking={location.kind === 'picking'}
              onPick={locationActions.pick}
              demo={location.kind === 'demo'}
              insets={insets}
              onLocate={locationActions.locateWithGps}
              follow={navigation.active}
              threeD={threeD}
              onThreeDChange={setThreeD}
              hiddenLayers={hiddenLayers}
              relief={relief}
              onOpenLayers={() => {
                setLayersOpen(true);
              }}
              simple={!profile.mapButtons}
            />
          </Suspense>
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

      {/* Cards on top: the next turn or the danger, then the permanent notice and the status. */}
      <div className="map-top" ref={topRef}>
        {maneuver && maneuverText ? (
          <NavigationBanner kind={maneuver.kind} text={maneuverText} onClose={navigation.stop} />
        ) : (
          inDanger && (
            <button
              type="button"
              className="danger-card"
              data-testid="danger-card"
              aria-expanded={route ? expanded : undefined}
              onClick={() => {
                if (!route) return;
                setMinimized(false);
                setExpanded(true);
              }}
            >
              <WarningIcon className="icon danger-card__icon" />
              <span className="danger-card__text">
                <strong>{t('danger.title')}</strong>
                <span>
                  {route?.destination.kind === 'safe-area'
                    ? t('danger.bodySafe')
                    : t('danger.bodyMeeting')}
                </span>
              </span>
              {route && <ChevronRightIcon className="icon" />}
            </button>
          )
        )}
        <div className="map-top__row">
          <div className="map-top__notice" data-tour="disclaimer">
            <Disclaimer
              onMore={() => {
                onNavigate('guide');
              }}
            />
          </div>
          {status}
        </div>
        {prompt}
      </div>

      <div className="map-sheet" ref={sheetRef}>
        {commune.status === 'ready' ? (
          <RoutePanel
            location={location}
            plan={plan}
            profile={profile}
            sectorName={commune.data.manifest.sector.name}
            demoLocations={demoLocations}
            onGps={locationActions.locateWithGps}
            onPick={locationActions.startPicking}
            onSimulate={(demo) => {
              locationActions.simulate(demo.id, demo.coordinates);
            }}
            onClear={stopAndClear}
            navigation={navigation}
            maneuverText={maneuverText}
            expanded={expanded}
            onExpandedChange={setExpanded}
            minimized={minimized}
            onMinimizedChange={setMinimized}
            onOpenMenu={() => {
              setMenuOpen(true);
            }}
          />
        ) : (
          // No sector data yet (or it failed): ≡ still leads to "Datos" and "Ajustes".
          <div className="route-panel glass-sheet menu-sheet">
            <button
              type="button"
              className="menu-button"
              aria-label={t('nav.menu')}
              aria-haspopup="dialog"
              onClick={() => {
                setMenuOpen(true);
              }}
            >
              <MenuIcon className="icon" />
            </button>
          </div>
        )}
      </div>

      {commune.status === 'ready' && (
        <LayersSheet
          open={layersOpen}
          onClose={() => {
            setLayersOpen(false);
          }}
          layers={visibleLayers}
          hidden={hiddenLayers}
          onToggle={(id) => {
            setHiddenLayers((current) => {
              const next = new Set(current);
              if (!next.delete(id)) next.add(id);
              return next;
            });
          }}
          relief={commune.data.manifest.terrain ? relief : null}
          onReliefChange={setRelief}
          threeD={threeD}
          onThreeDChange={setThreeD}
        />
      )}
      <MenuSheet
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
        }}
        onOpen={onNavigate}
        summary={menuSummary}
        onChangeLocation={'position' in location ? stopAndClear : null}
        onReplayTour={onReplayTour}
      />

      {navigation.active && navigation.arrived && route && (
        <ArrivedScreen
          destination={route.destination}
          demo={navigation.mode === 'demo'}
          onMoreInfo={() => {
            navigation.stop();
            onNavigate('guide');
          }}
          onFinish={navigation.stop}
        />
      )}
    </section>
  );
}

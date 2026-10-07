// Lazy-loaded map chunk: MapLibre is only downloaded when the map is shown.
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
  type LngLatBoundsLike,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Bundled worker served from our own origin: no blob: workers, so the strict CSP holds.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useRef, useState } from 'react';
import type { CommuneData } from '../../data/loader.ts';
import {
  MAP_3D_ZOOM,
  MAP_3D_PITCH_DEG,
  MAP_3D_TERRAIN_EXAGGERATION,
} from '../../domain/constants.ts';
import { layersForHazard, type HazardId } from '../../domain/hazards.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import { CompassIcon, LayersIcon, LocateIcon } from '../components/icons.tsx';
import type { Theme } from '../theme.ts';
import { diagonalHatch } from './hatch.ts';
import {
  labelPillIcon,
  meetingPointIcon,
  navigationArrowIcon,
  routeChevronIcon,
} from './meetingPointIcon.ts';
import {
  buildStyle,
  DARK_PALETTE,
  DESTINATION_SOURCE,
  HATCH_IMAGE_ID,
  HILLSHADE_LAYER_ID,
  LABEL_PILL_ICON_ID,
  LIGHT_PALETTE,
  MEETING_POINT_ICON_ID,
  NAV_ARROW_ICON_ID,
  overlayLayerIds,
  ROUTE_CHEVRON_ICON_ID,
  TERRAIN_SOURCE,
  USER_POSITION_SOURCE,
  USER_ROUTE_SOURCE,
  type MapPalette,
} from './style.ts';

setWorkerUrl(workerUrl);

type MapState = 'loading' | 'ready' | 'error';

/** What the app draws on top of the official layers for the current user. */
export interface UserOverlay {
  position: [number, number] | null;
  path: [number, number][] | null;
  destination: [number, number] | null;
  /** While navigating: direction to walk now, in degrees from north. */
  heading: number | null;
  /** Shown in the green pill under the destination (its meeting point code). */
  destinationLabel: string | null;
}

/** Camera moves glide (as on iOS) unless the system asks for reduced motion. */
function motionMs(ms: number): number {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
  } catch {
    return 0;
  }
}

/** Pads [w, s, e, n] by a fraction of its size, so the edges stay reachable when panning. */
function padBounds([w, s, e, n]: readonly number[], ratio: number): LngLatBoundsLike {
  const dx = ((e ?? 0) - (w ?? 0)) * ratio;
  const dy = ((n ?? 0) - (s ?? 0)) * ratio;
  return [
    [(w ?? 0) - dx, (s ?? 0) - dy],
    [(e ?? 0) + dx, (n ?? 0) + dy],
  ];
}

function pointCollection(
  point: [number, number] | null,
  properties: Record<string, number | string> = {},
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: point
      ? [{ type: 'Feature', properties, geometry: { type: 'Point', coordinates: point } }]
      : [],
  };
}

function lineCollection(path: [number, number][] | null): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features:
      path && path.length > 1
        ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: path } }]
        : [],
  };
}

interface MapViewProps {
  commune: CommuneData;
  hazard: HazardId;
  theme: Theme;
  overlay: UserOverlay;
  /** When true, the next tap on the map reports a position through `onPick`. */
  picking: boolean;
  onPick: (position: [number, number]) => void;
  /** The position is simulated: a DEMO label must be visible on the map. */
  demo: boolean;
  /** Heights (px) covered by floating glass panels, kept clear when framing the route. */
  insets: { top: number; bottom: number };
  /** The map's "find me" button: one GPS reading. */
  onLocate: () => void;
  /** Navigation: keep the camera on the user instead of framing the whole route. */
  follow: boolean;
  /** 3D view (tilted camera over the exaggerated relief), switched from the layers sheet too. */
  threeD: boolean;
  onThreeDChange: (on: boolean) => void;
  /** Official layers the user switched off in the layers sheet. */
  hiddenLayers: ReadonlySet<string>;
  /** Hill shading on the flat map too (always on in 3D). */
  relief: boolean;
  /** Opens the layers sheet. */
  onOpenLayers: () => void;
  /**
   * Simple mode (older adults, children): no buttons over the map, so the sheet's one big
   * button is the only thing to press. The map still pans and zooms with the fingers.
   */
  simple: boolean;
}

/** Highest device pixel ratio we render at: 3× screens cost ~2× the GPU work for little gain. */
const MAX_PIXEL_RATIO = 2;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function MapView({
  commune,
  hazard,
  theme,
  overlay,
  picking,
  onPick,
  demo,
  insets,
  onLocate,
  follow,
  threeD,
  onThreeDChange,
  hiddenLayers,
  relief,
  onOpenLayers,
  simple,
}: MapViewProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  // Without WebGL the map cannot exist; say so instead of failing silently.
  const [state, setState] = useState<MapState>(() => (supportsWebGL() ? 'loading' : 'error'));
  // Bumped each time a (re)created map finished loading its style, so dependent effects re-run.
  const [mapVersion, setMapVersion] = useState(0);
  const pickingRef = useRef(picking);
  const onPickRef = useRef(onPick);
  const onLocateRef = useRef(onLocate);
  // Whole degrees the map is turned from north (3D view only); shows the compass when not 0.
  const [bearing, setBearing] = useState(0);
  useEffect(() => {
    pickingRef.current = picking;
    onPickRef.current = onPick;
    onLocateRef.current = onLocate;
  });

  // (Re)create the map per commune, language (labels) and theme (palette).
  useEffect(() => {
    const element = containerRef.current;
    if (!element || state === 'error') return;
    const palette: MapPalette = theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
    const { manifest, layers } = commune;
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: element,
        style: buildStyle({
          basemap: manifest.basemap,
          layers,
          palette,
          origin: window.location.origin,
          youLabel: t('route.you'),
          tileBounds: manifest.bounds,
          terrain: manifest.terrain,
        }),
        bounds: padBounds(manifest.sector.serviceArea, 0.05),
        // Never show beyond the data bounds: the clipped edge of the evacuation area there is
        // artificial and could be misread as its real limit.
        maxBounds: padBounds(manifest.bounds, 0),
        minZoom: manifest.basemap.minzoom,
        maxZoom: 18,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        // Battery and low-end phones: no label fade animations, capped resolution, one world copy.
        fadeDuration: 0,
        pixelRatio: Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
        renderWorldCopies: false,
        locale: {
          'Map.Title': t('map.title'),
          'AttributionControl.ToggleAttribution': t('map.attribution'),
        },
      });
    } catch {
      // Rare (e.g. WebGL context lost right away). Report it after this effect finishes.
      queueMicrotask(() => {
        setState('error');
      });
      return;
    }
    mapRef.current = map;
    map.on('rotate', () => {
      setBearing(Math.round(map.getBearing()));
    });
    // Flat map: north always up (fewer ways to get lost). The 3D view allows turning.
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    // Bottom-left, lifted above the route sheet by CSS (--sheet-h), clear of the buttons.
    map.addControl(new AttributionControl({ compact: false }), 'bottom-left');
    map.setMissingStyleImageResolver((id) => {
      if (id === HATCH_IMAGE_ID && !map.hasImage(id)) {
        map.addImage(id, diagonalHatch(palette.evacuationArea));
      }
      if (id === NAV_ARROW_ICON_ID && !map.hasImage(id)) {
        const icon = navigationArrowIcon(palette.userRoute, palette.userRouteCasing);
        if (icon) map.addImage(id, icon.image, { pixelRatio: icon.pixelRatio });
      }
      if (id === ROUTE_CHEVRON_ICON_ID && !map.hasImage(id)) {
        const icon = routeChevronIcon(palette.userRouteCasing);
        if (icon) map.addImage(id, icon.image, { pixelRatio: icon.pixelRatio });
      }
      if (id === LABEL_PILL_ICON_ID && !map.hasImage(id)) {
        // Dark green in both themes: white text on it stays above 4.5:1.
        const pill = labelPillIcon('#0b6e3a', '#ffffff');
        if (pill) {
          const { image, ...options } = pill;
          map.addImage(id, image, options);
        }
      }
      if (id === MEETING_POINT_ICON_ID && !map.hasImage(id)) {
        const icon = meetingPointIcon(palette.meetingPoint, palette.meetingPointStroke);
        if (icon) map.addImage(id, icon.image, { pixelRatio: icon.pixelRatio });
      }
    });
    map.on('load', () => {
      setMapVersion((v) => v + 1);
    });
    map.once('idle', () => {
      setState('ready');
    });
    map.on('error', (event) => {
      // A single missing tile is not a broken map; only a style that cannot load is.
      if ('tile' in event) return;
      if (!map.loaded()) setState('error');
    });
    map.on('click', (event) => {
      if (pickingRef.current) onPickRef.current([event.lngLat.lng, event.lngLat.lat]);
    });
    return () => {
      mapRef.current = null;
      map.remove();
    };
    // `state` only gates creation; it must not trigger a rebuild when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps
  }, [commune, t, theme]);

  // Show only the layers relevant to the selected hazard, minus those switched off by the user.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapVersion === 0) return;
    const visible = new Set(
      layersForHazard(
        hazard,
        commune.layers.map((l) => l.entry),
      ).map((e) => e.id),
    );
    for (const layer of commune.layers) {
      for (const id of overlayLayerIds(layer)) {
        if (map.getLayer(id)) {
          const shown = visible.has(layer.entry.id) && !hiddenLayers.has(layer.entry.id);
          map.setLayoutProperty(id, 'visibility', shown ? 'visible' : 'none');
        }
      }
    }
  }, [hazard, commune, mapVersion, hiddenLayers]);

  // Hill shading: with the 3D relief, or on the flat map when "Relieve" is on.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapVersion === 0 || !map.getLayer(HILLSHADE_LAYER_ID)) return;
    map.setLayoutProperty(HILLSHADE_LAYER_ID, 'visibility', threeD || relief ? 'visible' : 'none');
  }, [threeD, relief, mapVersion]);

  // Read by the 3D toggle without re-running it on every position update.
  const viewRef = useRef({ position: overlay.position, insets, threeD });
  useEffect(() => {
    viewRef.current = { position: overlay.position, insets, threeD };
  });

  // 3D view on/off: relief (exaggerated, labeled), hill shading and a tilted camera.
  // Turning it on brings the user's position (if any) to the middle of the visible map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapVersion === 0) return;
    if (map.getSource(TERRAIN_SOURCE)) {
      map.setTerrain(
        threeD ? { source: TERRAIN_SOURCE, exaggeration: MAP_3D_TERRAIN_EXAGGERATION } : null,
      );
    }
    if (threeD) {
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();
      map.keyboard.enableRotation();
    } else {
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      map.easeTo({ pitch: 0, bearing: 0, duration: motionMs(600) });
      return;
    }
    const { position, insets: clear } = viewRef.current;
    map.easeTo({
      center: position ?? map.getCenter(),
      zoom: Math.min(Math.max(map.getZoom(), MAP_3D_ZOOM.min), MAP_3D_ZOOM.max),
      pitch: MAP_3D_PITCH_DEG,
      // That point sits in the middle of the part the panels leave clear (a camera offset,
      // not map padding, so later route framing is unaffected).
      offset: position ? [0, (clear.top - clear.bottom) / 2] : [0, 0],
      duration: motionMs(700),
    });
  }, [threeD, mapVersion]);

  // Draw the user's position, route and destination, and glide the camera to frame them.
  const { position, path, destination, heading, destinationLabel } = overlay;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapVersion === 0) return;
    void map.getSource<GeoJSONSource>(USER_ROUTE_SOURCE)?.setData(lineCollection(path));
    void map
      .getSource<GeoJSONSource>(USER_POSITION_SOURCE)
      ?.setData(pointCollection(position, heading === null ? {} : { bearing: heading }));
    void map
      .getSource<GeoJSONSource>(DESTINATION_SOURCE)
      ?.setData(pointCollection(destination, { label: destinationLabel ?? '' }));
    // Navigating: follow the walker at street level, gliding between positions. Flat map:
    // north up. 3D view: the map turns with the walker, like a car navigator.
    if (follow && position) {
      const courseUp = viewRef.current.threeD && heading !== null;
      // Padding keeps the walker in the visible part of the map, above the route sheet.
      map.easeTo({
        center: position,
        zoom: Math.max(map.getZoom(), 17),
        padding: { top: insets.top, bottom: insets.bottom, left: 0, right: 0 },
        ...(courseUp ? { bearing: heading } : {}),
        duration: motionMs(450),
      });
      return;
    }
    const points = path && path.length > 1 ? path : position ? [position] : [];
    const first = points[0];
    if (!first) return;
    if (points.length === 1) {
      map.easeTo({ center: first, zoom: Math.max(map.getZoom(), 15), duration: motionMs(600) });
    } else {
      const bounds = points.reduce((b, p) => b.extend(p), new LngLatBounds(first, first));
      // Keep the route clear of the floating panels, the controls, the DEMO label and the
      // "go here" label above the destination. Margins shrink with the visible map: on a short
      // phone screen fixed ones would leave no room, and MapLibre would skip the fit.
      const { clientWidth: width, clientHeight: height } = map.getContainer();
      const room = Math.max(0, height - insets.top - insets.bottom);
      map.fitBounds(bounds, {
        padding: {
          top: insets.top + Math.min(120, room * 0.4),
          right: Math.min(72, width * 0.18),
          bottom: insets.bottom + Math.min(40, room * 0.1),
          left: Math.min(56, width * 0.12),
        },
        duration: motionMs(700),
        maxZoom: 17,
      });
    }
  }, [
    position,
    path,
    destination,
    destinationLabel,
    heading,
    follow,
    mapVersion,
    insets.top,
    insets.bottom,
  ]);

  return (
    <div
      className={['map-frame', picking && 'map-frame--picking', threeD && 'map-frame--3d']
        .filter(Boolean)
        .join(' ')}
      data-testid="map"
      data-state={state}
      data-route={path && path.length > 1 ? 'shown' : 'none'}
    >
      <div ref={containerRef} className="map-canvas" />
      {/* Map buttons in one column at the bottom right, above the sheet, so they never pile up
          on a short screen: layers (not while navigating), 3D, the compass while the map is
          turned, and "find me". Zoom is pinch, scroll or keyboard. */}
      {!simple && (
        <div className="map-buttons" data-tour="map-buttons">
          {!follow && (
            <button
              type="button"
              className="map-button"
              aria-label={t('map.layers')}
              title={t('map.layers')}
              data-testid="layers-button"
              onClick={onOpenLayers}
            >
              <LayersIcon className="icon" />
            </button>
          )}
          <button
            type="button"
            className="map-button map-3d"
            aria-pressed={threeD}
            aria-label={t('map.view3d')}
            title={t('map.view3d')}
            onClick={() => {
              onThreeDChange(!threeD);
            }}
          >
            {t('map.view3dShort')}
          </button>
          {bearing !== 0 && (
            <button
              type="button"
              className="map-button map-compass"
              aria-label={t('map.resetNorth')}
              title={t('map.resetNorth')}
              onClick={() => {
                mapRef.current?.easeTo({ bearing: 0, duration: motionMs(400) });
              }}
            >
              {/* The needle keeps pointing north while the map turns. */}
              <span
                className="map-compass__needle"
                style={{ transform: `rotate(${String(-bearing)}deg)` }}
              >
                <CompassIcon className="icon" />
              </span>
            </button>
          )}
          <button
            type="button"
            className="map-button map-locate"
            aria-label={t('map.locate')}
            title={t('map.locate')}
            onClick={() => {
              onLocateRef.current();
            }}
          >
            <LocateIcon className="icon" />
          </button>
        </div>
      )}
      <div className="map-chips">
        {demo && (
          <p className="map-chip map-chip--demo" data-testid="map-demo">
            {t('location.demoBadge')}
          </p>
        )}
        {threeD && (
          <p className="map-chip" data-testid="map-3d-note">
            {t('map.reliefNote', { factor: MAP_3D_TERRAIN_EXAGGERATION })}
          </p>
        )}
      </div>
      {state === 'loading' && (
        <p className="map-overlay" role="status">
          {t('map.loading')}
        </p>
      )}
      {state === 'error' && (
        <p className="map-overlay map-overlay--error" role="alert">
          {t('map.error')}
        </p>
      )}
    </div>
  );
}

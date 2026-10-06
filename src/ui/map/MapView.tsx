// Lazy-loaded map chunk: MapLibre is only downloaded when the map is shown.
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type GeoJSONSource,
  type IControl,
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
import type { Theme } from '../theme.ts';
import { diagonalHatch } from './hatch.ts';
import { meetingPointIcon, navigationArrowIcon } from './meetingPointIcon.ts';
import {
  buildStyle,
  DARK_PALETTE,
  DESTINATION_SOURCE,
  HATCH_IMAGE_ID,
  HILLSHADE_LAYER_ID,
  LIGHT_PALETTE,
  MEETING_POINT_ICON_ID,
  NAV_ARROW_ICON_ID,
  overlayLayerIds,
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
  properties: Record<string, number> = {},
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

const SVG_NS = 'http://www.w3.org/2000/svg';

/** "Find me" button under the zoom buttons: asks for one GPS reading (same as the sheet's card). */
class LocateControl implements IControl {
  private container: HTMLDivElement | null = null;
  private readonly label: string;
  private readonly onClick: () => void;

  constructor(label: string, onClick: () => void) {
    this.label = label;
    this.onClick = onClick;
  }

  onAdd(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-locate';
    button.title = this.label;
    button.setAttribute('aria-label', this.label);
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M20 4 4 11l7 2 2 7 7-16Z');
    svg.append(arrow);
    button.append(svg);
    button.addEventListener('click', this.onClick);
    container.append(button);
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = null;
  }
}

/** "3D" toggle above the "find me" button: tilts the map over the relief. */
class ThreeDControl implements IControl {
  private container: HTMLDivElement | null = null;
  private button: HTMLButtonElement | null = null;
  private readonly label: string;
  private readonly onToggle: () => void;

  constructor(label: string, onToggle: () => void) {
    this.label = label;
    this.onToggle = onToggle;
  }

  onAdd(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-3d';
    button.title = this.label;
    button.setAttribute('aria-label', this.label);
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '3D';
    button.addEventListener('click', this.onToggle);
    container.append(button);
    this.container = container;
    this.button = button;
    return container;
  }

  setPressed(pressed: boolean): void {
    this.button?.setAttribute('aria-pressed', String(pressed));
  }

  onRemove(): void {
    this.container?.remove();
    this.container = null;
    this.button = null;
  }
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
  // 3D view: tilted camera and extruded buildings. Kept across map rebuilds (theme, language).
  const [threeD, setThreeD] = useState(false);
  const threeDControlRef = useRef<ThreeDControl | null>(null);
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
          goHereLabel: t('route.goHere'),
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
          'NavigationControl.ZoomIn': t('map.zoomIn'),
          'NavigationControl.ZoomOut': t('map.zoomOut'),
          'NavigationControl.ResetBearing': t('map.resetNorth'),
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
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    const threeDControl = new ThreeDControl(t('map.view3d'), () => {
      setThreeD((on) => !on);
    });
    threeDControlRef.current = threeDControl;
    map.addControl(threeDControl, 'top-right');
    // Compass: only shown in 3D (CSS), where the map can be turned; a tap points it north.
    map.addControl(
      new NavigationControl({ showZoom: false, showCompass: true, visualizePitch: false }),
      'top-right',
    );
    // Flat map: north always up (fewer ways to get lost). The 3D view allows turning.
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(
      new LocateControl(t('map.locate'), () => {
        onLocateRef.current();
      }),
      'top-right',
    );
    // Bottom-left, lifted above the route sheet by CSS (--sheet-h), clear of the right-hand
    // buttons. Bottom controls stack upwards: the scale sits on top of the credits.
    map.addControl(new AttributionControl({ compact: false }), 'bottom-left');
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
    map.setMissingStyleImageResolver((id) => {
      if (id === HATCH_IMAGE_ID && !map.hasImage(id)) {
        map.addImage(id, diagonalHatch(palette.evacuationArea));
      }
      if (id === NAV_ARROW_ICON_ID && !map.hasImage(id)) {
        const icon = navigationArrowIcon(palette.userRoute, palette.userRouteCasing);
        if (icon) map.addImage(id, icon.image, { pixelRatio: icon.pixelRatio });
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
      threeDControlRef.current = null;
      map.remove();
    };
    // `state` only gates creation; it must not trigger a rebuild when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps
  }, [commune, t, theme]);

  // Show only the layers relevant to the selected hazard.
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
          map.setLayoutProperty(id, 'visibility', visible.has(layer.entry.id) ? 'visible' : 'none');
        }
      }
    }
  }, [hazard, commune, mapVersion]);

  // Read by the 3D toggle without re-running it on every position update.
  const viewRef = useRef({ position: overlay.position, insets, threeD });
  useEffect(() => {
    viewRef.current = { position: overlay.position, insets, threeD };
  });

  // 3D view on/off: relief (exaggerated, labeled), hill shading and a tilted camera.
  // Turning it on brings the user's position (if any) to the middle of the visible map.
  useEffect(() => {
    const map = mapRef.current;
    threeDControlRef.current?.setPressed(threeD);
    if (!map || mapVersion === 0) return;
    if (map.getLayer(HILLSHADE_LAYER_ID)) {
      map.setLayoutProperty(HILLSHADE_LAYER_ID, 'visibility', threeD ? 'visible' : 'none');
    }
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
      map.jumpTo({ pitch: 0, bearing: 0 });
      return;
    }
    const { position, insets: clear } = viewRef.current;
    map.jumpTo({
      center: position ?? map.getCenter(),
      zoom: Math.min(Math.max(map.getZoom(), MAP_3D_ZOOM.min), MAP_3D_ZOOM.max),
      pitch: MAP_3D_PITCH_DEG,
    });
    // Lift that point from the screen's middle to the middle of the part the panels leave
    // clear (a camera offset, not map padding, so later route framing is unaffected).
    if (position) map.panBy([0, (clear.bottom - clear.top) / 2], { duration: 0 });
  }, [threeD, mapVersion]);

  // Draw the user's position, route and destination; frame them without animation (battery).
  const { position, path, destination, heading } = overlay;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapVersion === 0) return;
    void map.getSource<GeoJSONSource>(USER_ROUTE_SOURCE)?.setData(lineCollection(path));
    void map
      .getSource<GeoJSONSource>(USER_POSITION_SOURCE)
      ?.setData(pointCollection(position, heading === null ? {} : { bearing: heading }));
    void map.getSource<GeoJSONSource>(DESTINATION_SOURCE)?.setData(pointCollection(destination));
    // Navigating: follow the walker at street level, without animation (battery). Flat map:
    // north up. 3D view: the map turns with the walker, like a car navigator.
    if (follow && position) {
      const courseUp = viewRef.current.threeD && heading !== null;
      // Padding keeps the walker in the visible part of the map, above the route sheet.
      map.jumpTo({
        center: position,
        zoom: Math.max(map.getZoom(), 17),
        padding: { top: insets.top, bottom: insets.bottom, left: 0, right: 0 },
        ...(courseUp ? { bearing: heading } : {}),
      });
      return;
    }
    const points = path && path.length > 1 ? path : position ? [position] : [];
    const first = points[0];
    if (!first) return;
    if (points.length === 1) {
      map.jumpTo({ center: first, zoom: Math.max(map.getZoom(), 15) });
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
        animate: false,
        maxZoom: 17,
      });
    }
  }, [position, path, destination, heading, follow, mapVersion, insets.top, insets.bottom]);

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

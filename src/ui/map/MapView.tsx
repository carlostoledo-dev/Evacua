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
import { layersForHazard, type HazardId } from '../../domain/hazards.ts';
import { useI18n } from '../../i18n/I18nContext.ts';
import type { Theme } from '../theme.ts';
import { diagonalHatch } from './hatch.ts';
import { meetingPointIcon } from './meetingPointIcon.ts';
import {
  buildStyle,
  DARK_PALETTE,
  DESTINATION_SOURCE,
  HATCH_IMAGE_ID,
  LIGHT_PALETTE,
  MEETING_POINT_ICON_ID,
  overlayLayerIds,
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

function pointCollection(point: [number, number] | null): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: point
      ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: point } }]
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
    map.on('error', () => {
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

  // Draw the user's position, route and destination; frame them without animation (battery).
  const { position, path, destination } = overlay;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapVersion === 0) return;
    void map.getSource<GeoJSONSource>(USER_ROUTE_SOURCE)?.setData(lineCollection(path));
    void map.getSource<GeoJSONSource>(USER_POSITION_SOURCE)?.setData(pointCollection(position));
    void map.getSource<GeoJSONSource>(DESTINATION_SOURCE)?.setData(pointCollection(destination));
    const points = path && path.length > 1 ? path : position ? [position] : [];
    const first = points[0];
    if (!first) return;
    if (points.length === 1) {
      map.jumpTo({ center: first, zoom: Math.max(map.getZoom(), 15) });
    } else {
      const bounds = points.reduce((b, p) => b.extend(p), new LngLatBounds(first, first));
      // Keep the route clear of the floating panels, the controls and the DEMO label.
      map.fitBounds(bounds, {
        padding: { top: insets.top + 88, right: 72, bottom: insets.bottom + 40, left: 56 },
        animate: false,
        maxZoom: 17,
      });
    }
  }, [position, path, destination, mapVersion, insets.top, insets.bottom]);

  return (
    <div
      className={picking ? 'map-frame map-frame--picking' : 'map-frame'}
      data-testid="map"
      data-state={state}
      data-route={path && path.length > 1 ? 'shown' : 'none'}
    >
      <div ref={containerRef} className="map-canvas" />
      {demo && (
        <p className="map-demo-chip" data-testid="map-demo">
          {t('location.demoBadge')}
        </p>
      )}
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

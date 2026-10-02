// Turns validated data layers into the plain inputs the routing domain needs.
import type { AreaGeometry } from '../domain/geo.ts';
import type { MeetingPoint } from '../domain/routing.ts';
import type { LoadedLayer } from './loader.ts';
import type { LayerCollection, LayerRole } from './schema.ts';

type LayerOf<R extends LayerRole> = LoadedLayer & {
  entry: { role: R };
  collection: LayerCollection<R>;
};

function isRole<R extends LayerRole>(layer: LoadedLayer, role: R): layer is LayerOf<R> {
  return layer.entry.role === role;
}

export interface RoutingInputs {
  evacuationAreas: AreaGeometry[];
  meetingPoints: MeetingPoint[];
}

export function routingInputs(layers: readonly LoadedLayer[]): RoutingInputs {
  const evacuationAreas: AreaGeometry[] = [];
  const meetingPoints: MeetingPoint[] = [];
  for (const layer of layers) {
    if (isRole(layer, 'evacuation-area')) {
      for (const feature of layer.collection.features) evacuationAreas.push(feature.geometry);
    } else if (isRole(layer, 'meeting-point')) {
      for (const feature of layer.collection.features) {
        meetingPoints.push({
          code: feature.properties.code,
          coordinates: feature.geometry.coordinates,
        });
      }
    }
  }
  return { evacuationAreas, meetingPoints };
}

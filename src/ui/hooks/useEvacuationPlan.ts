import { useEffect, useMemo, useState } from 'react';
import type { CommuneData, LoadedLayer } from '../../data/loader.ts';
import { routingInputs } from '../../data/routing-inputs.ts';
import { buildGraph } from '../../domain/graph.ts';
import { planEvacuation, prepareRouting, type EvacuationPlan } from '../../domain/routing.ts';

/** After the sector data arrives, wait this long for a quiet moment before preparing routing. */
const WARM_UP_DELAY_MS = 1500;

/**
 * Where a plan may be computed. A route starts only inside the pilot service area; once the user
 * is navigating it continues anywhere the data covers (`bounds`: streets and official layers),
 * because several official meeting points lie just outside the service area and the route to
 * them must not vanish halfway with "you are outside the pilot area".
 */
export function planningArea(manifest: CommuneData['manifest'], navigating: boolean) {
  return navigating ? manifest.bounds : manifest.sector.serviceArea;
}

/**
 * Builds the routing context once per commune (graph + safe-node index, ~30 ms on a
 * desktop, several times that on a slow phone) and plans the evacuation whenever the position
 * changes (a few ms). The context is not built while the app opens (the map comes first): it is
 * built in a quiet moment shortly after, or right away if a position arrives earlier, so the
 * first "find my route" does not wait for it.
 */
export function useEvacuationPlan(
  data: CommuneData | null,
  visibleLayers: readonly LoadedLayer[],
  position: [number, number] | null,
  navigating = false,
): EvacuationPlan | null {
  // Set from a timer callback (not during render), once the opening work is done.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (!data || warm) return;
    const timer = window.setTimeout(() => {
      setWarm(true);
    }, WARM_UP_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [data, warm]);
  const needed = warm || position !== null;
  const graph = useMemo(
    () => (needed && data?.graph ? buildGraph(data.graph) : null),
    [needed, data],
  );
  const inputs = useMemo(() => routingInputs(visibleLayers), [visibleLayers]);
  const context = useMemo(
    () =>
      needed && data ? prepareRouting(graph, inputs.evacuationAreas, data.manifest.bounds) : null,
    [needed, data, graph, inputs],
  );
  return useMemo(() => {
    if (!data || !context || !position) return null;
    return planEvacuation({
      context,
      start: position,
      serviceArea: planningArea(data.manifest, navigating),
      meetingPoints: inputs.meetingPoints,
    });
  }, [data, context, position, inputs, navigating]);
}

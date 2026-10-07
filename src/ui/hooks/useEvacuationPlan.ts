import { useEffect, useMemo, useState } from 'react';
import type { CommuneData, LoadedLayer } from '../../data/loader.ts';
import { routingInputs } from '../../data/routing-inputs.ts';
import { buildGraph } from '../../domain/graph.ts';
import { planEvacuation, prepareRouting, type EvacuationPlan } from '../../domain/routing.ts';

/** After the sector data arrives, wait this long for a quiet moment before preparing routing. */
const WARM_UP_DELAY_MS = 1500;

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
    () => (needed && data ? prepareRouting(graph, inputs.evacuationAreas) : null),
    [needed, data, graph, inputs],
  );
  return useMemo(() => {
    if (!data || !context || !position) return null;
    return planEvacuation({
      context,
      start: position,
      serviceArea: data.manifest.sector.serviceArea,
      meetingPoints: inputs.meetingPoints,
    });
  }, [data, context, position, inputs]);
}

import { useMemo } from 'react';
import type { CommuneData, LoadedLayer } from '../../data/loader.ts';
import { routingInputs } from '../../data/routing-inputs.ts';
import { buildGraph } from '../../domain/graph.ts';
import { planEvacuation, prepareRouting, type EvacuationPlan } from '../../domain/routing.ts';

/**
 * Builds the routing context once per commune and hazard (graph + safe-node index, ~30 ms) and
 * plans the evacuation whenever the position changes (a few ms).
 */
export function useEvacuationPlan(
  data: CommuneData | null,
  visibleLayers: readonly LoadedLayer[],
  position: [number, number] | null,
): EvacuationPlan | null {
  const graph = useMemo(() => (data?.graph ? buildGraph(data.graph) : null), [data]);
  const inputs = useMemo(() => routingInputs(visibleLayers), [visibleLayers]);
  const context = useMemo(
    () => (data ? prepareRouting(graph, inputs.evacuationAreas) : null),
    [data, graph, inputs],
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

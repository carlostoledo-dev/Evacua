export const HAZARD_IDS = ['tsunami', 'wildfire', 'earthquake'] as const;
export type HazardId = (typeof HAZARD_IDS)[number];

export interface HazardConfig {
  id: HazardId;
  /** Offered in the selector. Wildfire is out of the pilot for now (docs/PLAN.md, D2 = C). */
  available: boolean;
  /**
   * Data layers to show, by the hazard they were published for. Earthquake reuses the tsunami
   * layers because SENAPRED's instruction on the coast is: if the quake made it hard to stay
   * standing, evacuate immediately toward a meeting point.
   */
  showsLayersOf: readonly HazardId[];
}

export const HAZARDS: Readonly<Record<HazardId, HazardConfig>> = {
  tsunami: { id: 'tsunami', available: true, showsLayersOf: ['tsunami'] },
  earthquake: { id: 'earthquake', available: true, showsLayersOf: ['tsunami'] },
  wildfire: { id: 'wildfire', available: false, showsLayersOf: ['wildfire'] },
};

export const AVAILABLE_HAZARDS: readonly HazardId[] = HAZARD_IDS.filter(
  (id) => HAZARDS[id].available,
);

export const DEFAULT_HAZARD: HazardId = 'tsunami';

/** Keeps the layers that apply to `hazard`, preserving their order. */
export function layersForHazard<L extends { hazards: readonly HazardId[] }>(
  hazard: HazardId,
  layers: readonly L[],
): L[] {
  const wanted = HAZARDS[hazard].showsLayersOf;
  return layers.filter((layer) => layer.hazards.some((h) => wanted.includes(h)));
}

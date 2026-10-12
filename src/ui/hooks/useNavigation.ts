import { useCallback, useEffect, useRef, useState } from 'react';
import { ARRIVAL_RADIUS_M, DEMO_WALK_SPEEDUP, WALKING_SPEED_MPS } from '../../domain/constants.ts';
import { haversineMeters } from '../../domain/geo.ts';
import { pathMeters, positionAlong } from '../../domain/navigation.ts';
import type { Destination, EvacuationPlan } from '../../domain/routing.ts';
import type { LocationState } from './useLocation.ts';

/** How often the DEMO walk moves the simulated position. */
const DEMO_TICK_MS = 500;

export type NavigationMode = 'gps' | 'demo';

interface DemoWalk {
  demoId: string | null;
  path: [number, number][];
  length: number;
}

interface NavigationActions {
  track: () => void;
  stopTracking: () => void;
  simulate: (demoId: string | null, position: [number, number]) => void;
}

export interface Navigation {
  active: boolean;
  mode: NavigationMode;
  /** Within the arrival radius of the destination. */
  arrived: boolean;
  /** Where the user arrived (null until then), for the arrival screen and voice. */
  arrivedAt: Destination | null;
  voice: boolean;
  start: () => void;
  stop: () => void;
  toggleVoice: () => void;
}

/**
 * Where a navigating user at `position` has arrived, or null: within the arrival radius of the
 * route's destination, or, on a route to safe ground (no meeting point reachable), as soon as the
 * plan says "already safe", because that route ends where the evacuation area ends.
 */
export function arrivalAt(
  position: [number, number],
  plan: EvacuationPlan | null,
): Destination | null {
  if (plan?.kind === 'already-safe') return { kind: 'safe-area', coordinates: position };
  if (plan?.kind !== 'route') return null;
  return haversineMeters(position, plan.destination.coordinates) <= ARRIVAL_RADIUS_M
    ? plan.destination
    : null;
}

/**
 * Turn-by-turn session. With real GPS it follows the position until stopped; from a DEMO point or
 * a point picked on the map it walks the planned route at a labeled, accelerated pace (a picked
 * point is not a GPS reading: following the GPS from there would drop it, and on a computer the
 * network position is usually far from the pilot area). Either way the plan is recomputed
 * from every new position, so leaving the route simply re-plans from where the user is.
 */
export function useNavigation(
  location: LocationState,
  plan: EvacuationPlan | null,
  actions: NavigationActions,
): Navigation {
  const [mode, setMode] = useState<NavigationMode | null>(null);
  const [voice, setVoice] = useState(true);
  const walkRef = useRef<DemoWalk | null>(null);
  const route = plan?.kind === 'route' ? plan : null;
  const { track, stopTracking, simulate } = actions;

  const start = useCallback(() => {
    if (!route) return;
    if (location.kind === 'demo' || location.kind === 'manual') {
      walkRef.current = {
        demoId: location.kind === 'demo' ? location.demoId : null,
        path: route.path,
        length: pathMeters(route.path),
      };
      setMode('demo');
    } else {
      walkRef.current = null;
      setMode('gps');
      track();
    }
  }, [route, location, track]);

  const stop = useCallback(() => {
    stopTracking();
    walkRef.current = null;
    setMode(null);
  }, [stopTracking]);

  const toggleVoice = useCallback(() => {
    setVoice((on) => !on);
  }, []);

  // DEMO walk: move along the route captured when navigation started, then stop at its end.
  useEffect(() => {
    if (mode !== 'demo') return;
    const walk = walkRef.current;
    if (!walk) return;
    const metersPerTick =
      (WALKING_SPEED_MPS.averageHealthyAdult * DEMO_WALK_SPEEDUP * DEMO_TICK_MS) / 1000;
    let walked = 0;
    const timer = window.setInterval(() => {
      walked = Math.min(walk.length, walked + metersPerTick);
      simulate(walk.demoId, positionAlong(walk.path, walked));
      if (walked >= walk.length) window.clearInterval(timer);
    }, DEMO_TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [mode, simulate]);

  const position = 'position' in location ? location.position : null;
  const arrivedAt = mode !== null && position !== null ? arrivalAt(position, plan) : null;

  return {
    active: mode !== null,
    mode: mode ?? 'gps',
    arrived: arrivedAt !== null,
    arrivedAt,
    voice,
    start,
    stop,
    toggleVoice,
  };
}

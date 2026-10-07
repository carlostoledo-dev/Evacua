import { describe, expect, it } from 'vitest';
import { buildGraph, edgeName, nearestNode, nodeCoordinates } from './graph.ts';

// Three nodes in a row (0 — 1 — 2); the first edge is named, the second is not.
const graph = buildGraph({
  nodes: [-73.15, -37.02, -73.149, -37.02, -73.148, -37.02],
  edges: [0, 1, 89, 1, 2, 89],
  names: ['Freire'],
  edgeNames: [0, -1],
});

describe('graph', () => {
  it('names a street in both directions, and only between neighbours', () => {
    expect(edgeName(graph, 0, 1)).toBe('Freire');
    expect(edgeName(graph, 1, 0)).toBe('Freire');
    expect(edgeName(graph, 1, 2)).toBeNull(); // unnamed path
    expect(edgeName(graph, 0, 2)).toBeNull(); // not adjacent
  });

  it('finds the closest node and its coordinates', () => {
    const near = nearestNode(graph, [-73.1481, -37.0201]);
    expect(near?.index).toBe(2);
    expect(near?.meters).toBeLessThan(20);
    expect(nodeCoordinates(graph, 1)).toEqual([-73.149, -37.02]);
  });

  it('has no nearest node when there are no nodes', () => {
    expect(nearestNode(buildGraph({ nodes: [], edges: [] }), [-73.15, -37.02])).toBeNull();
  });
});

/** Parses "#rrggbb" into [r, g, b]. */
export function hexToRgb(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`expected #rrggbb, got "${hex}"`);
  return [
    parseInt(match[1] ?? '0', 16),
    parseInt(match[2] ?? '0', 16),
    parseInt(match[3] ?? '0', 16),
  ];
}

/**
 * RGBA pixels of a seamless diagonal hatch: a texture, not just a color, so the evacuation
 * area stays recognizable for people who cannot tell colors apart.
 */
export function diagonalHatch(
  color: string,
  size = 16,
  lineWidth = 3,
): { width: number; height: number; data: Uint8Array } {
  const [r, g, b] = hexToRgb(color);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x + y) % size < lineWidth) {
        const i = (y * size + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
  }
  return { width: size, height: size, data };
}

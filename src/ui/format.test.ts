import { describe, expect, it } from 'vitest';
import { formatDistance } from './format.ts';

describe('formatDistance', () => {
  it('rounds short distances to 5 m and medium ones to 10 m', () => {
    expect(formatDistance(42, 'en')).toBe('40 m');
    expect(formatDistance(619, 'en')).toBe('620 m');
    expect(formatDistance(1, 'en')).toBe('5 m');
  });

  it('switches to kilometers with one decimal, in the locale format', () => {
    expect(formatDistance(1460, 'en')).toBe('1.5 km');
    expect(formatDistance(1460, 'es-CL')).toBe('1,5 km');
  });
});

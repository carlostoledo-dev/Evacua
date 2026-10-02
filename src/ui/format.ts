/** "620 m" or "1,5 km" in the user's locale; distances are rounded so they read naturally. */
export function formatDistance(meters: number, locale: string): string {
  if (meters < 1000) {
    const rounded = meters < 100 ? Math.round(meters / 5) * 5 : Math.round(meters / 10) * 10;
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'meter' }).format(
      Math.max(rounded, 5),
    );
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilometer',
    maximumFractionDigits: 1,
  }).format(meters / 1000);
}

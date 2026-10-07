import type { MessageKey } from '../i18n/translate.ts';

/** The app's screens: the map, and the three reached from its menu. */
export const VIEWS = ['map', 'guide', 'data', 'settings'] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_LABEL: Record<View, MessageKey> = {
  map: 'nav.map',
  guide: 'nav.guide',
  data: 'nav.data',
  settings: 'nav.settings',
};

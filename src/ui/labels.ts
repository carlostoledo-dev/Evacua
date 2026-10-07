// Typed maps from domain/data identifiers to i18n keys, shared by every component.
import type { LayerRole } from '../data/schema.ts';
import type { HazardId } from '../domain/hazards.ts';
import type { MessageKey } from '../i18n/translate.ts';

export const ROLE_LABEL: Record<LayerRole, MessageKey> = {
  'evacuation-area': 'layer.role.evacuationArea',
  'safe-line': 'layer.role.safeLine',
  'evacuation-route': 'layer.role.evacuationRoute',
  'meeting-point': 'layer.role.meetingPoint',
};

export const HAZARD_LABEL: Record<HazardId, MessageKey> = {
  tsunami: 'hazard.tsunami',
};

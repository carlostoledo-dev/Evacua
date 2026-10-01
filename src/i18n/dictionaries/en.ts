import type { Dictionary } from '../translate.ts';

export const en: Dictionary = {
  'app.name': 'Evacua',
  'app.tagline': 'Offline evacuation map',
  'app.pilotSector': 'Pilot sector: Yobilo, Coronel (Chile)',

  'nav.skipToContent': 'Skip to content',
  'language.label': 'Language',

  'disclaimer.title': 'Important',
  'disclaimer.body':
    'This app is a support tool. It does not replace the authorities (SENAPRED, SHOA, Municipality of Coronel). Always follow their official instructions.',

  'status.label': 'App status',
  'status.offline.ready': 'Ready to use offline',
  'status.offline.pending': 'Preparing offline use…',
  'status.offline.unsupported': 'This browser cannot run the app offline',
  'status.offline.error': 'Offline use could not be prepared',
  'status.network.online': 'Online',
  'status.network.offline': 'Offline: using saved data',

  'update.available': 'A new version is available.',
  'update.apply': 'Update',
  'update.dismiss': 'Later',

  'home.title': 'Where should I evacuate?',
  'home.intro':
    'Evacua shows you where to evacuate for each hazard (tsunami, wildfire or earthquake) from your location, even without internet.',
  'home.comingSoon': 'The sector map and evacuation routes will be available in the next version.',

  'footer.version': 'Version {version}',
};

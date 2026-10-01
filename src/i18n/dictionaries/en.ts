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

  'hazard.tsunami': 'Tsunami',
  'hazard.wildfire': 'Wildfire',
  'hazard.earthquake': 'Earthquake',

  'data.title': 'Sector data',
  'data.sector': '{sector} sector, {commune} ({region})',
  'data.serviceAreaExplainer':
    'Evacua defined the pilot area for this sector; it is not an official administrative boundary.',
  'data.loading': 'Loading sector data…',
  'data.layers': 'Data layers',
  'data.verifiedExplainer':
    '"Verified" means the data was downloaded directly from the institution\'s official service, with source and date. It does not replace on-site signs or instructions.',
  'data.error.title': 'Sector data could not be loaded',
  'data.error.network':
    'Offline and no saved data. Open the app once with internet to save the data on this phone.',
  'data.error.notFound': 'A data file is missing. Evacua never shows routes without data.',
  'data.error.invalid':
    'The data failed validation and will not be shown. Evacua never shows routes based on doubtful data.',
  'data.error.details': 'Technical details',
  'data.retry': 'Try again',

  'layer.role.evacuationArea': 'Area to evacuate',
  'layer.role.safeLine': 'Safe zone boundary',
  'layer.role.evacuationRoute': 'Evacuation routes',
  'layer.role.meetingPoint': 'Meeting points',
  'layer.count': 'Features: {count}',
  'layer.source': 'Source: {source}',
  'layer.retrievedAt': 'Retrieved {date}',
  'layer.sourceLink': 'View the official source record',
  'layer.badge.verified': 'Verified official source',
  'layer.badge.demo': 'DEMO / unverified',

  'footer.version': 'Version {version}',
};

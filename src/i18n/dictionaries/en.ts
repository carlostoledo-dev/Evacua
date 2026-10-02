import type { Dictionary } from '../translate.ts';

export const en: Dictionary = {
  'app.name': 'Evacua',
  'app.tagline': 'Offline evacuation map',
  'app.pilotSector': 'Pilot sector: Yobilo, Coronel (Chile)',

  'nav.skipToContent': 'Skip to content',
  'language.label': 'Language',

  'nav.label': 'Main navigation',
  'nav.map': 'Map',
  'nav.guide': 'What to do',
  'nav.data': 'Data',
  'nav.settings': 'Settings',

  'settings.title': 'Settings',
  'settings.status': 'App status',
  'settings.theme': 'Color theme',
  'theme.system': 'Automatic (like the phone)',
  'theme.light': 'Light: better in sunlight',
  'theme.dark': 'Dark: saves battery',
  'theme.hint':
    'On OLED screens the dark theme uses pure black: those pixels switch off and use less battery.',

  'status.pill.ready': 'Works offline',
  'status.pill.pending': 'Preparing…',
  'status.pill.offline': 'Offline',
  'status.pill.unavailable': 'No offline mode',

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
    'Evacua shows you where to evacuate in a tsunami or an earthquake, using official data, even without internet.',
  'home.comingSoon': 'The route from your location arrives in the next version.',

  'hazard.tsunami': 'Tsunami',
  'hazard.wildfire': 'Wildfire',
  'hazard.earthquake': 'Earthquake',

  'hazard.choose': 'Choose the hazard',

  'map.title': 'Sector map',
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',
  'map.attribution': 'Show or hide map credits',
  'map.loading': 'Loading the map…',
  'map.error':
    'This browser cannot show the map. The guidance and sector data are still available below.',
  'map.dataError': 'Sector data could not be loaded.',
  'map.showData': 'See details',
  'map.legend': 'Legend',

  'guidance.title': 'What to do (official guidance)',
  'guidance.tsunami.1':
    'If you feel an earthquake that makes it hard to stay standing and you are in a tsunami evacuation area, evacuate immediately.',
  'guidance.tsunami.2':
    'If after an earthquake you see the sea draw back unusually, exposing the seabed, evacuate immediately to higher ground.',
  'guidance.tsunami.3': 'Prefer horizontal evacuation toward a meeting point and/or safety area.',
  'guidance.earthquake.1': 'Stay calm and go to a seismic protection place.',
  'guidance.earthquake.2':
    'Protect yourself and hold on under something sturdy. If you cannot get under it, stay next to it.',
  'guidance.earthquake.3': 'If you are outdoors, move away from buildings, poles and power lines.',
  'guidance.earthquake.4':
    'If you are on the coast and the earthquake made it hard to stay standing, evacuate immediately toward a meeting point.',
  'guidance.source': "Translated from SENAPRED's official Spanish guidance.",
  'guidance.sourceLink': 'See all recommendations (Spanish)',

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

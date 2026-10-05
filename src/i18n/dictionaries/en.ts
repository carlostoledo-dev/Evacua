import type { Dictionary } from '../translate.ts';

export const en: Dictionary = {
  'app.name': 'Evacua',
  'app.tagline': 'Offline evacuation map',
  'app.pilotSector': 'Pilot sector: Yobilo, Coronel (Chile)',
  'app.place': '{commune} · {sector}',

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
  'map.locate': 'Use my location (GPS)',

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

  'location.demoBadge': 'DEMO',
  'location.title': 'Your location',
  'location.findRoute': 'Find my evacuation route',
  'location.useGps': 'Use your current location (GPS)',
  'location.pickOnMap': 'Pick on the map',
  'location.pickOnMapHint': 'Tap the place where you are',
  'location.simulate': 'Simulate a location (DEMO)',
  'location.simulatePlaceholder': 'Choose a test point…',
  'location.locating': 'Finding your location… GPS answers faster outdoors.',
  'location.picking': 'Tap the map where you are.',
  'location.cancel': 'Cancel',
  'location.change': 'Change location',
  'location.error.unsupported': 'This browser cannot use GPS. Pick your location on the map.',
  'location.error.denied':
    'You did not allow location access. Pick your location on the map or allow it in the browser.',
  'location.error.unavailable':
    'Your location could not be found. Try outdoors or pick your location on the map.',
  'location.error.timeout': 'GPS took too long. Try again or pick your location on the map.',
  'location.source.gps': 'GPS location (accuracy ± {meters})',
  'location.source.manual': 'Location picked on the map',
  'location.source.demo': 'Simulated location: {label}',
  'location.privacy': 'Your location is used only on this phone: never stored or sent.',

  'route.title': 'Where to evacuate',
  'route.subtitle': 'Find your safe zone and follow the plan.',
  'route.toggle': 'Show or hide the options',
  'route.inDanger': 'You are inside the tsunami evacuation area.',
  'route.notInDanger': 'You are outside the tsunami evacuation area.',
  'route.toSafety': 'Leave the danger area: {distance} on foot {time}.',
  'route.toMeetingPoint': 'Then, meeting point {code}: {distance} in total {time}.',
  'route.nearestMeetingPoint': 'Nearest meeting point: {code}, {distance} away {time}.',
  'route.toSafeArea':
    'Destination: the nearest safe zone. No meeting point can be reached without going back into the danger area.',
  'route.alreadySafe':
    'You are outside the evacuation area according to SENAPRED. Stay alert to the authorities.',
  'route.outside':
    'You are outside the pilot sector ({sector}). Evacua only has data for that sector: follow the authorities.',
  'route.straightLine.title': 'No route computed: this is a straight line, not a path.',
  'route.straightLine.body':
    'Meeting point {code} is {distance} away in a straight line, to the {direction}.',
  'route.straightLine.noGraph': 'This sector has no street network loaded.',
  'route.straightLine.farFromNetwork': 'You are far from the known streets.',
  'route.straightLine.noPath': 'No street path to a safe zone was found.',
  'route.noDestination': 'No meeting points are loaded to show a direction.',
  'route.timeNote':
    'Estimated time between a normal and a slow walking pace (FEMA). Do not wait: evacuate now.',
  'route.earthquakeFirst':
    'First protect yourself during the quake. If you are on the coast and it was hard to stay standing, evacuate like this:',
  'route.you': 'You',
  'route.legend': 'Your route',

  'compass.N': 'north',
  'compass.NE': 'northeast',
  'compass.E': 'east',
  'compass.SE': 'southeast',
  'compass.S': 'south',
  'compass.SW': 'southwest',
  'compass.W': 'west',
  'compass.NW': 'northwest',

  'onboarding.step': 'Step {current} of {total}',
  'onboarding.welcome.body':
    'It shows you where to evacuate in the Yobilo sector of Coronel during a tsunami or an earthquake.',
  'onboarding.welcome.official': 'Official data',
  'onboarding.welcome.officialBody': 'Information from SENAPRED.',
  'onboarding.welcome.offline': 'Works without internet',
  'onboarding.welcome.offlineBody': 'It is stored on your phone.',
  'onboarding.welcome.private': 'Your information is private',
  'onboarding.welcome.privateBody': 'It never leaves your phone.',
  'onboarding.start': 'Get started',
  'onboarding.next': 'Continue',
  'onboarding.back': 'Back',
  'onboarding.install.title': 'Install Evacua on your phone',
  'onboarding.install.body':
    'Open it from your home screen like any other app, even without internet.',
  'onboarding.install.button': 'Install Evacua',
  'onboarding.install.done': 'Evacua is already installed on this phone.',
  'onboarding.install.ios': 'On iPhone: tap the Share button, then “Add to Home Screen”.',
  'onboarding.install.other':
    'You can install it from your browser menu (“Install app” or “Add to Home screen”).',
  'onboarding.install.skip': 'Not now',
  'onboarding.profile.title': 'Create your profile',
  'onboarding.profile.body': 'We adapt text size, voice and instructions for you.',
  'onboarding.profile.privacy':
    'We do not ask for your name or any other personal data. Your choice is only kept on this phone.',
  'onboarding.profile.who': 'Who will use Evacua?',
  'onboarding.ready.title': 'All set!',
  'onboarding.ready.body': 'Now we will show you how the map works in 5 short steps.',
  'onboarding.ready.button': 'Open the map',

  'profile.adult': 'Adult',
  'profile.adult.description': 'Route, distances and estimated time.',
  'profile.senior': 'Older adult',
  'profile.senior.description': 'Large text, simple steps and a voice that reads instructions.',
  'profile.child': 'Child',
  'profile.child.description': 'Icons, short phrases and a game-like drill.',
  'profile.child.age': 'Under {age}',
  'profile.adult.age': '{from} to {to} years old',
  'profile.senior.age': '{age} or older',

  'tour.label': 'Tutorial',
  'tour.progress': '{current} of {total}',
  'tour.next': 'Next',
  'tour.previous': 'Previous',
  'tour.finish': 'Got it',
  'tour.skip': 'Skip tutorial',
  'tour.hazard.title': 'Choose the hazard',
  'tour.hazard.body': 'Tsunami or earthquake. The map and guidance adapt to your choice.',
  'tour.map.title': 'Read the map',
  'tour.map.body':
    'The hatched area is the evacuation area according to SENAPRED. Areas without hatching are safe. Green dots are official meeting points.',
  'tour.route.title': 'Say where you are',
  'tour.route.body':
    'Use GPS, tap the map or try a DEMO point. We show you the shortest way out of danger.',
  'tour.tabs.title': 'More information',
  'tour.tabs.body':
    '“What to do” has the official guidance; “Data”, where each piece of data comes from; “Settings”, your profile and language.',
  'tour.disclaimer.title': 'Always follow the authorities',
  'tour.disclaimer.body':
    'Evacua is a support tool. If SENAPRED, SHOA or the Municipality say otherwise, follow them.',

  'voice.listen': 'Listen to instructions',
  'voice.stop': 'Stop voice',
  'voice.unsupported': 'This phone has no voice available; the instructions are written above.',

  'route.time.range': '({fast}–{slow} min)',
  'route.time.slow': '(about {slow} min at a gentle pace)',
  'route.guardian': 'Find your grown-up or teacher and follow the plan.',
  'route.moreOptions': 'Other ways to locate yourself',

  'drill.title': 'Drill mode',
  'drill.body': 'Practice with your grown-up: walk together to the meeting point.',
  'drill.start': 'Start drill',
  'drill.running': 'Walking… {seconds} s',
  'drill.arrived': 'We made it!',
  'drill.result':
    'Great job! You arrived in {minutes} min {seconds} s. Practice again to get faster.',
  'drill.again': 'Again',

  'settings.profile': 'Your profile',
  'settings.profileHint': 'Kept only on this phone.',
  'settings.save': 'Save',
  'settings.saved': 'Saved.',
  'settings.tour': 'Show the tutorial again',
  'settings.delete': 'Delete my data',
  'settings.deleteConfirm': 'Tap again to delete your profile, language and theme from this phone',
  'settings.privacy':
    'Evacua has no accounts or servers and never asks for your name: your profile and settings live only on this phone, and your location is never stored.',

  'kit.title': 'Emergency backpack',
  'kit.note':
    'Consider the special needs of your household, for example infants, people with autism (ASD) or pregnant people, among others.',
  'kit.source': "Translated from SENAPRED's official list.",
  'kit.sourceLink': 'See the emergency kit (Spanish)',
  'kit.progress': '{done} of {total} ready',
  'kit.reset': 'Uncheck all',
  'kit.item.1': 'Water: plan two liters per person per day',
  'kit.item.2': 'Flashlights or portable light with batteries or a dynamo',
  'kit.item.3': 'Toilet paper and paper towels',
  'kit.item.4': 'Non-perishable food that can be eaten without cooking',
  'kit.item.5': 'Cash',
  'kit.item.6': 'First-aid kit; add any medicines you need',
  'kit.item.7': 'Copies of your house keys',
  'kit.item.8': 'Battery radio and extra batteries',
  'kit.item.9': 'Can opener',
  'kit.item.10': 'Copy of the Emergency Plan',
  'kit.item.11': 'Copies of identity documents, passport, birth certificate',

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

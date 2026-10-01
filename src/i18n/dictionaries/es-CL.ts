// Source dictionary: its keys define `MessageKey`. Every other locale must provide all of them.
export const esCL = {
  'app.name': 'Evacua',
  'app.tagline': 'Mapa de evacuación sin conexión',
  'app.pilotSector': 'Sector piloto: Yobilo, Coronel',

  'nav.skipToContent': 'Saltar al contenido',
  'language.label': 'Idioma',

  'disclaimer.title': 'Importante',
  'disclaimer.body':
    'Esta app es una herramienta de apoyo. No reemplaza a las autoridades (SENAPRED, SHOA, Municipalidad de Coronel). Sigue siempre sus instrucciones oficiales.',

  'status.label': 'Estado de la app',
  'status.offline.ready': 'Lista para usar sin conexión',
  'status.offline.pending': 'Preparando el uso sin conexión…',
  'status.offline.unsupported': 'Este navegador no permite usar la app sin conexión',
  'status.offline.error': 'No se pudo preparar el uso sin conexión',
  'status.network.online': 'Con conexión',
  'status.network.offline': 'Sin conexión: usando datos guardados',

  'update.available': 'Hay una nueva versión disponible.',
  'update.apply': 'Actualizar',
  'update.dismiss': 'Más tarde',

  'home.title': '¿Hacia dónde evacuar?',
  'home.intro':
    'Evacua te muestra hacia dónde evacuar según la amenaza (tsunami, incendio forestal o terremoto) y tu ubicación, incluso sin internet.',
  'home.comingSoon':
    'El mapa del sector y las rutas de evacuación estarán disponibles en la próxima versión.',

  'footer.version': 'Versión {version}',
} as const;

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

  'hazard.tsunami': 'Tsunami',
  'hazard.wildfire': 'Incendio forestal',
  'hazard.earthquake': 'Terremoto',

  'data.title': 'Datos del sector',
  'data.sector': 'Sector {sector}, {commune} ({region})',
  'data.serviceAreaExplainer':
    'El área piloto de este sector la definió Evacua; no es un límite administrativo oficial.',
  'data.loading': 'Cargando los datos del sector…',
  'data.layers': 'Capas de datos',
  'data.verifiedExplainer':
    '"Verificada" significa que el dato se descargó directamente del servicio oficial de la institución, con fuente y fecha. No reemplaza la señalética ni las instrucciones en terreno.',
  'data.error.title': 'No se pudieron cargar los datos del sector',
  'data.error.network':
    'Sin conexión y sin datos guardados. Abre la app una vez con internet para guardarlos en el teléfono.',
  'data.error.notFound': 'Falta un archivo de datos. Evacua no muestra rutas sin datos.',
  'data.error.invalid':
    'Los datos no pasaron la validación y no se mostrarán. Evacua nunca muestra rutas con datos dudosos.',
  'data.error.details': 'Detalles técnicos',
  'data.retry': 'Reintentar',

  'layer.role.evacuationArea': 'Área a evacuar',
  'layer.role.safeLine': 'Límite de la zona segura',
  'layer.role.evacuationRoute': 'Vías de evacuación',
  'layer.role.meetingPoint': 'Puntos de encuentro',
  'layer.count': 'Elementos: {count}',
  'layer.source': 'Fuente: {source}',
  'layer.retrievedAt': 'Obtenido el {date}',
  'layer.sourceLink': 'Ver ficha oficial de la fuente',
  'layer.badge.verified': 'Fuente oficial verificada',
  'layer.badge.demo': 'DEMO / sin verificar',

  'footer.version': 'Versión {version}',
} as const;

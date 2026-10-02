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
    'Evacua te muestra hacia dónde evacuar ante un tsunami o un terremoto, con datos oficiales e incluso sin internet.',
  'home.comingSoon': 'La ruta desde tu ubicación llegará en la próxima versión.',

  'hazard.tsunami': 'Tsunami',
  'hazard.wildfire': 'Incendio forestal',
  'hazard.earthquake': 'Terremoto',

  'hazard.choose': 'Elige la amenaza',

  'map.title': 'Mapa del sector',
  'map.zoomIn': 'Acercar',
  'map.zoomOut': 'Alejar',
  'map.attribution': 'Mostrar u ocultar créditos del mapa',
  'map.loading': 'Cargando el mapa…',
  'map.error':
    'Este navegador no puede mostrar el mapa. Las indicaciones y los datos del sector siguen disponibles abajo.',
  'map.legend': 'Leyenda',

  // Verbatim from SENAPRED (https://www.senapred.cl/tsunami/ and /sismos/), retrieved 2026-10-02.
  'guidance.title': 'Qué hacer (indicaciones oficiales)',
  'guidance.tsunami.1':
    'Si sientes un sismo que te dificulta mantenerte en pie y te encuentras en un Área de Evacuación por tsunami, evacúa inmediatamente.',
  'guidance.tsunami.2':
    'Si después de un sismo observas que el mar se retira de forma inusual, exponiendo el fondo marino, evacúa inmediatamente hacia terrenos elevados.',
  'guidance.tsunami.3':
    'Prioriza la evacuación horizontal hacia un Punto de Encuentro y/o Área de Seguridad.',
  'guidance.earthquake.1': 'Mantén la calma y ubícate en un Lugar de Protección Sísmica.',
  'guidance.earthquake.2':
    'Protégete y afírmate debajo de un elemento firme. Si no es posible ubicarte debajo, ubícate junto a él.',
  'guidance.earthquake.3':
    'Si estás en la calle, aléjate de los edificios, postes y cables eléctricos.',
  'guidance.earthquake.4':
    'Si estás en la costa y el sismo te dificultó mantenerte en pie, evacúa inmediatamente hacia un punto de encuentro.',
  'guidance.source': 'Texto oficial de SENAPRED.',
  'guidance.sourceLink': 'Ver todas las recomendaciones',

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

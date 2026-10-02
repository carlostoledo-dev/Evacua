// Source dictionary: its keys define `MessageKey`. Every other locale must provide all of them.
export const esCL = {
  'app.name': 'Evacua',
  'app.tagline': 'Mapa de evacuación sin conexión',
  'app.pilotSector': 'Sector piloto: Yobilo, Coronel',

  'nav.skipToContent': 'Saltar al contenido',
  'language.label': 'Idioma',

  'nav.label': 'Navegación principal',
  'nav.map': 'Mapa',
  'nav.guide': 'Qué hacer',
  'nav.data': 'Datos',
  'nav.settings': 'Ajustes',

  'settings.title': 'Ajustes',
  'settings.status': 'Estado de la app',
  'settings.theme': 'Tema de colores',
  'theme.system': 'Automático (como el teléfono)',
  'theme.light': 'Claro: mejor al sol',
  'theme.dark': 'Oscuro: ahorra batería',
  'theme.hint':
    'En pantallas OLED el tema oscuro usa negro puro: esos píxeles se apagan y gastan menos batería.',

  'status.pill.ready': 'Lista sin internet',
  'status.pill.pending': 'Preparando…',
  'status.pill.offline': 'Sin conexión',
  'status.pill.unavailable': 'Sin modo offline',

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
  'map.dataError': 'No se pudieron cargar los datos del sector.',
  'map.showData': 'Ver detalles',
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

  'location.demoBadge': 'DEMO',
  'location.title': 'Tu ubicación',
  'location.useGps': 'Usar mi ubicación (GPS)',
  'location.pickOnMap': 'Elegir en el mapa',
  'location.simulate': 'Simular ubicación (DEMO)',
  'location.simulatePlaceholder': 'Elige un punto de prueba…',
  'location.locating': 'Buscando tu ubicación… Al aire libre el GPS responde más rápido.',
  'location.picking': 'Toca el mapa en el lugar donde estás.',
  'location.cancel': 'Cancelar',
  'location.change': 'Cambiar ubicación',
  'location.error.unsupported':
    'Este navegador no puede usar el GPS. Elige tu ubicación en el mapa.',
  'location.error.denied':
    'No diste permiso para usar tu ubicación. Puedes elegirla en el mapa o activar el permiso en el navegador.',
  'location.error.unavailable':
    'No se pudo obtener tu ubicación. Prueba al aire libre o elige tu ubicación en el mapa.',
  'location.error.timeout':
    'El GPS tardó demasiado. Inténtalo de nuevo o elige tu ubicación en el mapa.',
  'location.source.gps': 'Ubicación del GPS (precisión ± {meters})',
  'location.source.manual': 'Ubicación elegida en el mapa',
  'location.source.demo': 'Ubicación simulada: {label}',
  'location.privacy': 'Tu ubicación se usa solo en este teléfono: no se guarda ni se envía.',

  'route.title': 'Hacia dónde evacuar',
  'route.inDanger': 'Estás dentro del área a evacuar por tsunami.',
  'route.notInDanger': 'Estás fuera del área a evacuar por tsunami.',
  'route.toSafety': 'Sal del área de peligro: {distance} a pie ({fast}–{slow} min).',
  'route.toMeetingPoint':
    'Luego, punto de encuentro {code}: {distance} en total ({fast}–{slow} min).',
  'route.nearestMeetingPoint':
    'Punto de encuentro más cercano: {code}, a {distance} ({fast}–{slow} min).',
  'route.toSafeArea':
    'Destino: la zona segura más cercana. Ningún punto de encuentro se alcanza sin volver al área de peligro.',
  'route.alreadySafe':
    'Estás fuera del área a evacuar según SENAPRED. Mantente atento a las autoridades.',
  'route.outside':
    'Estás fuera del sector piloto ({sector}). Evacua solo tiene datos de ese sector: sigue las indicaciones de las autoridades.',
  'route.straightLine.title': 'Sin ruta calculada: esto es una línea recta, no un camino.',
  'route.straightLine.body':
    'Punto de encuentro {code} a {distance} en línea recta, hacia el {direction}.',
  'route.straightLine.noGraph': 'Este sector no tiene red de calles cargada.',
  'route.straightLine.farFromNetwork': 'Estás lejos de las calles conocidas.',
  'route.straightLine.noPath': 'No se encontró un camino por calles hasta una zona segura.',
  'route.noDestination': 'No hay puntos de encuentro cargados para indicar una dirección.',
  'route.timeNote':
    'Tiempo estimado entre un ritmo de caminata normal y uno lento (FEMA). No esperes: evacúa de inmediato.',
  'route.earthquakeFirst':
    'Primero protégete durante el sismo. Si estás en la costa y te costó mantenerte en pie, evacúa así:',
  'route.you': 'Tú',
  'route.legend': 'Tu ruta',

  'compass.N': 'norte',
  'compass.NE': 'noreste',
  'compass.E': 'este',
  'compass.SE': 'sureste',
  'compass.S': 'sur',
  'compass.SW': 'suroeste',
  'compass.W': 'oeste',
  'compass.NW': 'noroeste',

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

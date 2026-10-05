// Source dictionary: its keys define `MessageKey`. Every other locale must provide all of them.
export const esCL = {
  'app.name': 'Evacua',
  'app.tagline': 'Mapa de evacuación sin conexión',
  'app.pilotSector': 'Sector piloto: Yobilo, Coronel',
  'app.place': '{commune} · {sector}',

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
  'map.locate': 'Usar mi ubicación (GPS)',

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
  'location.findRoute': 'Buscar mi ruta de evacuación',
  'location.useGps': 'Usa tu ubicación actual (GPS)',
  'location.pickOnMap': 'Elegir en el mapa',
  'location.pickOnMapHint': 'Toca el lugar donde estás',
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
  'route.subtitle': 'Encuentra tu zona segura y sigue el plan.',
  'route.toggle': 'Mostrar u ocultar las opciones',
  'route.inDanger': 'Estás dentro del área a evacuar por tsunami.',
  'route.notInDanger': 'Estás fuera del área a evacuar por tsunami.',
  'route.toSafety': 'Sal del área de peligro: {distance} a pie {time}.',
  'route.toMeetingPoint': 'Luego, punto de encuentro {code}: {distance} en total {time}.',
  'route.nearestMeetingPoint': 'Punto de encuentro más cercano: {code}, a {distance} {time}.',
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

  'onboarding.step': 'Paso {current} de {total}',
  'onboarding.welcome.body':
    'Te muestra hacia dónde evacuar en el sector Yobilo de Coronel ante un tsunami o un terremoto.',
  'onboarding.welcome.official': 'Datos oficiales',
  'onboarding.welcome.officialBody': 'Información de SENAPRED.',
  'onboarding.welcome.offline': 'Funciona sin internet',
  'onboarding.welcome.offlineBody': 'Queda guardada en tu teléfono.',
  'onboarding.welcome.private': 'Tu información es privada',
  'onboarding.welcome.privateBody': 'No sale de tu teléfono.',
  'onboarding.start': 'Comenzar',
  'onboarding.next': 'Continuar',
  'onboarding.back': 'Atrás',
  'onboarding.install.title': 'Instala Evacua en tu teléfono',
  'onboarding.install.body':
    'Ábrela desde tu pantalla de inicio como cualquier otra app, incluso sin internet.',
  'onboarding.install.button': 'Instalar Evacua',
  'onboarding.install.done': 'Evacua ya está instalada en este teléfono.',
  'onboarding.install.ios': 'En iPhone: toca el botón Compartir y luego «Agregar a inicio».',
  'onboarding.install.other':
    'Puedes instalarla desde el menú de tu navegador («Instalar app» o «Agregar a la pantalla de inicio»).',
  'onboarding.install.skip': 'Ahora no',
  'onboarding.profile.title': 'Crea tu perfil',
  'onboarding.profile.body': 'Adaptamos el tamaño del texto, la voz y las indicaciones para ti.',
  'onboarding.profile.privacy':
    'No pedimos tu nombre ni otros datos personales. Tu elección solo se guarda en este teléfono.',
  'onboarding.profile.who': '¿Quién usará Evacua?',
  'onboarding.ready.title': '¡Todo listo!',
  'onboarding.ready.body': 'Ahora te mostramos cómo funciona el mapa en 5 pasos cortos.',
  'onboarding.ready.button': 'Ver el mapa',

  'profile.adult': 'Adulto',
  'profile.adult.description': 'Ruta, distancias y tiempo estimado.',
  'profile.senior': 'Adulto mayor',
  'profile.senior.description': 'Letra grande, pasos simples y voz que lee las indicaciones.',
  'profile.child': 'Niño o niña',
  'profile.child.description': 'Íconos, frases cortas y un simulacro tipo juego.',
  'profile.child.age': 'Menos de {age} años',
  'profile.adult.age': '{from} a {to} años',
  'profile.senior.age': '{age} años o más',

  'tour.label': 'Tutorial',
  'tour.progress': '{current} de {total}',
  'tour.next': 'Siguiente',
  'tour.previous': 'Anterior',
  'tour.finish': 'Entendido',
  'tour.skip': 'Saltar tutorial',
  'tour.hazard.title': 'Elige la amenaza',
  'tour.hazard.body': 'Tsunami o terremoto. El mapa y las indicaciones se adaptan a lo que elijas.',
  'tour.map.title': 'Lee el mapa',
  'tour.map.body':
    'Lo rayado es el área a evacuar según SENAPRED. Lo que no tiene rayas es zona segura. Los puntos verdes son puntos de encuentro oficiales.',
  'tour.route.title': 'Di dónde estás',
  'tour.route.body':
    'Usa el GPS, toca el mapa o prueba con un punto DEMO. Te mostramos el camino más corto para salir del peligro.',
  'tour.tabs.title': 'Más información',
  'tour.tabs.body':
    '«Qué hacer» tiene las indicaciones oficiales; «Datos», de dónde viene cada dato; «Ajustes», tu perfil e idioma.',
  'tour.disclaimer.title': 'Siempre sigue a las autoridades',
  'tour.disclaimer.body':
    'Evacua es una herramienta de apoyo. Si SENAPRED, el SHOA o la Municipalidad indican otra cosa, hazles caso a ellos.',

  'voice.listen': 'Escuchar indicaciones',
  'voice.stop': 'Detener voz',
  'voice.unsupported':
    'Este teléfono no tiene voz disponible; las indicaciones están escritas arriba.',

  'route.time.range': '({fast}–{slow} min)',
  'route.time.slow': '(unos {slow} min a paso tranquilo)',
  'route.guardian': 'Busca a tu adulto o profesor y sigue el plan.',
  'route.moreOptions': 'Otras formas de ubicarte',

  'drill.title': 'Modo simulacro',
  'drill.body': 'Practica con tu adulto: caminen juntos hasta el punto de encuentro.',
  'drill.start': 'Empezar simulacro',
  'drill.running': 'Caminando… {seconds} s',
  'drill.arrived': '¡Llegamos!',
  'drill.result':
    '¡Muy bien! Llegaron en {minutes} min {seconds} s. Practiquen otra vez para hacerlo más rápido.',
  'drill.again': 'Repetir',

  'settings.profile': 'Tu perfil',
  'settings.profileHint': 'Se guarda solo en este teléfono.',
  'settings.save': 'Guardar',
  'settings.saved': 'Guardado.',
  'settings.tour': 'Ver el tutorial otra vez',
  'settings.delete': 'Borrar mis datos',
  'settings.deleteConfirm': 'Toca otra vez para borrar tu perfil, idioma y tema de este teléfono',
  'settings.privacy':
    'Evacua no tiene cuentas ni servidores y no pide tu nombre: tu perfil y tus ajustes viven solo en este teléfono, y tu ubicación nunca se guarda.',

  // Verbatim from SENAPRED (https://senapred.cl/kit-de-emergencia/), retrieved 2026-10-04.
  'kit.title': 'Mochila de emergencia',
  'kit.note':
    'Considera las necesidades especiales de tu grupo familiar, por ejemplo de lactantes, personas con TEA, embarazadas entre otros.',
  'kit.source': 'Lista oficial de SENAPRED.',
  'kit.sourceLink': 'Ver el kit de emergencia',
  'kit.progress': '{done} de {total} listos',
  'kit.reset': 'Desmarcar todo',
  'kit.item.1': 'Agua: considera dos litros por persona al día',
  'kit.item.2': 'Linternas o luz portátil con baterías o a dínamo',
  'kit.item.3': 'Papel higiénico y toalla de papel',
  'kit.item.4': 'Alimentos no perecibles que se puedan consumir sin cocinar',
  'kit.item.5': 'Dinero en efectivo',
  'kit.item.6': 'Botiquín de primeros auxilios, agrega medicamentos necesarios',
  'kit.item.7': 'Copias de llaves de la casa',
  'kit.item.8': 'Radio a pilas y baterías adicionales',
  'kit.item.9': 'Abridor de latas',
  'kit.item.10': 'Copia del Plan de Emergencia',
  'kit.item.11': 'Copia de documentos de identidad, pasaporte, nacimiento',

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

/** Configuración del sitio en un único lugar. */
export const NOMBRE = 'Productos Retirados';
export const EMAIL = 'estaretirado@gmail.com';
export const REPOSITORIO = 'https://github.com/ivangarmar22/ProductosRetirados';
export const LEGAL_ACTUALIZADO = '06/11/2026';

/** Igual que en LeyAnimal. La web es gratuita y lo sigue siendo sin donativos. */
export const DONATIVOS = { bizum: '652308536', paypal: 'https://www.paypal.me/ivangarmar22' } as const;

/** Canales configurables: si no están definidos, la web no enlaza a ningún sitio roto. */
export const TELEGRAM_URL = import.meta.env.PUBLIC_TELEGRAM_URL || '';
export const NEWSLETTER_URL = import.meta.env.PUBLIC_NEWSLETTER_URL || '';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Ruta interna con la subcarpeta de publicación, si la hay. */
export const ruta = (r: string) => `${base}${r}`;

export const MENU = [
  { href: '/alertas/', texto: 'Alertas' },
  { href: '/categorias/', texto: 'Categorías' },
  { href: '/alergenos/', texto: 'Alérgenos' },
  { href: '/mi-despensa/', texto: 'Mi despensa' },
  { href: '/avisos/', texto: 'Avisos' },
];

export const TABS = [
  { href: '/', texto: 'Inicio', icono: 'house' },
  { href: '/alertas/', texto: 'Buscar', icono: 'search' },
  { href: '/comprobar/', texto: 'Comprobar', icono: 'circle-check-big' },
  { href: '/mi-despensa/', texto: 'Despensa', icono: 'shopping-basket' },
  { href: '/avisos/', texto: 'Avisos', icono: 'bell' },
];

export const PIE = [
  { titulo: 'Consulta', enlaces: [['/alertas/', 'Todas las alertas'], ['/categorias/', 'Categorías'], ['/alergenos/', 'Alérgenos'], ['/marcas/', 'Marcas'], ['/mi-despensa/', 'Mi despensa'], ['/mis-alergias/', 'Mis alergias'], ['/estadisticas/', 'Estadísticas']] },
  { titulo: 'Ayuda', enlaces: [['/comprobar/', 'Comprobar un producto'], ['/guias/que-hacer-producto-retirado/', 'Qué hacer si tienes un producto retirado'], ['/guias/donde-esta-el-lote/', 'Dónde está el lote'], ['/avisos/', 'Recibir avisos'], ['/fuentes/', 'Fuentes y metodología'], ['/estado/', 'Estado de las fuentes']] },
  { titulo: 'Proyecto', enlaces: [['/sobre/', 'Sobre el proyecto'], ['/apoya/', 'Donar'], ['/aviso-legal/', 'Aviso legal'], ['/privacidad/', 'Privacidad'], ['/cookies/', 'Cookies'], ['/accesibilidad/', 'Accesibilidad']] },
] as const;

/** Configuración del sitio en un único lugar. */
export const NOMBRE = 'Productos Retirados';
export const EMAIL = 'estaretirado@gmail.com';
/** Formulario de contacto (web3forms.com). La clave es pública por diseño: solo envía al correo con el que se registró. */
export const WEB3FORMS_KEY = '6f8f2f83-2366-43cc-9e9a-a32727516e4f';
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
  { href: '/comprobar/', texto: 'Comprobar' },
  { href: '/categorias/', texto: 'Categorías' },
  { href: '/alergenos/', texto: 'Alérgenos' },
  { href: '/avisos/', texto: 'Avisos' },
  { href: '/contacto/', texto: 'Contacto' },
];

export const TABS = [
  { href: '/', texto: 'Inicio', icono: 'house' },
  { href: '/alertas/', texto: 'Buscar', icono: 'magnifying-glass' },
  { href: '/comprobar/', texto: 'Comprobar', icono: 'check-circle' },
  { href: '/avisos/', texto: 'Avisos', icono: 'bell' },
  { href: '/contacto/', texto: 'Contacto', icono: 'envelope-simple' },
];

export const PIE = [
  { titulo: 'Consulta', enlaces: [['/alertas/', 'Todas las alertas'], ['/categorias/', 'Categorías'], ['/alergenos/', 'Alérgenos'], ['/marcas/', 'Marcas'], ['/estadisticas/', 'Estadísticas']] },
  { titulo: 'Ayuda', enlaces: [['/comprobar/', 'Comprobar un producto'], ['/guias/que-hacer-producto-retirado/', 'Qué hacer con un producto retirado'], ['/guias/donde-esta-el-lote/', 'Dónde está el lote'], ['/avisos/', 'Recibir avisos']] },
  { titulo: 'Proyecto', enlaces: [['/sobre/', 'Sobre el proyecto'], ['/colabora/', 'Colabora'], ['/contacto/', 'Contacto'], ['/fuentes/', 'Fuentes y metodología'], ['/estado/', 'Estado de las fuentes']] },
] as const;

export const LEGAL = [['/aviso-legal/', 'Aviso legal'], ['/privacidad/', 'Privacidad'], ['/cookies/', 'Cookies'], ['/accesibilidad/', 'Accesibilidad']] as const;

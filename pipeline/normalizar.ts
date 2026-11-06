/** Utilidades de normalización. Todas puras, para poder probarlas con fixtures. */

export const slug = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const limpiar = (texto: string | null | undefined): string =>
  (texto ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/\s+/g, ' ')
    .trim();

const VACIOS = /^(unknown|desconocid[oa]s?|no se conoce|no disponible|n\/?a|-|none|sin datos)\.?$/i;
/** Devuelve null para los valores que la fuente usa como "sin dato". */
export const dato = (v: unknown): string | null => {
  const t = limpiar(v == null ? '' : String(v));
  return !t || VACIOS.test(t) ? null : t;
};

/** dd/mm/aaaa, dd-mm-aaaa o dd.mm.aa a ISO. */
export function fechaIso(texto: string): string | null {
  const m = texto.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const anio = a.length === 2 ? `20${a}` : a;
  // Las fuentes publican fechas imposibles (31/06, 30/02): mejor sin dato que un dato falso.
  const real = new Date(Date.UTC(+anio, +mes - 1, +d));
  if (real.getUTCMonth() !== +mes - 1 || real.getUTCDate() !== +d) return null;
  return `${anio}-${mes.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Primera letra en mayúscula y sin punto final. */
export const nombreLimpio = (t: string): string => {
  const s = limpiar(t).replace(/[.,;:\s]+$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** URL http(s) válida o null. Safety Gate mete texto libre en este campo. */
export function urlValida(t: string | null): string | null {
  if (!t || /\s/.test(t)) return null;
  try {
    const u = new URL(t);
    // Solo caracteres válidos en una URI: el navegador tolera más que el estándar.
    return /^https?:$/.test(u.protocol) && !/[^\x21-\x7e]|[\\^`{|}<>"]/.test(u.href) ? u.href : null;
  } catch {
    return null;
  }
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** "09 de abril de 2026" a ISO. */
export function fechaLarga(texto: string): string | null {
  const m = texto.toLowerCase().match(/(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/);
  if (!m) return null;
  const i = MESES.indexOf(m[2]);
  return i < 0 ? null : `${m[3]}-${String(i + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** Epoch en milisegundos a fecha ISO en hora de Madrid. */
export const fechaMadrid = (ms: number): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));

export const hoy = (): string => fechaMadrid(Date.now());

/** Dígito de control GTIN (válido para EAN-8, UPC-A, EAN-13 y GTIN-14). */
export function gtinValido(codigo: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(codigo)) return false;
  const digitos = [...codigo].map(Number);
  const control = digitos.pop()!;
  const suma = digitos.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (suma % 10)) % 10 === control;
}

/** Parte una cadena de dígitos en GTIN válidos, o devuelve null si no se puede entera. */
function partirGtin(digitos: string): string[] | null {
  if (!digitos) return [];
  for (const largo of [13, 12, 14, 8]) {
    const pieza = digitos.slice(0, largo);
    if (pieza.length !== largo || !gtinValido(pieza)) continue;
    const resto = partirGtin(digitos.slice(largo));
    if (resto) return [pieza, ...resto];
  }
  return null;
}

/** Safety Gate pega varios códigos sin separador: solo valen si toda la cadena se parte en GTIN correctos. */
export function extraerEan(texto: string | null): string[] {
  if (!texto) return [];
  const encontrados = new Set<string>();
  for (const trozo of texto.split(/[^\d]+/).filter(Boolean)) {
    if (gtinValido(trozo)) encontrados.add(trozo);
    else if (trozo.length > 14) partirGtin(trozo)?.forEach((p) => encontrados.add(p));
  }
  return [...encontrados];
}

/** Separa una lista de lotes o modelos sin romper códigos con guiones. */
export const separarLista = (texto: string | null): string[] =>
  (texto ?? '')
    .split(/\s*[;,]\s*|\s+y\s+|\s+\/\s+/)
    .map((v) => dato(v.replace(/\.$/, '')))
    .filter((v): v is string => Boolean(v));

const CCAA: [string, RegExp][] = [
  ['Andalucía', /andaluc[ií]a/i],
  ['Aragón', /arag[oó]n/i],
  ['Asturias', /asturias/i],
  ['Illes Balears', /illes balears|islas baleares|baleares/i],
  ['Canarias', /canarias/i],
  ['Cantabria', /cantabria/i],
  ['Castilla y León', /castilla y le[oó]n/i],
  ['Castilla-La Mancha', /castilla[ -]+la mancha/i],
  ['Cataluña', /catalu[ñn]a/i],
  ['Comunidad Valenciana', /(comunidad|comunitat|c\.) valencian[ao]/i],
  ['Extremadura', /extremadura/i],
  ['Galicia', /galicia/i],
  ['La Rioja', /la rioja/i],
  ['Madrid', /madrid/i],
  ['Murcia', /murcia/i],
  ['Navarra', /navarra/i],
  ['País Vasco', /pa[ií]s vasco|euskadi/i],
  ['Ceuta', /ceuta/i],
  ['Melilla', /melilla/i],
];
export const nombresCcaa = CCAA.map(([n]) => n);
export const extraerCcaa = (texto: string): string[] => CCAA.filter(([, re]) => re.test(texto)).map(([n]) => n);

/** Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011). */
const ALERGENOS: [string, RegExp][] = [
  ['Gluten', /gluten|trigo|cebada|centeno|espelta/i],
  ['Crustáceos', /crust[aá]ceo|gamba|langostino/i],
  ['Huevo', /\bhuevos?\b/i],
  ['Pescado', /\bpescados?\b/i],
  ['Cacahuete', /cacahuete/i],
  ['Soja', /\bsoja\b/i],
  ['Leche', /\bleche\b|lactosa|prote[ií]nas? l[aá]cteas?/i],
  ['Frutos secos', /frutos? (de c[aá]scara|secos?)|almendra|avellana|\bnuez\b|nueces|anacardo|pistacho/i],
  ['Apio', /\bapio\b/i],
  ['Mostaza', /mostaza/i],
  ['Sésamo', /s[eé]samo/i],
  ['Sulfitos', /sulfitos?|di[oó]xido de azufre/i],
  ['Altramuces', /altramuz|altramuces/i],
  ['Moluscos', /moluscos?/i],
];
export const nombresAlergenos = ALERGENOS.map(([n]) => n);
export const extraerAlergenos = (texto: string): string[] => ALERGENOS.filter(([, re]) => re.test(texto)).map(([n]) => n);

export const CATEGORIAS: Record<string, string> = {
  alimentos: 'Alimentos',
  complementos: 'Complementos alimenticios',
  medicamentos: 'Medicamentos',
  cosmeticos: 'Cosméticos',
  juguetes: 'Juguetes',
  electricos: 'Eléctricos',
  infantil: 'Infantil',
  vehiculos: 'Vehículos',
  moda: 'Ropa y moda',
  ocio: 'Ocio y deporte',
  hogar: 'Hogar y herramientas',
  otros: 'Otros',
};

/** Traduce las categorías de Safety Gate a la taxonomía propia. */
export function categoriaProducto(literal: string): string {
  const reglas: [RegExp, string][] = [
    [/cosm[eé]tic/i, 'cosmeticos'],
    [/veh[ií]culo|automóvil|motocicleta/i, 'vehiculos'],
    [/juguete/i, 'juguetes'],
    [/puericultura|infantil/i, 'infantil'],
    [/el[eé]ctric|iluminaci|alumbrado|guirnalda|l[aá]ser|comunicaci|informátic|\bgas\b/i, 'electricos'],
    [/ropa|textil|moda|joyer|bisuter/i, 'moda'],
    [/ocio|deporte|embarcaci|hobby|recreo|pirotecnia/i, 'ocio'],
    [/aliment/i, 'alimentos'],
    [/mobiliario|decoraci|herramienta|maquinaria|qu[ií]mic|protecci|cocina|construcci|hogar|limpieza|encendedor|papeler[ií]a|escalera|presi[oó]n/i, 'hogar'],
  ];
  return reglas.find(([re]) => re.test(literal))?.[1] ?? 'otros';
}

export const TIPOS_RIESGO: Record<string, string> = {
  microbiologico: 'Microbiológico',
  alergeno: 'Alérgenos',
  quimico: 'Químico',
  'cuerpo-extrano': 'Cuerpo extraño',
  asfixia: 'Asfixia o atragantamiento',
  electrico: 'Eléctrico',
  incendio: 'Incendio o quemaduras',
  lesiones: 'Lesiones',
  calidad: 'Defecto de calidad',
  otros: 'Otros',
};

export function tiposRiesgo(texto: string, extra: string[] = []): string[] {
  const reglas: [RegExp, string][] = [
    [/listeria|salmonella|e\.? ?coli|microb|botul|cereulida|norovirus|hepatitis|anisakis|moho/i, 'microbiologico'],
    [/qu[ií]mic|dehp|plomo|ftalato|sildenafilo|tadalafilo|sibutramina|aflatoxina|melatonina|thc|hhc|benzofenona|residuo|mercurio|cadmio/i, 'quimico'],
    [/fragmentos?|part[ií]culas?|piezas? de|cristal|cuerpo extra/i, 'cuerpo-extrano'],
    [/asfixia|atragantamiento|ahogamiento|estrangulamiento/i, 'asfixia'],
    [/choque el[eé]ctrico|electrocuci/i, 'electrico'],
    [/incendio|quemadura/i, 'incendio'],
    [/lesi[oó]n|lesiones|cortes|heridas|daño a la vista/i, 'lesiones'],
  ];
  const r = new Set(extra);
  for (const [re, t] of reglas) if (re.test(texto)) r.add(t);
  return r.size ? [...r] : ['otros'];
}

const SUFIJOS = /\b(s\.?\s?l\.?u?|s\.?\s?a\.?u?|gmbh|ltd|limited|inc|co)\.?$/i;
/** Marca comparable entre fuentes: "Fiestas Guirca SL" y "FIESTAS GUIRCA" dan lo mismo. */
export const marcaClave = (marca: string): string => slug(marca.replace(SUFIJOS, ''));

export function clavesDedup(ref: string | null, productos: { marcas: string[]; modelos: string[]; lotes: { numero: string | null }[]; ean: string[] }[]): string[] {
  const claves = new Set<string>();
  if (ref) claves.add(`ref:${ref}`);
  for (const p of productos) {
    p.ean.forEach((e) => claves.add(`ean:${e}`));
    for (const m of p.marcas) {
      const mk = marcaClave(m);
      if (!mk) continue;
      p.modelos.forEach((o) => { const k = slug(o); if (k.length >= 3) claves.add(`mm:${mk}:${k}`); });
      p.lotes.forEach((l) => { const k = slug(l.numero ?? ''); if (k.length >= 3) claves.add(`ml:${mk}:${k}`); });
    }
  }
  return [...claves];
}

/** Título en mayúsculas sostenidas a formato legible, respetando siglas cortas. */
export const capitalizar = (texto: string): string => {
  if (texto !== texto.toUpperCase()) return texto;
  const t = texto.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

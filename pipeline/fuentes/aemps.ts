/** AEMPS: JSON incrustado en medicamentos y notas HTML en cosméticos. */
import { parse } from 'node-html-parser';
import { capitalizar, clavesDedup, fechaIso, fechaLarga, fechaMadrid, hoy, limpiar, nombreLimpio, slug, tiposRiesgo } from '../normalizar.ts';
import type { AlertaParseada, Producto } from '../tipos.ts';

export const URL_MEDICAMENTOS = 'https://www.aemps.gob.es/comunicacion/alertas/alertas-farmaceuticas-y-retiradas-de-lotes-de-medicamentos-de-uso-humano-por-defectos-de-calidad/';
export const urlCosmeticos = (anio: number) => `https://www.aemps.gob.es/comunicacion/notas-informativas-cosmeticos-y-cuidado-personal/?fec=${anio}&cat=46`;

interface LoteMedicamento { number?: string; expiryDate?: number; nationalCodePresentation?: string }
interface ProductoMedicamento { name?: string; cn?: string; lots?: LoteMedicamento[] }
interface AlertaMedicamento {
  code: string; date: number; product: string; dciDoe: string; marketingAuthorisationHolder: string; manufacturer: string;
  defect: string; distributionInformation: string; defectClassification: string; precautionaryMeasures: string; latestDocumentUrl: string;
  products: ProductoMedicamento[];
}

const HACER_MEDICAMENTO = [
  'Comprueba el número de lote de tu envase. Si no coincide, esta alerta no te afecta.',
  'Si coincide, acude a tu farmacia para gestionar el cambio por un lote no afectado, o consulta con tu médico si es preciso.',
];

/** Extrae la variable que la página usa para pintar el listado. Si desaparece, falla de forma visible. */
export function extraerMedicamentos(html: string): AlertaMedicamento[] {
  const m = html.match(/const normalizedData = (\[.*\]);/);
  if (!m) throw new Error('AEMPS medicamentos: no se encuentra normalizedData');
  return JSON.parse(m[1]) as AlertaMedicamento[];
}

export function normalizarMedicamento(a: AlertaMedicamento): AlertaParseada {
  const productos: Producto[] = (a.products ?? []).map((p) => ({
    nombre: limpiar(p.name) || null,
    marcas: [],
    modelos: [],
    lotes: (p.lots ?? []).map((l) => ({
      numero: limpiar(l.number) || null,
      caducidad: l.expiryDate ? fechaMadrid(l.expiryDate) : null,
      consumoPreferente: null,
      codigoNacional: l.nationalCodePresentation ?? null,
    })),
    ean: [],
    registroAemps: p.cn ?? null,
    descripcion: limpiar(a.dciDoe) || null,
  }));
  const nombre = productos[0]?.nombre ?? (limpiar(a.dciDoe) || a.code);
  const defecto = limpiar(a.defect);
  const motivo = defecto.length > 150 ? `${defecto.slice(0, 147).replace(/\s+\S*$/, '')}…` : defecto;
  const medida = limpiar(a.precautionaryMeasures);
  const empresas: AlertaParseada['empresas'] = [];
  if (limpiar(a.marketingAuthorisationHolder)) empresas.push({ rol: 'titular', nombre: limpiar(a.marketingAuthorisationHolder) });
  if (limpiar(a.manufacturer)) empresas.push({ rol: 'fabricante', nombre: limpiar(a.manufacturer) });
  const documento = limpiar(a.latestDocumentUrl);
  return {
    id: `aemps-medicamentos-${slug(a.code)}`,
    fuente: 'aemps-medicamentos',
    idFuente: a.code,
    referenciaOficial: a.code,
    urlOficial: documento || URL_MEDICAMENTOS,
    tipoAviso: 'alerta',
    alertaBase: null,
    titulo: `Retirada de ${nombre}`,
    nombreVisible: capitalizar(nombre),
    motivo,
    resumen: null,
    fechas: { publicacion: fechaMadrid(a.date), publicacionWeb: null, modificacion: null },
    categoria: { literal: limpiar(a.product), normalizada: 'medicamentos' },
    publico: null,
    productos,
    riesgo: { tipos: [], tipoNormalizado: ['calidad'], descripcion: defecto, nivelLiteral: `Clase ${a.defectClassification}`, alergenos: [] },
    medidas: medida ? [{ texto: medida, fecha: null }] : [],
    recomendacion: null,
    hacer: HACER_MEDICAMENTO,
    hacerOrigen: 'general',
    distribucion: { ccaa: [], paisNotificante: null, paisOrigen: null, paisesDetectado: [], autoridadNotificante: null, literal: limpiar(a.distributionInformation) || null },
    empresas,
    imagenes: [],
    documentos: documento ? [{ url: documento, nombre: 'Alerta oficial de la AEMPS' }] : [],
    dedup: { claves: clavesDedup(a.code, productos) },
    procedencia: { formato: 'json-incrustado', extraccion: productos.some((p) => p.lotes.length) ? 'campo-estructurado' : 'texto-libre', consultadoEn: hoy() },
  };
}

export interface NotaListada { url: string; fecha: string | null; ref: string | null }

/** El listado trae fecha y referencia, útiles cuando la nota usa la plantilla nueva. */
export function parsearListaCosmeticos(html: string): NotaListada[] {
  const salida = new Map<string, NotaListada>();
  for (const fila of parse(html).querySelectorAll('table tr')) {
    const url = fila.querySelector('a')?.getAttribute('href') ?? '';
    if (!/\/informa\//.test(url) || !/retirada|cese|recuperaci/i.test(url) || salida.has(url)) continue;
    const fecha = fechaIso(limpiar(fila.querySelector('td')?.text));
    salida.set(url, { url, fecha, ref: limpiar(fila.text).match(/COS,?\s*\d+\/\d{4}/i)?.[0]?.replace(/\s+/g, ' ') ?? null });
  }
  return [...salida.values()];
}

/** "La AEMPS informa del cese... y recuperación de un lote del cosmético X" da "X". */
export function nombreDeNota(titulo: string): string {
  const tras = titulo.match(/(?:cosm[eé]ticos?)\s+(.+)$/i)?.[1];
  if (tras) return tras.replace(/\s+por\s+.+$/i, '').trim();
  return titulo
    .replace(/^.*?(?:recuperaci[oó]n|retirada del mercado|retirada|de uso)\s+de\s+/i, '')
    .replace(/^(?:varios lotes de|un lote de|lotes de|todos los|los|las|el|la|del|productos? de|productos?)\s+/i, '')
    .replace(/^(?:varios lotes de|un lote de|lotes de|todos los|los|las|el|la|del|productos? de|productos?)\s+/i, '')
    .replace(/\s+por\s+.+$/i, '')
    .trim();
}

/** "lotes ABC123, DEF456 y GHI789" o "Lote: 2305". Solo cuentan los códigos con algún dígito. */
export function lotesDeNota(texto: string): string[] {
  const listas = [...texto.matchAll(/\blotes?:?\s+(?:n[úu]mero\s+|n[ºo.]+\s*)?((?:[a-z0-9][a-z0-9-]{2,}(?:\s*,\s*|\s+y\s+)?)+)/gi)];
  return [...new Set(listas.flatMap((m) => m[1].split(/\s*,\s*|\s+y\s+/)).filter((l) => /\d/.test(l)))];
}

export function parsearNotaCosmetico(html: string, url: string, listado?: NotaListada): AlertaParseada {
  const raiz = parse(html);
  const titulo = limpiar(raiz.querySelector('h1')?.text);
  if (!titulo) throw new Error(`AEMPS cosméticos: sin título en ${url}`);
  const contenido = raiz.querySelector('.entry-content') ?? raiz;
  const meta = raiz.querySelector('meta[property="article:published_time"]')?.getAttribute('content')?.slice(0, 10);
  const publicacion = fechaLarga(limpiar(contenido.querySelector('.publicacion__fecha')?.text)) ?? listado?.fecha ?? meta;
  if (!publicacion) throw new Error(`AEMPS cosméticos: sin fecha en ${url}`);
  const texto = limpiar(contenido.structuredText);
  const ref = texto.match(/Referencia:\s*(COS,?\s*\d+\/\d{4})/i)?.[1]?.replace(/\s+/g, ' ') ?? listado?.ref ?? null;

  const puntos = contenido.querySelectorAll('.aemps-aviso__01 li').map((l) => limpiar(l.text));
  const motivo = puntos[0] ?? texto.match(/debido a\s+([^.]+)\./i)?.[1]?.replace(/^./, (c) => c.toUpperCase()) ?? null;
  const nombre = nombreDeNota(titulo);
  const lotes = lotesDeNota(texto);
  const usuarios = texto.match(/Informaci[oó]n para (?:las )?personas usuarias\s*(.+?)(?:Informaci[oó]n para|Fin de|$)/i)?.[1] ?? '';
  const hacer = usuarios.split(/(?<=\.)\s+/).map(limpiar).filter((f) => f.length > 10).slice(0, 4);
  const productos: Producto[] = [{ nombre: nombreLimpio(nombre), marcas: [], modelos: [], lotes: lotes.map((numero) => ({ numero })), ean: [] }];
  const slugNota = new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? slug(titulo);
  return {
    id: `aemps-cosmeticos-${ref ? slug(ref) : slug(slugNota).slice(0, 60)}`,
    fuente: 'aemps-cosmeticos',
    idFuente: slugNota,
    referenciaOficial: ref,
    urlOficial: url,
    tipoAviso: 'alerta',
    alertaBase: null,
    titulo,
    nombreVisible: nombreLimpio(nombre),
    motivo,
    resumen: null,
    fechas: { publicacion, publicacionWeb: null, modificacion: null },
    categoria: { literal: 'Cosméticos', normalizada: 'cosmeticos' },
    publico: null,
    productos,
    riesgo: { tipos: [], tipoNormalizado: tiposRiesgo(`${titulo} ${puntos.join(' ')}`), descripcion: puntos.join(' ') || null, nivelLiteral: null, alergenos: [] },
    medidas: [],
    recomendacion: usuarios ? limpiar(usuarios) : null,
    hacer,
    hacerOrigen: 'fuente',
    distribucion: { ccaa: [], paisNotificante: null, paisOrigen: null, paisesDetectado: [], autoridadNotificante: null, literal: null },
    empresas: [],
    imagenes: [],
    documentos: [],
    dedup: { claves: clavesDedup(ref, productos) },
    procedencia: { formato: 'html', extraccion: 'texto-libre', consultadoEn: hoy() },
  };
}

/** Safety Gate: XML oficial como base y JSON público como enriquecimiento opcional. */
import { XMLParser } from 'fast-xml-parser';
import { capitalizar, categoriaProducto, clavesDedup, dato, extraerEan, fechaIso, hoy, limpiar, separarLista, tiposRiesgo, urlValida } from '../normalizar.ts';
import type { Alerta, AlertaParseada, Producto } from '../tipos.ts';

export const URL_LISTA = 'https://ec.europa.eu/safety-gate-alerts/api/download/weeklyReport/list/xml/en';
export const urlNotificacion = (id: string) => `https://ec.europa.eu/safety-gate-alerts/public/api/notification/${id}?language=es`;

const xml = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true, isArray: (n) => n === 'notifications' || n === 'weeklyReport' || n === 'picture' });

export interface Informe { referencia: string; anio: number; url: string }

export function parsearLista(texto: string): Informe[] {
  const j = xml.parse(texto) as { 'Safety-Gate': { weeklyReport: { reference: string; year: string; URL: string }[] } };
  return j['Safety-Gate'].weeklyReport.map((r) => ({
    referencia: r.reference,
    anio: Number(r.year),
    // Sin el parámetro search la API responde 400: hay que conservar la URL tal cual.
    url: r.URL.replace('language=en', 'language=es'),
  }));
}

const HACER_PRODUCTO = [
  'Comprueba si la marca, el modelo o el lote coinciden con tu producto.',
  'Si coincide, deja de usarlo y contacta con la tienda o con el fabricante.',
];

type Notificacion = Record<string, unknown> & { pictures?: { picture?: unknown[] } | string };

const texto = (v: unknown) => dato(typeof v === 'object' ? '' : v);

function normalizarNotificacion(n: Notificacion): AlertaParseada {
  const referencia = String(n.reference ?? '');
  const id = referencia.match(/alertDetail\/(-?\d+)/)?.[1];
  if (!id) throw new Error(`Safety Gate: sin identificador en ${String(n.caseNumber)}`);
  const publicacion = fechaIso(String(n.publicationDate ?? ''));
  if (!publicacion) throw new Error(`Safety Gate ${id}: sin fecha`);

  const nombreTipo = texto(n.product);
  const nombre = texto(n.name);
  const marca = texto(n.brand);
  const lotes = texto(n.batchNumber);
  const modelo = texto(n.type_numberOfModel);
  const categoria = texto(n.category) ?? 'Otros';
  const riesgos = (texto(n.riskType) ?? '').split(/,\s*/).filter(Boolean);
  const peligro = texto(n.danger);
  const ref = texto(n.caseNumber);

  const productos: Producto[] = [{
    nombre: nombre ?? nombreTipo,
    marcas: marca ? [marca] : [],
    modelos: modelo ? separarLista(modelo) : [],
    lotes: lotes ? separarLista(lotes).map((numero) => ({ numero })) : [],
    ean: extraerEan(texto(n.barcode)),
    descripcion: texto(n.description),
    fechasTexto: texto(n.productionDates),
  }];
  const tipoProducto = nombreTipo ? capitalizar(nombreTipo) : 'Producto';
  const nombreVisible = [tipoProducto, marca].filter(Boolean).join(' ') + (!marca && nombre ? ` ${nombre}` : '');
  const fotos = typeof n.pictures === 'object' ? (n.pictures?.picture ?? []) : [];
  const vendedor = texto(n.onlineTrader);
  const urlRetirada = urlValida(texto(n.URLrecall));
  return {
    id: `safety-gate-${id.replace('-', 'n')}`,
    fuente: 'safety-gate',
    idFuente: id,
    referenciaOficial: ref,
    urlOficial: referencia,
    tipoAviso: 'alerta',
    alertaBase: null,
    titulo: [tipoProducto, marca, nombre].filter(Boolean).join(' · '),
    nombreVisible,
    motivo: riesgos.join(', ') || null,
    resumen: null,
    fechas: { publicacion, publicacionWeb: null, modificacion: null },
    categoria: { literal: categoria, normalizada: categoriaProducto(categoria) },
    publico: /profesional/i.test(String(n.type ?? '')) ? 'profesionales' : 'consumidores',
    productos,
    riesgo: { tipos: riesgos, tipoNormalizado: tiposRiesgo(`${riesgos.join(' ')} ${peligro ?? ''}`), descripcion: peligro, nivelLiteral: texto(n.level), alergenos: [] },
    medidas: medidasDesdeXml(texto(n.measures)),
    recomendacion: null,
    hacer: HACER_PRODUCTO,
    hacerOrigen: 'general',
    distribucion: { ccaa: [], paisNotificante: texto(n.notifyingCountry), paisOrigen: texto(n.countryOfOrigin), paisesDetectado: [], autoridadNotificante: null, literal: null },
    empresas: vendedor ? [{ rol: 'vendedor-online', nombre: vendedor.replace(/\s*\/\s*$/, '') }] : [],
    imagenes: fotos.map((u) => ({ urlOrigen: String(u), nombreFichero: null })),
    documentos: urlRetirada ? [{ url: urlRetirada, nombre: 'Aviso de retirada' }] : [],
    dedup: { claves: clavesDedup(ref, productos) },
    procedencia: { formato: 'xml', extraccion: 'campo-estructurado', consultadoEn: hoy(), enriquecido: false },
  };
}

/** El XML pega las medidas sin separador; se recuperan por la etiqueta "Categoría de medidas". */
export function medidasDesdeXml(t: string | null) {
  if (!t) return [];
  const medidas = [...t.matchAll(/Categor[ií]a de medidas:\s*(.+?)\.?\s*(?=Fecha de entrada en vigor|Tipo de operador|$)/g)].map((m) => limpiar(m[1]));
  const unicas = [...new Set(medidas)].filter(Boolean);
  return unicas.length ? unicas.map((texto) => ({ texto, fecha: null })) : [{ texto: t, fecha: null }];
}

/** Una alerta defectuosa no debe tirar el informe entero. */
export function parsearInforme(contenido: string, errores: string[] = []): AlertaParseada[] {
  const j = xml.parse(contenido) as { 'Safety-Gate'?: { report_date?: string; notifications?: Notificacion[] } };
  const fechaInforme = j['Safety-Gate']?.report_date;
  const salida: AlertaParseada[] = [];
  for (const n of j['Safety-Gate']?.notifications ?? []) {
    try {
      // Hay fechas imposibles en la fuente: entonces vale la del informe semanal.
      salida.push(normalizarNotificacion(fechaIso(String(n.publicationDate ?? '')) ? n : { ...n, publicationDate: fechaInforme }));
    } catch (e) {
      errores.push((e as Error).message);
    }
  }
  return salida;
}

interface NotificacionJson {
  modificationDate?: string;
  product?: { brands?: { brand?: string }[]; barcodes?: { barcode?: string }[]; batchNumbers?: { batchNumber?: string }[]; modelTypes?: { modelType?: string }[]; versions?: { packageDescription?: string | null }[] };
  reactingCountries?: { country?: { key?: string } }[];
}

/** El JSON trae arrays reales y los países donde se detectó, que el XML no da. */
export function enriquecer(a: Alerta, j: NotificacionJson): Alerta {
  const p = a.productos[0];
  const uno = (v: (string | undefined)[] | undefined) => (v ?? []).map((x) => dato(x)).filter((x): x is string => Boolean(x));
  const marcas = uno(j.product?.brands?.map((b) => b.brand));
  const modelos = uno(j.product?.modelTypes?.map((m) => m.modelType));
  const lotes = uno(j.product?.batchNumbers?.map((b) => b.batchNumber));
  const ean = (j.product?.barcodes ?? []).flatMap((b) => extraerEan(dato(b.barcode)));
  const productos: Producto[] = [{
    ...p,
    marcas: marcas.length ? marcas : p.marcas,
    modelos: modelos.length ? modelos : p.modelos,
    lotes: lotes.length ? lotes.map((numero) => ({ numero })) : p.lotes,
    ean: ean.length ? [...new Set(ean)] : p.ean,
    envase: dato(j.product?.versions?.[0]?.packageDescription) ?? p.envase ?? null,
  }];
  return {
    ...a,
    productos,
    fechas: { ...a.fechas, modificacion: j.modificationDate?.slice(0, 10) ?? null },
    distribucion: { ...a.distribucion, paisesDetectado: (j.reactingCountries ?? []).map((c) => c.country?.key).filter((k): k is string => Boolean(k)) },
    dedup: { claves: clavesDedup(a.referenciaOficial, productos) },
    procedencia: { ...a.procedencia, formato: 'json-api', enriquecido: true },
  };
}

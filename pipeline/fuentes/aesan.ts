/** AESAN: HTML con listas etiquetadas. Ver docs/fase-0/informe.md, sección 3.2. */
import { parse, type HTMLElement } from 'node-html-parser';
import { capitalizar, clavesDedup, extraerAlergenos, extraerCcaa, extraerEan, fechaIso, hoy, limpiar, nombreLimpio, slug, tiposRiesgo } from '../normalizar.ts';
import type { AlertaParseada, Lote, Producto } from '../tipos.ts';

export const BASE = 'https://www.aesan.gob.es';

export interface EntradaSitemap { slug: string; lastmod: string | null }

export function parsearSitemap(xml: string): EntradaSitemap[] {
  const salida: EntradaSitemap[] = [];
  for (const bloque of xml.split('<url>').slice(1)) {
    const loc = bloque.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '';
    const m = loc.match(/\/alertas\/(20\d\d_[^/]+)$/);
    if (m) salida.push({ slug: m[1], lastmod: bloque.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null });
  }
  return salida;
}

type Campo = 'nombre' | 'marca' | 'envase' | 'lote' | 'caducidad' | 'preferente' | 'peso' | 'temperatura' | 'ean' | 'fechas';

/** Las 23 variantes de etiqueta observadas se reducen a estos campos. */
export function campoDeEtiqueta(etiqueta: string): Campo | null {
  const e = etiqueta.toLowerCase();
  if (/c[oó]digos? de barras|^ean/.test(e)) return 'ean';
  if (/lotes? y fechas?|fechas? de .*\/lote|fecha.* y lote/.test(e)) return 'fechas';
  if (/lote/.test(e)) return 'lote';
  if (/marca/.test(e)) return 'marca';
  if (/caducidad/.test(e)) return 'caducidad';
  if (/consumo preferente/.test(e)) return 'preferente';
  if (/^fecha/.test(e)) return 'fechas';
  if (/aspecto|envase/.test(e)) return 'envase';
  if (/peso/.test(e)) return 'peso';
  if (/te?m?pe?ratura/.test(e)) return 'temperatura';
  if (/^nombre/.test(e)) return 'nombre';
  return null;
}

/** Separa los códigos de lote. Si hay algo más, conserva el texto: "todos los lotes" es información crítica. */
const FECHA_NUMERICA = /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/g;
const CANTIDAD = /\b\d+(?:[.,]\d+)?\s?(?:g|kg|ml|cl|l|ud|uds)\b\.?/gi;

export function interpretarLotes(valor: string): { lotes: Lote[]; texto: string | null } {
  const v = limpiar(valor);
  if (!v) return { lotes: [], texto: null };
  if (/^(todos|todas|cualquier)/i.test(v) || !/\d/.test(v)) return { lotes: [], texto: nombreLimpio(v) };
  const lotes: Lote[] = [];
  let hayTexto = false;
  for (const trozo of v.split(/\s*;\s*|\s*,\s*(?=\S*\d)|\s+y\s+(?=\S*\d)/)) {
    const fecha = fechaIso(trozo);
    const preferente = /preferente/i.test(trozo);
    const sinFechas = trozo
      .replace(/\b(?:con\s+)?(?:fechas?\s+de\s+)?(?:caducidad|consumo preferente)\b:?/gi, ' ')
      .replace(/\bfechas?\b:?/gi, ' ')
      .replace(FECHA_NUMERICA, ' ')
      .replace(CANTIDAD, ' ')
      .replace(/^\s*(?:n[úu]meros?\s+de\s+)?lotes?:?\s*/i, ' ');
    const codigos = sinFechas.match(/\b[A-Za-z]{0,6}\d[A-Za-z0-9./-]{2,}\b/g) ?? [];
    for (const numero of codigos) lotes.push({ numero, caducidad: fecha && !preferente ? fecha : null, consumoPreferente: fecha && preferente ? fecha : null });
    const resto = codigos.reduce((t, c) => t.replace(c, ' '), sinFechas).replace(/[.,:;()\s-]/g, '');
    // Lo que parece cantidad o fecha puede ser un lote: ante la duda se conserva el texto.
    const dudoso = trozo.search(CANTIDAD) >= 0 || (trozo.match(FECHA_NUMERICA) ?? []).some((f) => !fechaIso(f));
    if (resto.length > 2 || /\d/.test(resto) || dudoso) hayTexto = true;
  }
  return { lotes, texto: hayTexto || !lotes.length ? nombreLimpio(v) : null };
}

const NACIONAL = /(?:todo|toda|casi todo|mayor parte|gran parte)\b[^.]{0,20}?(?:territorio nacional|españa)|todas las comunidades aut[oó]nomas/i;

/** Frases sobre dónde se vendió. "Distribuidora" no cuenta: suele hablar de la empresa, no de la zona. */
export function distribucionDe(frases: string[]): { ccaa: string[]; nacional: boolean; literal: string | null } {
  const sobreZona = frases.flatMap((f, i) => {
    if (!/distribuci[oó]n|distribuid[oa]s?\b/i.test(f)) return [];
    return f.endsWith(':') && frases[i + 1] ? [`${f} ${frases[i + 1]}`] : [f];
  });
  const aviso = frases.find((f) => /no es descartable|redistribuci/i.test(f));
  const texto = sobreZona.join(' ');
  return { ccaa: extraerCcaa(texto), nacional: NACIONAL.test(texto), literal: [...new Set([...sobreZona, aviso].filter(Boolean))].join(' ') || null };
}

function productosDeListas(cuerpo: HTMLElement): Producto[] {
  const productos: Producto[] = [];
  let actual: Producto | null = null;
  let fechaCad: string | null = null;
  let fechaPref: string | null = null;
  const textos: string[] = [];

  const cerrar = () => {
    if (!actual) return;
    if (actual.lotes.length && (fechaCad || fechaPref)) {
      actual.lotes = actual.lotes.map((l): Lote => ({ ...l, caducidad: l.caducidad ?? fechaCad, consumoPreferente: l.consumoPreferente ?? fechaPref }));
    }
    actual.fechasTexto = textos.join(' · ') || null;
    productos.push(actual);
    actual = null; fechaCad = null; fechaPref = null; textos.length = 0;
  };
  const nuevo = (): Producto => ({ nombre: null, marcas: [], modelos: [], lotes: [], ean: [] });

  for (const li of cuerpo.querySelectorAll('li')) {
    const texto = limpiar(li.structuredText);
    const m = texto.match(/^([A-ZÁÉÍÓÚa-záéíóúñ /().º]{3,50}):\s*(.*)$/);
    if (!m) continue;
    const campo = campoDeEtiqueta(m[1]);
    const valor = m[2].trim();
    if (!campo) continue;
    if (campo === 'nombre') { cerrar(); actual = nuevo(); actual.nombre = valor || null; continue; }
    actual ??= nuevo();
    const p: Producto = actual;
    if (campo === 'marca') { if (valor) p.marcas.push(valor); }
    else if (campo === 'lote') {
      const r = interpretarLotes(valor);
      p.lotes.push(...r.lotes);
      if (r.texto) p.lotesTexto = [p.lotesTexto, r.texto].filter(Boolean).join(' · ');
    }
    else if (campo === 'caducidad') { fechaCad = fechaIso(valor); if (valor) textos.push(`Caducidad: ${valor}`); }
    else if (campo === 'preferente') { fechaPref = fechaIso(valor); if (valor) textos.push(`Consumo preferente: ${valor}`); }
    else if (campo === 'fechas') { if (valor) textos.push(`${m[1]}: ${valor}`); }
    else if (campo === 'ean') { p.ean.push(...extraerEan(valor)); }
    else if (campo === 'envase') p.envase = valor || null;
    else if (campo === 'peso') p.peso = valor || null;
    else if (campo === 'temperatura') p.temperatura = valor || null;
  }
  cerrar();
  return productos;
}

/** "...presencia de X en Y procedente de Z" da el motivo, el producto y el origen. */
export function analizarTitulo(titulo: string) {
  const t = titulo.replace(/\(Ref\.?[^)]*\)\.?/i, '').replace(/<br\s*\/?>/g, ' ').trim().replace(/\.$/, '');
  const origen = t.match(/proceden(?:te|tes) de\s+(.+)$/i)?.[1]?.trim() ?? null;
  const sinOrigen = t.replace(/,?\s*proceden(?:te|tes) de\s+.+$/i, '');
  const m = sinOrigen.match(/(?:presencia de|contenido de|riesgo de|por)\s+(.+?)\s+en\s+(?:un |una |el |la |los |las )?(.+)$/i);
  if (m) return { motivo: nombreLimpio(m[1].replace(/^(posible )?presencia de\s+/i, '')), producto: m[2].trim(), origen };
  // "Advertencia para personas con alergia...: lactosa no declarada en etiquetado de X"
  const tras = sinOrigen.split(/:\s+/).slice(1).join(': ').trim();
  if (tras) {
    const d = tras.match(/^(.+?)\s+en\s+(?:un |una |el |la |los |las )?(.+)$/i);
    return { motivo: nombreLimpio(d ? d[1] : tras), producto: d ? d[2].trim() : null, origen };
  }
  return { motivo: null, producto: null, origen };
}

function pasosQueHacer(texto: string, alergia: boolean, alergenos: string[]): string[] {
  const pasos: string[] = [];
  if (/absten\w+ de consumir|no consum/i.test(texto)) {
    pasos.push(alergia && alergenos.length ? `Si tienes alergia o intolerancia a: ${alergenos.join(', ').toLowerCase()}, no consumas este producto.` : 'Si tienes este producto en casa, no lo consumas.');
  }
  const sintomas = texto.match(/presentar sintomatolog[ií]a[^(.]*\(([^)]+)\)/i)?.[1];
  if (/centro de salud/i.test(texto)) pasos.push(`Si lo has consumido y tienes síntomas${sintomas ? ` (${sintomas})` : ''}, acude a un centro de salud.`);
  if (/embarazada/i.test(texto)) pasos.push('Si estás embarazada, consulta las recomendaciones de AESAN sobre alimentación durante el embarazo.');
  if (alergia && /no supone (?:ning[uú]n )?riesgo|resto de la poblaci[oó]n/i.test(texto)) pasos.push('Para el resto de personas, según AESAN, este producto no supone un riesgo.');
  return pasos;
}

export function parsearFicha(html: string, slugAesan: string): AlertaParseada {
  const raiz = parse(html);
  const seccion = raiz.querySelector('.aesan-section--2') ?? raiz;
  const titulo = limpiar(seccion.querySelector('h1')?.text || raiz.querySelector('title')?.text).replace(/<br\s*\/?>/g, ' ');
  if (!titulo) throw new Error(`AESAN ${slugAesan}: sin título`);
  const fechaTexto = limpiar(seccion.querySelector('.pageInfo__date')?.text);
  const publicacion = fechaIso(fechaTexto);
  if (!publicacion) throw new Error(`AESAN ${slugAesan}: sin fecha`);
  const literal = limpiar(seccion.querySelector('.pageInfo__category p')?.text) || 'Alertas alimentarias';
  const cuerpos = seccion.querySelectorAll('.post-container');
  const texto = limpiar(cuerpos.map((c) => c.structuredText).join(' '));
  const ref = titulo.match(/Ref\.?\s*(ES\d{4}\/\d+)/i)?.[1] ?? null;

  const { motivo, producto: productoTitulo, origen } = analizarTitulo(titulo);
  const alergia = /alergi|intoleranc/i.test(literal) || /^advertencia/i.test(titulo);
  const complemento = /complemento/i.test(literal) || /complemento/i.test(titulo);
  const alergenos = alergia ? extraerAlergenos(motivo ?? titulo) : [];

  let productos = cuerpos.flatMap(productosDeListas);
  if (!productos.length) productos = [{ nombre: productoTitulo ? capitalizar(productoTitulo) : null, marcas: [], modelos: [], lotes: [], ean: [] }];

  const frases = texto.split(/(?<=[.:])\s+/);
  const zona = distribucionDe(frases);
  const recomendacion = frases.filter((f) => /se recomienda|absten/i.test(f)).slice(0, 3).join(' ') || null;
  const autoridad = texto.match(/autoridades (?:competentes|sanitarias)?\s*(?:de |del |el |la )*([A-ZÁÉÍÓÚ][\wáéíóúñ ]+?)(?:\s+a través|,|\s+relativa)/)?.[1] ?? null;
  const hacer = pasosQueHacer(texto, alergia, alergenos);

  const p0 = productos[0];
  const nombreBase = p0.nombre ?? productoTitulo ?? titulo;
  const marca = p0.marcas[0];
  const yaTieneMarca = marca && nombreBase.toLowerCase().includes(marca.toLowerCase());
  const nombreVisible = nombreLimpio(capitalizar(`${nombreBase.replace(/[.,;:\s]+$/, '')}${marca && !yaTieneMarca ? ` ${marca}` : ''}`));

  const tipoAviso = /amp/i.test(slugAesan) ? 'ampliacion' : /correc/i.test(slugAesan) ? 'correccion' : 'alerta';
  const imagenes = seccion.querySelectorAll('img')
    .map((i) => i.getAttribute('src'))
    .filter((s): s is string => Boolean(s?.includes('/dam/')))
    .map((s) => ({ urlOrigen: new URL(s, BASE).href, nombreFichero: null }));

  return {
    id: `aesan-${slug(slugAesan)}`,
    fuente: 'aesan',
    idFuente: slugAesan,
    referenciaOficial: ref,
    urlOficial: `${BASE}/alertas/${slugAesan}`,
    tipoAviso,
    alertaBase: null,
    titulo,
    nombreVisible,
    motivo,
    resumen: null,
    fechas: { publicacion, publicacionWeb: null, modificacion: null },
    categoria: { literal, normalizada: complemento ? 'complementos' : 'alimentos' },
    publico: null,
    productos,
    riesgo: { tipos: motivo ? [motivo] : [], tipoNormalizado: tiposRiesgo(titulo, alergia ? ['alergeno'] : []), descripcion: null, nivelLiteral: null, alergenos },
    medidas: [],
    recomendacion,
    hacer,
    hacerOrigen: 'fuente',
    distribucion: {
      ccaa: zona.ccaa,
      nacional: zona.nacional,
      paisNotificante: null,
      paisOrigen: origen,
      paisesDetectado: [],
      autoridadNotificante: autoridad,
      literal: zona.literal,
    },
    empresas: [],
    imagenes,
    documentos: [],
    dedup: { claves: clavesDedup(ref, productos) },
    procedencia: { formato: 'html', extraccion: productos[0].marcas.length || productos[0].lotes.length ? 'texto-etiquetado' : 'texto-libre', consultadoEn: hoy() },
  };
}

/** Acceso a data/ en tiempo de compilación. Se lee una sola vez por proceso. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marcaClave, nombresCcaa } from '../../pipeline/normalizar.ts';
import type { Alerta, Fuente } from '../../pipeline/tipos.ts';
import { recortar } from './formato';
import { ICONO_CATEGORIA } from './iconos';
import { ruta } from './sitio';
import type { Tarjeta } from './tarjeta';

const raiz = join(process.cwd(), 'data');
const g = globalThis as unknown as { __alertas?: Alerta[] };

export function alertas(): Alerta[] {
  if (g.__alertas) return g.__alertas;
  const base = join(raiz, 'alertas');
  const todas = existsSync(base)
    ? readdirSync(base).flatMap((f) => readdirSync(join(base, f)).filter((n) => n.endsWith('.json')).map((n) => JSON.parse(readFileSync(join(base, f, n), 'utf8')) as Alerta))
    : [];
  g.__alertas = todas.sort((a, b) => b.fechas.publicacion.localeCompare(a.fechas.publicacion) || a.id.localeCompare(b.id));
  return g.__alertas;
}

export const porId = (() => {
  let m: Map<string, Alerta> | null = null;
  return (id: string) => (m ??= new Map(alertas().map((a) => [a.id, a]))).get(id);
})();

export interface Relacion { historial?: string[]; relacionadas?: string[] }
export const relaciones = (): Record<string, Relacion> => {
  const f = join(raiz, 'relaciones.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
};

interface EstadoFuente { ok: boolean; ultimoIntento?: string; ultimoOk?: string; total?: number; errores?: string[] }
export const estadoFuentes = (): Record<string, EstadoFuente> => {
  const f = join(raiz, 'estado/fuentes.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
};

export const FUENTES: Record<Fuente, { corto: string; largo: string; web: string; cita: string; espana: boolean }> = {
  aesan: { corto: 'AESAN', largo: 'Agencia Española de Seguridad Alimentaria y Nutrición', web: 'https://www.aesan.gob.es/alertas', cita: 'Fuente: AESAN.', espana: true },
  'aemps-medicamentos': { corto: 'AEMPS', largo: 'Agencia Española de Medicamentos y Productos Sanitarios', web: 'https://www.aemps.gob.es/comunicacion/alertas/', cita: 'Fuente: AEMPS.', espana: true },
  'aemps-cosmeticos': { corto: 'AEMPS', largo: 'Agencia Española de Medicamentos y Productos Sanitarios', web: 'https://www.aemps.gob.es/cosmeticos/control-del-mercado/alertas', cita: 'Fuente: AEMPS.', espana: true },
  'aemps-productos-sanitarios': { corto: 'AEMPS', largo: 'Agencia Española de Medicamentos y Productos Sanitarios', web: 'https://alertasps.aemps.es/alertasps/alertas', cita: 'Fuente: AEMPS.', espana: true },
  consumo: { corto: 'Consumo', largo: 'Dirección General de Consumo', web: 'https://servicios.consumo.gob.es/rapnaPublic', cita: 'Fuente: Dirección General de Consumo.', espana: true },
  'safety-gate': { corto: 'Safety Gate', largo: 'Comisión Europea, Safety Gate', web: 'https://ec.europa.eu/safety-gate-alerts/', cita: '© Unión Europea. Fuente: Comisión Europea, Safety Gate.', espana: false },
};

export type TipoNivel = 'grave' | 'general' | 'alergeno' | 'clase' | 'sin';

/** Solo la etiqueta que publica cada fuente: no se inventa gravedad. */
export function nivelDe(a: Alerta): { texto: string; tipo: TipoNivel } {
  const n = a.riesgo.nivelLiteral;
  if (a.fuente === 'safety-gate') return /grave/i.test(n ?? '') ? { texto: 'Riesgo grave', tipo: 'grave' } : { texto: n ?? 'Sin nivel publicado', tipo: 'sin' };
  if (n?.startsWith('Clase')) return { texto: n, tipo: 'clase' };
  if (a.fuente === 'aesan') {
    if (a.riesgo.tipoNormalizado?.includes('alergeno')) return { texto: 'Alérgenos', tipo: 'alergeno' };
    if (a.categoria.normalizada === 'complementos') return { texto: 'Complementos', tipo: 'general' };
    return { texto: 'Alerta general', tipo: 'general' };
  }
  return { texto: 'Sin nivel publicado', tipo: 'sin' };
}

/** Línea corta de identificación: lote, caducidad, EAN o modelo, lo que exista. */
export function identificacion(a: Alerta): string {
  const p = a.productos[0];
  if (!p) return '';
  const trozos: string[] = [];
  const lote = p.lotes[0];
  const masLotes = p.lotes.length > 1 ? ` (+${p.lotes.length - 1})` : '';
  if (lote?.numero) trozos.push(`Lote ${lote.numero.slice(0, 24)}${masLotes}`);
  else if (p.lotesTexto) trozos.push(p.lotesTexto.length > 34 ? `${p.lotesTexto.slice(0, 33)}…` : p.lotesTexto);
  if (p.ean[0]) trozos.push(`EAN ${p.ean[0]}`);
  else if (p.modelos[0]) trozos.push(`Modelo ${p.modelos[0].slice(0, 24)}`);
  if (a.productos.length > 1) trozos.push(`${a.productos.length} productos`);
  return trozos.join(' · ');
}

/** Datos de la tarjeta de una alerta. Pagefind guarda los mismos campos como metadatos de la ficha. */
export function tarjetaDe(a: Alerta): Tarjeta {
  const n = nivelDe(a);
  return {
    url: ruta(`/alerta/${a.slug}/`),
    nombre: recortar(a.nombreVisible, 80),
    motivo: recortar(a.motivo ?? '', 90),
    ident: identificacion(a),
    nivel: n.texto,
    tipoNivel: n.tipo,
    fuente: [FUENTES[a.fuente].corto, a.referenciaOficial].filter(Boolean).join(' '),
    fecha: a.fechas.publicacion,
    icono: ICONO_CATEGORIA[a.categoria.normalizada ?? 'otros'] ?? 'package',
  };
}

/** Comunidades en las que debe aparecer una alerta al filtrar: las citadas o, si es nacional, todas. */
export const comunidadesDe = (a: Alerta) => (a.distribucion.nacional ? nombresCcaa : a.distribucion.ccaa);

export interface Marca { slug: string; nombre: string; total: number }

/** Solo marcas con dos o más alertas, para no llenar el sitio de páginas pobres. */
export function marcas(): Marca[] {
  const m = new Map<string, { nombres: Map<string, number>; ids: Set<string> }>();
  for (const a of alertas()) {
    for (const p of a.productos) {
      for (const nombre of p.marcas) {
        const k = marcaClave(nombre);
        if (k.length < 2 || nombre.length > 40) continue;
        const e = m.get(k) ?? m.set(k, { nombres: new Map(), ids: new Set() }).get(k)!;
        e.nombres.set(nombre, (e.nombres.get(nombre) ?? 0) + 1);
        e.ids.add(a.id);
      }
    }
  }
  return [...m.entries()]
    .filter(([, e]) => e.ids.size >= 2)
    .map(([k, e]) => ({ slug: k, nombre: [...e.nombres.entries()].sort((a, b) => b[1] - a[1])[0][0], total: e.ids.size }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export const alertasDeMarca = (k: string) => alertas().filter((a) => a.productos.some((p) => p.marcas.some((n) => marcaClave(n) === k)));

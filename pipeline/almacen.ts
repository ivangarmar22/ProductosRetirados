/** Lectura y escritura de data/. Una alerta por fichero, con slug estable. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { slug } from './normalizar.ts';
import type { Alerta, AlertaParseada, Fuente } from './tipos.ts';

const DATOS = join(process.cwd(), 'data');
const ajv = new ((Ajv as unknown as { default?: typeof Ajv }).default ?? Ajv)({ allErrors: true, strict: false });
(((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats) as typeof addFormats)(ajv);
const validar = ajv.compile(JSON.parse(readFileSync(join(process.cwd(), 'schema/alerta.schema.json'), 'utf8')));

const rutaAlerta = (fuente: Fuente, id: string) => join(DATOS, 'alertas', fuente, `${id}.json`);
export const leerAlerta = (fuente: Fuente, id: string): Alerta | null => {
  const f = rutaAlerta(fuente, id);
  return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as Alerta) : null;
};

export function todasLasAlertas(): Alerta[] {
  const base = join(DATOS, 'alertas');
  if (!existsSync(base)) return [];
  return readdirSync(base).flatMap((f) =>
    readdirSync(join(base, f)).filter((n) => n.endsWith('.json')).map((n) => JSON.parse(readFileSync(join(base, f, n), 'utf8')) as Alerta));
}

export function leerEstado<T>(nombre: string, porDefecto: T): T {
  const f = join(DATOS, 'estado', nombre);
  return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : porDefecto;
}
export function guardarEstado(nombre: string, valor: unknown) {
  const f = join(DATOS, 'estado', nombre);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, `${JSON.stringify(valor, null, 1)}\n`);
}

/** El hash ignora la fecha de consulta: si el contenido no cambia, no hay commit. */
const hash = (a: Alerta) => {
  const { procedencia, ...resto } = a;
  return createHash('sha256').update(JSON.stringify({ ...resto, f: procedencia.formato })).digest('hex').slice(0, 16);
};

export type ResultadoGuardar = 'nueva' | 'cambiada' | 'igual' | 'invalida';

export function guardarAlerta(p: AlertaParseada, errores: string[]): ResultadoGuardar {
  const previa = leerAlerta(p.fuente, p.id);
  // El slug se fija la primera vez: la URL no cambia aunque cambie el título.
  const slugFinal = previa?.slug ?? `${slug(p.nombreVisible).slice(0, 70).replace(/-+$/, '')}-${p.id}`;
  const a: Alerta = { ...p, slug: slugFinal };
  a.procedencia = { ...a.procedencia, hashContenido: null };
  const h = hash(a);
  a.procedencia.hashContenido = h;
  const esValida = validar(a) as boolean;
  if (!esValida) {
    errores.push(`${a.id}: ${ajv.errorsText(validar.errors).slice(0, 200)}`);
    return 'invalida';
  }
  if (previa?.procedencia.hashContenido === h) return 'igual';
  const f = rutaAlerta(a.fuente, a.id);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, `${JSON.stringify(a, null, 1)}\n`);
  return previa ? 'cambiada' : 'nueva';
}

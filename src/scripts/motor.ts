/** Acceso a Pagefind y comprobación de resultados, común a todos los buscadores. */
import type { Tarjeta } from '../lib/tarjeta';

export const base = () => import.meta.env.BASE_URL.replace(/\/?$/, '/');

export type Datos = { url: string; content?: string; meta: Omit<Tarjeta, 'url'> };
export type Hallazgo = { data(): Promise<Datos> };

interface Pagefind {
  init(): Promise<void>;
  options(o: { baseUrl: string }): Promise<void>;
  search(q: string | null, o?: object): Promise<{ results: Hallazgo[] }>;
}

let pf: Promise<Pagefind> | null = null;
export function pagefind(): Promise<Pagefind> {
  pf ??= import(/* @vite-ignore */ `${base()}pagefind/pagefind.js`).then(async (m: Pagefind) => {
    // Sin esto, los enlaces de los resultados pierden la subcarpeta de publicación.
    await m.options({ baseUrl: base() });
    await m.init();
    return m;
  });
  return pf;
}

const TANDA = 60;

export const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Pagefind recorta las palabras que no encuentra: un lote mal escrito mostraría otro producto y ocultaría
 * el aviso de "no consta". Por eso cada palabra debe estar en la ficha; con dígitos, entera.
 */
function coincide(contenido: string, terminos: string[]): boolean {
  const texto = plano(contenido);
  return terminos.every((t) => {
    const raiz = /\d/.test(t) ? t : t.slice(0, Math.max(4, t.length - 2));
    return new RegExp(`(^|[^a-z0-9])${raiz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(texto);
  });
}

async function verificar(lista: Hallazgo[], termino: string, tope: number): Promise<Hallazgo[]> {
  const terminos = plano(termino).split(/[^a-z0-9ñ./-]+/).filter((t) => t.length >= 3);
  if (!terminos.length) return lista;
  const buenos: Datos[] = [];
  for (let i = 0; i < Math.min(lista.length, tope); i += TANDA) {
    const tanda = await Promise.all(lista.slice(i, Math.min(i + TANDA, tope)).map((h) => h.data()));
    const validos = tanda.filter((d) => coincide(`${d.content ?? ''} ${Object.values(d.meta).join(' ')}`, terminos));
    // Si toda la primera tanda es buena, Pagefind ha encontrado la palabra y no hay que seguir.
    if (i === 0 && validos.length === tanda.length) return lista;
    buenos.push(...validos);
    if (!validos.length) break;
  }
  return buenos.map((d) => ({ data: async () => d }));
}

/** Busca y verifica. Si escriben "L61027" y la ficha dice "61027", se reintenta sin el prefijo. */
export async function buscarVerificado(q: string | null, opciones: object = {}, tope = 300): Promise<Hallazgo[]> {
  const motor = await pagefind();
  const { results } = await motor.search(q, opciones);
  if (!q) return results;
  const buenos = await verificar(results, q, tope);
  const sinPrefijo = q.replace(/^\s*l(?:ote?)?[\s.:-]*(?=\d)/i, '');
  if (buenos.length || sinPrefijo === q) return buenos;
  return verificar((await motor.search(sinPrefijo, opciones)).results, sinPrefijo, tope);
}

export const aTarjeta = (d: Datos): Tarjeta => ({ ...d.meta, url: d.url });

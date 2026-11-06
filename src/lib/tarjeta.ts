/** Marcado de una tarjeta de alerta. Lo comparten las páginas estáticas y los resultados del buscador. */
import { ICONO_NIVEL } from './iconos';

export interface Tarjeta { url: string; nombre?: string; motivo?: string; ident?: string; nivel?: string; tipoNivel?: string; fuente?: string; fecha?: string; icono?: string }

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const esc = (t = '') => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const icono = (n: string) => `<svg class="i" aria-hidden="true"><use href="${base}iconos.svg?v=${import.meta.env.PUBLIC_VERSION}#${n}"/></svg>`;

export function tarjetaHtml(t: Tarjeta, nueva = false): string {
  const tipo = t.tipoNivel ?? 'sin';
  return `<article class="tar" data-tilt><span class="cat">${icono(t.icono ?? 'package')}</span><span class="nivel n-${esc(tipo)}">${icono(ICONO_NIVEL[tipo] ?? 'info')}${esc(t.nivel)}</span>${nueva ? '<span class="nueva">Nueva</span>' : ''}<h3><a href="${esc(t.url)}">${esc(t.nombre)}</a></h3><p class="mot">${esc(t.motivo)}</p>${t.ident ? `<p class="id">${esc(t.ident)}</p>` : ''}<p class="pie-t"><span>${esc(t.fuente)}</span><time datetime="${esc(t.fecha)}">${(t.fecha ?? '').split('-').reverse().join('/')}</time></p></article>`;
}

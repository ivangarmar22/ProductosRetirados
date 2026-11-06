import type { Alerta } from '../../pipeline/tipos.ts';
import { FUENTES, identificacion } from './datos';
import { escaparXml as x } from './formato';
import { ruta } from './sitio';

export function canal(site: URL, titulo: string, rutaFeed: string, items: Alerta[]): Response {
  const url = (r: string) => new URL(ruta(r), site).toString();
  const cuerpo = items.map((a) => {
    const enlace = url(`/alerta/${a.slug}/`);
    const texto = [a.motivo, identificacion(a), `Fuente: ${FUENTES[a.fuente].corto}`].filter(Boolean).join('. ');
    return `<item><title>${x(a.nombreVisible)}</title><link>${x(enlace)}</link><guid isPermaLink="true">${x(enlace)}</guid><pubDate>${new Date(`${a.fechas.publicacion}T08:00:00Z`).toUTCString()}</pubDate><description>${x(texto)}</description></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${x(titulo)}</title><link>${x(url('/'))}</link><description>Alertas y retiradas de productos en España.</description><language>es-ES</language><atom:link href="${x(url(rutaFeed))}" rel="self" type="application/rss+xml"/>${cuerpo}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

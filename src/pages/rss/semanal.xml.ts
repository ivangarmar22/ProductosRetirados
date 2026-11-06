import type { APIRoute } from 'astro';
import { alertas, FUENTES } from '../../lib/datos';
import { canal } from '../../lib/rss';

/** Feed para la newsletter: solo alertas de España de los últimos 7 días. */
export const GET: APIRoute = ({ site }) => {
  const desde = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  return canal(site!, 'Productos Retirados: resumen semanal', '/rss/semanal.xml', alertas().filter((a) => FUENTES[a.fuente].espana && a.fechas.publicacion >= desde));
};

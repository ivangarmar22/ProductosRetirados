import type { APIRoute } from 'astro';
import { alertas, marcas } from '../lib/datos';
import { ruta } from '../lib/sitio';
import { CATEGORIAS, nombresAlergenos, slug } from '../../pipeline/normalizar.ts';

export const GET: APIRoute = ({ site }) => {
  const url = (r: string) => new URL(ruta(r), site).toString();
  const fijas = ['/', '/alertas/', '/categorias/', '/alergenos/', '/marcas/', '/avisos/', '/guias/que-hacer-producto-retirado/', '/guias/donde-esta-el-lote/', '/fuentes/', '/estado/', '/estadisticas/', '/sobre/', '/apoya/', '/comprobar/', '/mi-despensa/', '/mis-alergias/', '/aviso-legal/', '/privacidad/', '/cookies/', '/accesibilidad/'];
  const lineas = [
    ...fijas.map((r) => `<url><loc>${url(r)}</loc></url>`),
    ...Object.keys(CATEGORIAS).filter((k) => alertas().some((a) => a.categoria.normalizada === k)).map((k) => `<url><loc>${url(`/categoria/${k}/`)}</loc></url>`),
    ...nombresAlergenos.map((n) => `<url><loc>${url(`/alergeno/${slug(n)}/`)}</loc></url>`),
    ...marcas().map((m) => `<url><loc>${url(`/marca/${m.slug}/`)}</loc></url>`),
    ...alertas().map((a) => `<url><loc>${url(`/alerta/${a.slug}/`)}</loc><lastmod>${a.fechas.modificacion ?? a.fechas.publicacion}</lastmod></url>`),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${lineas.join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

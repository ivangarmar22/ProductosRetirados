import type { APIRoute } from 'astro';
import { ruta } from '../lib/sitio';

export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(ruta('/sitemap.xml'), site)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

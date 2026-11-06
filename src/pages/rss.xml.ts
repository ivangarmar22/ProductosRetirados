import type { APIRoute } from 'astro';
import { alertas } from '../lib/datos';
import { canal } from '../lib/rss';

export const GET: APIRoute = ({ site }) => canal(site!, 'Productos Retirados: todas las alertas', '/rss.xml', alertas().slice(0, 50));

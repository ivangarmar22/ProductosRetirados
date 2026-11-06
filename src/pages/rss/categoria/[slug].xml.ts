import type { APIRoute } from 'astro';
import { alertas } from '../../../lib/datos';
import { canal } from '../../../lib/rss';
import { CATEGORIAS } from '../../../../pipeline/normalizar.ts';

export const getStaticPaths = () => Object.keys(CATEGORIAS).filter((k) => alertas().some((a) => a.categoria.normalizada === k)).map((slug) => ({ params: { slug } }));
export const GET: APIRoute = ({ site, params }) => canal(site!, `Productos Retirados: ${CATEGORIAS[params.slug!]}`, `/rss/categoria/${params.slug}.xml`, alertas().filter((a) => a.categoria.normalizada === params.slug).slice(0, 50));

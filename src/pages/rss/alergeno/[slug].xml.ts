import type { APIRoute } from 'astro';
import { alertas } from '../../../lib/datos';
import { canal } from '../../../lib/rss';
import { nombresAlergenos, slug } from '../../../../pipeline/normalizar.ts';

export const getStaticPaths = () => nombresAlergenos.map((nombre) => ({ params: { slug: slug(nombre) }, props: { nombre } }));
export const GET: APIRoute = ({ site, params, props }) => canal(site!, `Productos Retirados: ${props.nombre}`, `/rss/alergeno/${params.slug}.xml`, alertas().filter((a) => a.riesgo.alergenos?.includes(props.nombre)).slice(0, 50));

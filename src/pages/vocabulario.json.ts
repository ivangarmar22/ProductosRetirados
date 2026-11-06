import type { APIRoute } from 'astro';
import { alertas } from '../lib/datos';

/** Palabras reales del catálogo, en minúsculas y sin tildes, para sugerir correcciones de erratas. */
export const GET: APIRoute = () => {
  const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const cuenta = new Map<string, number>();
  for (const a of alertas()) {
    const textos = [a.nombreVisible, a.motivo ?? '', ...a.productos.flatMap((p) => p.marcas)];
    for (const w of plano(textos.join(' ')).split(/[^a-z0-9ñ]+/)) {
      if (w.length >= 4 && /[a-z]/.test(w) && !/\d/.test(w)) cuenta.set(w, (cuenta.get(w) ?? 0) + 1);
    }
  }
  const palabras = [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12000).map(([w]) => w);
  return new Response(JSON.stringify(palabras), { headers: { 'Content-Type': 'application/json' } });
};

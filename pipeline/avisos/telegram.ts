/** Publica las alertas nuevas de España en Telegram. La primera vez solo las marca como avisadas. */
import { guardarEstado, leerEstado, todasLasAlertas } from '../almacen.ts';
import type { Alerta } from '../tipos.ts';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CANAL = process.env.TELEGRAM_CHANNEL_ID;
const SITIO = (process.env.PUBLIC_SITE_URL ?? 'https://ivangarmar22.github.io/ProductosRetirados').replace(/\/$/, '');
const MAX_POR_EJECUCION = 15;
const ESPANA = new Set(['aesan', 'aemps-medicamentos', 'aemps-cosmeticos']);

const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

export function mensaje(a: Alerta): string {
  const lineas = [`<b>${esc(a.nombreVisible.slice(0, 300))}</b>`];
  if (a.motivo) lineas.push(esc(a.motivo.slice(0, 500)));
  const lote = a.productos[0]?.lotes[0]?.numero;
  if (lote) lineas.push(`Lote: <code>${esc(lote)}</code>`);
  if (a.distribucion.nacional) lineas.push('Distribución: todo o casi todo el país');
  else if (a.distribucion.ccaa.length) lineas.push(`Distribución: ${esc(a.distribucion.ccaa.join(', '))}`);
  lineas.push('', `<a href="${SITIO}/alerta/${a.slug}/">Ver la alerta</a>`);
  return lineas.join('\n');
}

async function principal() {
  if (!TOKEN || !CANAL) { console.log('Telegram sin configurar: no se envía nada.'); return; }
  const alertas = todasLasAlertas().filter((a) => ESPANA.has(a.fuente));
  const avisados = leerEstado<string[] | null>('notificados.json', null);
  if (avisados === null) {
    guardarEstado('notificados.json', alertas.map((a) => a.id).sort());
    console.log('Primera ejecución: se marcan', alertas.length, 'alertas como avisadas.');
    return;
  }
  const hechos = new Set(avisados);
  const pendientes = alertas.filter((a) => !hechos.has(a.id)).sort((x, y) => x.fechas.publicacion.localeCompare(y.fechas.publicacion)).slice(0, MAX_POR_EJECUCION);
  let enviados = 0;
  try {
    for (const a of pendientes) {
      const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CANAL, text: mensaje(a), parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
      });
      // Un 400 no se arregla reintentando: si se repitiera, bloquearía las alertas siguientes.
      if (r.status === 400) console.error('Telegram rechazó', a.id);
      else if (!r.ok) { console.error('Telegram respondió', r.status); break; }
      else enviados++;
      hechos.add(a.id);
      // Muy por debajo del límite de Telegram para grupos y canales.
      await new Promise((res) => setTimeout(res, 3500));
    }
  } catch (err) {
    console.error('Telegram no responde:', (err as Error).message);
  }
  guardarEstado('notificados.json', [...hechos].sort());
  console.log('Avisos enviados:', enviados);
}

if (import.meta.main) await principal();

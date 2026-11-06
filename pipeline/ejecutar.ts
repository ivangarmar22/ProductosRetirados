/** Orquestador: cada fuente va aislada y, si falla, conserva su último dato bueno. */
// node pipeline/ejecutar.ts [--fuente=aesan] [--enriquecer=300] [--max-informes=40]
import { guardarAlerta, guardarEstado, leerAlerta, leerEstado, todasLasAlertas, type ResultadoGuardar } from './almacen.ts';
import { Cliente } from './http.ts';
import * as aesan from './fuentes/aesan.ts';
import * as aemps from './fuentes/aemps.ts';
import * as sg from './fuentes/safety-gate.ts';
import { calcularRelaciones } from './relaciones.ts';
import type { Alerta, AlertaParseada } from './tipos.ts';
import { writeFileSync } from 'node:fs';

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const SOLO = arg('fuente');
const ENRIQUECER = Number(arg('enriquecer') ?? 300);
const MAX_INFORMES = Number(arg('max-informes') ?? 60);
/** Primer año de Safety Gate que se carga. Ver docs/fase-1/decisiones.md. */
const DESDE_SAFETY_GATE = 2020;
/** Primer año de notas de cosméticos que se carga. */
const DESDE_COSMETICOS = 2020;

const cliente = new Cliente();

interface Resumen { nuevas: number; cambiadas: number; iguales: number; invalidas: number; errores: string[] }
const vacio = (): Resumen => ({ nuevas: 0, cambiadas: 0, iguales: 0, invalidas: 0, errores: [] });
function contar(r: Resumen, x: ResultadoGuardar) {
  if (x === 'nueva') r.nuevas++; else if (x === 'cambiada') r.cambiadas++; else if (x === 'igual') r.iguales++; else r.invalidas++;
}
const guardar = (r: Resumen, a: AlertaParseada) => contar(r, guardarAlerta(a, r.errores));

async function fuenteAesan(r: Resumen) {
  const vistos = leerEstado<Record<string, string>>('aesan-lastmod.json', {});
  const entradas = aesan.parsearSitemap(await cliente.texto(`${aesan.BASE}/sitemap.xml`));
  if (entradas.length < 50) throw new Error(`Sitemap sospechoso: ${entradas.length} alertas`);
  for (const e of entradas) {
    const id = `aesan-${e.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (vistos[e.slug] && vistos[e.slug] === e.lastmod && leerAlerta('aesan', id)) { r.iguales++; continue; }
    try {
      guardar(r, aesan.parsearFicha(await cliente.texto(`${aesan.BASE}/alertas/${e.slug}`), e.slug));
      vistos[e.slug] = e.lastmod ?? '';
    } catch (err) { r.errores.push(`${e.slug}: ${(err as Error).message}`); }
  }
  guardarEstado('aesan-lastmod.json', vistos);
}

async function fuenteMedicamentos(r: Resumen) {
  const lista = aemps.extraerMedicamentos(await cliente.texto(aemps.URL_MEDICAMENTOS));
  if (lista.length < 100) throw new Error(`Listado sospechoso: ${lista.length} alertas`);
  for (const m of lista) {
    try { guardar(r, aemps.normalizarMedicamento(m)); } catch (err) { r.errores.push(`${m.code}: ${(err as Error).message}`); }
  }
}

async function fuenteCosmeticos(r: Resumen) {
  const vistas = new Set(leerEstado<string[]>('cosmeticos-vistas.json', []));
  const anioActual = new Date().getFullYear();
  let total = 0;
  for (let anio = anioActual; anio >= DESDE_COSMETICOS; anio--) {
    // Años cerrados: solo la primera vez.
    if (anio < anioActual && vistas.has(`anio-${anio}`)) continue;
    const notas = aemps.parsearListaCosmeticos(await cliente.texto(aemps.urlCosmeticos(anio)));
    total += notas.length;
    let completo = notas.length > 0;
    for (const nota of notas) {
      if (vistas.has(nota.url)) { r.iguales++; continue; }
      try { guardar(r, aemps.parsearNotaCosmetico(await cliente.texto(nota.url), nota.url, nota)); vistas.add(nota.url); } catch (err) { completo = false; r.errores.push(`${nota.url}: ${(err as Error).message}`); }
    }
    if (anio < anioActual && completo) vistas.add(`anio-${anio}`);
  }
  if (!total && !vistas.size) throw new Error('Listado sospechoso: ninguna nota de cosméticos');
  guardarEstado('cosmeticos-vistas.json', [...vistas].sort());
}

async function fuenteSafetyGate(r: Resumen) {
  const procesados = new Set(leerEstado<string[]>('safety-gate-informes.json', []));
  const informes = sg.parsearLista(await cliente.texto(sg.URL_LISTA)).filter((i) => i.anio >= DESDE_SAFETY_GATE);
  // Los dos últimos se repasan siempre por si traen correcciones.
  const pendientes = informes.filter((i, n) => n < 2 || !procesados.has(i.referencia)).slice(0, MAX_INFORMES);
  for (const inf of pendientes) {
    try {
      for (const a of sg.parsearInforme(await cliente.texto(inf.url), r.errores)) {
        const previa = leerAlerta('safety-gate', a.id);
        // Un informe repasado no debe borrar lo ya enriquecido.
        if (previa?.procedencia.enriquecido) continue;
        guardar(r, a);
      }
      procesados.add(inf.referencia);
    } catch (err) { r.errores.push(`${inf.referencia}: ${(err as Error).message}`); }
  }
  guardarEstado('safety-gate-informes.json', [...procesados].sort());

  // Enriquecimiento por tandas, de lo más reciente a lo más antiguo. Si falla, se mantiene el XML.
  const descartadas = new Set(leerEstado<string[]>('safety-gate-sin-json.json', []));
  const sinEnriquecer = todasLasAlertas()
    .filter((a) => a.fuente === 'safety-gate' && !a.procedencia.enriquecido && !a.idFuente.startsWith('-') && !descartadas.has(a.id))
    .sort((x, y) => y.fechas.publicacion.localeCompare(x.fechas.publicacion))
    .slice(0, ENRIQUECER);
  let fallos = 0;
  for (const a of sinEnriquecer) {
    try {
      const e = sg.enriquecer(a, await cliente.json(sg.urlNotificacion(a.idFuente)));
      guardar(r, e);
      fallos = 0;
    } catch (err) {
      const mensaje = (err as Error).message;
      if (mensaje.includes('HTTP 404')) { descartadas.add(a.id); continue; }
      if (++fallos >= 5) { r.errores.push(`Enriquecimiento detenido: ${mensaje}`); break; }
    }
  }
  guardarEstado('safety-gate-sin-json.json', [...descartadas].sort());
}

const FUENTES: Record<string, (r: Resumen) => Promise<void>> = {
  aesan: fuenteAesan,
  'aemps-medicamentos': fuenteMedicamentos,
  'aemps-cosmeticos': fuenteCosmeticos,
  'safety-gate': fuenteSafetyGate,
};

const estado = leerEstado<Record<string, Record<string, unknown>>>('fuentes.json', {});
const inicio = new Date().toISOString();

const ejecucion = await Promise.allSettled(
  Object.entries(FUENTES)
    .filter(([n]) => !SOLO || n === SOLO)
    .map(async ([nombre, fn]) => {
      const r = vacio();
      try {
        await fn(r);
        estado[nombre] = { ...estado[nombre], ok: r.errores.length < 10, ultimoIntento: inicio, ultimoOk: inicio, nuevas: r.nuevas, cambiadas: r.cambiadas, invalidas: r.invalidas, errores: r.errores.slice(0, 10) };
      } catch (err) {
        // El último dato bueno sigue en data/: no se toca.
        estado[nombre] = { ...estado[nombre], ok: false, ultimoIntento: inicio, errores: [(err as Error).message] };
      }
      console.log(nombre, JSON.stringify({ ...r, errores: r.errores.slice(0, 5) }));
    }),
);
ejecucion.filter((e) => e.status === 'rejected').forEach((e) => console.error(e));

const alertas: Alerta[] = todasLasAlertas();
for (const [fuente, datos] of Object.entries(estado)) datos.total = alertas.filter((a) => a.fuente === fuente).length;
guardarEstado('fuentes.json', estado);
const relaciones = calcularRelaciones(alertas);
writeFileSync('data/relaciones.json', `${JSON.stringify(relaciones)}\n`);
console.log('Total:', alertas.length, 'relaciones:', Object.keys(relaciones).length);

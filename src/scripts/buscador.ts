/** Buscador y filtros del listado. Todo el estado vive en la query string. */
import { tarjetaHtml } from '../lib/tarjeta';
import { aTarjeta, base, buscarVerificado, plano, type Hallazgo } from './motor';

const FILTROS = ['ambito', 'fuente', 'categoria', 'riesgo', 'alergeno', 'ccaa', 'anio'] as const;
const LOTE = 20;

const form = document.querySelector<HTMLFormElement>('#filtros');
const panel = document.querySelector<HTMLDetailsElement>('.filtros');
const q = document.querySelector<HTMLInputElement>('#q');
const marca = document.querySelector<HTMLInputElement>('#f-marca');
const orden = document.querySelector<HTMLSelectElement>('#f-orden');
const estatico = document.querySelector<HTMLElement>('#estatico');
const dinamico = document.querySelector<HTMLElement>('#dinamico');
const lista = document.querySelector<HTMLElement>('#resultados');
const resumen = document.querySelector<HTMLElement>('#resumen');
const activos = document.querySelector<HTMLElement>('#activos');
const mas = document.querySelector<HTMLButtonElement>('#cargar-mas');
const vacio = document.querySelector<HTMLElement>('#vacio');
const sugerencia = document.querySelector<HTMLElement>('#sugerencia');

let hallazgos: Hallazgo[] = [];
let mostrados = 0;
let turno = 0;

const leerUrl = () => new URLSearchParams(location.search);
const select = (n: string) => document.querySelector<HTMLSelectElement>(`#f-${n}`);

function aplicarUrlAlFormulario() {
  const p = leerUrl();
  if (q) q.value = p.get('q') ?? '';
  if (marca) marca.value = p.get('marca') ?? '';
  if (orden) orden.value = p.get('orden') ?? '';
  for (const f of FILTROS) { const s = select(f); if (s) s.value = p.get(f) ?? ''; }
}

function escribirUrl() {
  const p = new URLSearchParams();
  if (q?.value.trim()) p.set('q', q.value.trim());
  if (marca?.value.trim()) p.set('marca', marca.value.trim());
  for (const f of FILTROS) { const v = select(f)?.value; if (v) p.set(f, v); }
  if (orden?.value) p.set('orden', orden.value);
  const texto = p.toString();
  history.replaceState(null, '', texto ? `?${texto}` : location.pathname);
}

function pintarActivos() {
  if (!activos) return;
  activos.replaceChildren();
  for (const f of FILTROS) {
    const s = select(f);
    if (!s?.value) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${s.selectedOptions[0].textContent} ×`;
    b.setAttribute('aria-label', `Quitar filtro: ${s.selectedOptions[0].textContent}`);
    b.addEventListener('click', () => { s.value = ''; buscar(); });
    activos.append(b);
  }
}

async function cargarMas() {
  const yo = turno;
  const tanda = hallazgos.slice(mostrados, mostrados + LOTE);
  const datos = await Promise.all(tanda.map((h) => h.data()));
  if (yo !== turno || !lista) return;
  lista.insertAdjacentHTML('beforeend', datos.map((d) => tarjetaHtml(aTarjeta(d))).join(''));
  mostrados += tanda.length;
  if (mas) mas.hidden = mostrados >= hallazgos.length;
}

function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = t;
    }
  }
  return fila[b.length];
}

/** Pagefind no tolera erratas: se busca la palabra más parecida del vocabulario. */
async function corregir(texto: string): Promise<string | null> {
  const vocabulario: string[] = await (await fetch(`${base()}vocabulario.json`)).json();
  let cambiado = false;
  const palabras = texto.split(/\s+/).map((p) => {
    const w = plano(p);
    if (w.length < 4 || vocabulario.includes(w)) return p;
    let mejor = '';
    let mejorD = w.length >= 7 ? 3 : 2;
    for (const v of vocabulario) {
      if (Math.abs(v.length - w.length) >= mejorD) continue;
      const d = distancia(w, v);
      if (d < mejorD) { mejorD = d; mejor = v; }
    }
    if (mejor) { cambiado = true; return mejor; }
    return p;
  });
  return cambiado ? palabras.join(' ') : null;
}

async function buscar() {
  const yo = ++turno;
  escribirUrl();
  pintarActivos();
  const p = leerUrl();
  const termino = [p.get('q'), p.get('marca')].filter(Boolean).join(' ').trim();
  const filtros: Record<string, string> = {};
  for (const f of FILTROS) { const v = p.get(f); if (v) filtros[f] = v; }
  const hayBusqueda = Boolean(termino) || Object.keys(filtros).length > 0;
  if (estatico) estatico.hidden = hayBusqueda;
  if (dinamico) dinamico.hidden = !hayBusqueda;
  if (!hayBusqueda) return;

  if (resumen) resumen.textContent = 'Buscando…';
  const orden = p.get('orden') ?? (termino ? 'relevancia' : 'recientes');
  const opciones: Record<string, unknown> = { filters: filtros };
  if (orden === 'recientes') opciones.sort = { fecha: 'desc' };
  if (orden === 'antiguas') opciones.sort = { fecha: 'asc' };
  const verificados = await buscarVerificado(termino || null, opciones);
  if (yo !== turno) return;
  hallazgos = verificados;
  mostrados = 0;
  lista?.replaceChildren();
  if (sugerencia) sugerencia.hidden = true;
  if (vacio) vacio.hidden = hallazgos.length > 0;
  if (lista) lista.hidden = hallazgos.length === 0;
  if (resumen) resumen.textContent = `${hallazgos.length.toLocaleString('es-ES')} ${hallazgos.length === 1 ? 'alerta' : 'alertas'}`;
  if (mas) mas.hidden = true;
  if (hallazgos.length) await cargarMas();
  else {
    const nombre = document.querySelector('#vacio-termino');
    if (nombre) nombre.textContent = termino ? `«${termino}»` : 'estos filtros';
  }
  // Con pocos resultados también puede ser una errata: se propone la corrección.
  if (!termino || !sugerencia || hallazgos.length >= 5 || /\d/.test(termino)) return;
  const c = await corregir(termino);
  if (c && yo === turno) {
    const a = sugerencia.querySelector('a');
    if (a) { a.textContent = c; a.href = `?q=${encodeURIComponent(c)}`; }
    sugerencia.hidden = false;
  }
}

if (form) {
  if (panel && matchMedia('(min-width: 48rem)').matches) panel.open = true;
  aplicarUrlAlFormulario();
  form.addEventListener('submit', (e) => { e.preventDefault(); if (panel && !matchMedia('(min-width: 48rem)').matches) panel.open = false; buscar(); });
  form.addEventListener('change', () => buscar());
  mas?.addEventListener('click', cargarMas);
  if (location.search) buscar();
}

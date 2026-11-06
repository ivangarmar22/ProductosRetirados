/** Mi despensa: marcas y productos vigilados, buscados en cada visita. */
import { tarjetaHtml } from '../lib/tarjeta';
import { guardarDespensa, leerDespensa } from './almacen';
import { aTarjeta, buscarVerificado } from './motor';

const form = document.querySelector<HTMLFormElement>('#anadir')!;
const input = form.querySelector('input')!;
const chips = document.querySelector<HTMLElement>('#vigiladas')!;
const resumen = document.querySelector<HTMLElement>('#resumen')!;
const lista = document.querySelector<HTMLElement>('#resultados')!;

const despensa = leerDespensa();
const anterior = despensa.visita ?? '';
despensa.visita = new Date().toISOString().slice(0, 10);
guardarDespensa(despensa);

function pintarChips() {
  chips.replaceChildren(...despensa.vigiladas.map((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${v} ×`;
    b.setAttribute('aria-label', `Dejar de vigilar ${v}`);
    b.addEventListener('click', () => { despensa.vigiladas = despensa.vigiladas.filter((x) => x !== v); cambiar(); });
    return b;
  }));
}

let turno = 0;
async function pintar() {
  const yo = ++turno;
  lista.replaceChildren();
  if (!despensa.vigiladas.length) { resumen.textContent = 'Añade una marca o un producto para empezar.'; return; }
  resumen.textContent = 'Buscando…';
  const tandas = await Promise.all(despensa.vigiladas.map(async (v) => {
    const buenos = await buscarVerificado(v, { sort: { fecha: 'desc' } }, 60);
    return Promise.all(buenos.slice(0, 20).map((h) => h.data()));
  }));
  if (yo !== turno) return;
  const unicas = new Map(tandas.flat().map((d) => [d.url, aTarjeta(d)]));
  const orden = [...unicas.values()].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
  const esNueva = (fecha = '') => anterior !== '' && fecha > anterior;
  const nuevas = orden.filter((t) => esNueva(t.fecha)).length;
  resumen.textContent = orden.length
    ? `${orden.length.toLocaleString('es-ES')} ${orden.length === 1 ? 'alerta' : 'alertas'}${nuevas ? `, ${nuevas} ${nuevas === 1 ? 'nueva' : 'nuevas'} desde tu última visita` : ''}.`
    : 'No consta ninguna alerta. Esto no significa que tus productos sean seguros.';
  lista.innerHTML = orden.map((t) => tarjetaHtml(t, esNueva(t.fecha))).join('');
}

function cambiar() {
  guardarDespensa(despensa);
  pintarChips();
  pintar();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = input.value.trim();
  if (v && !despensa.vigiladas.some((x) => x.toLowerCase() === v.toLowerCase())) despensa.vigiladas.push(v);
  input.value = '';
  cambiar();
});
pintarChips();
pintar();

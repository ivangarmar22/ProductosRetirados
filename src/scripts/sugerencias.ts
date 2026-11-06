/** Sugerencias al escribir: combobox accesible sobre Pagefind, que solo se carga al enfocar el buscador. */
import { esc } from '../lib/tarjeta';
import { aTarjeta, base, buscarVerificado, pagefind, plano } from './motor';

const MAX = 5;

function resaltar(texto: string, termino: string): string {
  const i = plano(texto).indexOf(plano(termino));
  if (i < 0) return esc(texto);
  return `${esc(texto.slice(0, i))}<mark>${esc(texto.slice(i, i + termino.length))}</mark>${esc(texto.slice(i + termino.length))}`;
}

document.querySelectorAll<HTMLElement>('[data-buscador]').forEach((raiz) => {
  const input = raiz.querySelector('input')!;
  const lista = raiz.querySelector<HTMLUListElement>('.sug')!;
  let activo = -1;
  let turno = 0;
  let espera = 0;

  const cerrar = () => {
    lista.hidden = true;
    activo = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  async function pintar() {
    const yo = ++turno;
    const q = input.value.trim();
    if (q.length < 3) { cerrar(); return; }
    const buenos = await buscarVerificado(q, {}, 12);
    const datos = await Promise.all(buenos.slice(0, MAX).map((h) => h.data()));
    if (yo !== turno) return;
    if (!datos.length) { cerrar(); return; }
    const filas = datos.map(aTarjeta).map((t, i) => `<li role="option" id="sug-${i}" aria-selected="false"><a href="${esc(t.url)}" tabindex="-1">${resaltar(t.nombre ?? '', q)}<small>${esc(t.motivo)}</small></a></li>`);
    filas.push(`<li role="option" id="sug-${datos.length}" aria-selected="false"><a class="sug-todo" href="${base()}alertas/?q=${encodeURIComponent(q)}" tabindex="-1">Ver todos los resultados</a></li>`);
    lista.innerHTML = filas.join('');
    activo = -1;
    lista.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  input.addEventListener('focus', () => { pagefind(); }, { once: true });
  input.addEventListener('input', () => { clearTimeout(espera); espera = window.setTimeout(pintar, 160); });
  input.addEventListener('keydown', (e) => {
    const filas = [...lista.children] as HTMLElement[];
    if (e.key === 'Escape') { turno++; cerrar(); return; }
    if (lista.hidden || !filas.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activo = (activo + (e.key === 'ArrowDown' ? 1 : -1) + filas.length) % filas.length;
      filas.forEach((f, i) => { f.classList.toggle('on', i === activo); f.setAttribute('aria-selected', String(i === activo)); });
      input.setAttribute('aria-activedescendant', filas[activo].id);
    }
    if (e.key === 'Enter' && activo >= 0) { e.preventDefault(); filas[activo].querySelector('a')!.click(); }
  });
  raiz.closest('form')?.addEventListener('submit', () => { turno++; cerrar(); });
  document.addEventListener('click', (e) => { if (!raiz.contains(e.target as Node)) cerrar(); });
});

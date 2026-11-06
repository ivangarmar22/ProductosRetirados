/** Comprobador guiado: tipo de producto, marca o lote, resultado. */
import { esc } from '../lib/tarjeta';
import { aTarjeta, base, buscarVerificado } from './motor';

const raiz = document.querySelector<HTMLElement>('[data-comprobador]');
if (raiz) {
  const pasos = [...raiz.querySelectorAll<HTMLElement>('.paso')];
  const barra = raiz.querySelector<HTMLElement>('.progreso i')!;
  const numero = raiz.querySelector<HTMLElement>('[data-paso]')!;
  const elegido = raiz.querySelector<HTMLElement>('[data-elegido]')!;
  const salida = raiz.querySelector<HTMLElement>('[data-salida]')!;
  const form = raiz.querySelector<HTMLFormElement>('form')!;
  const input = form.querySelector('input')!;
  let categoria = '';

  const ir = (n: number, foco = true) => {
    pasos.forEach((p, i) => { p.hidden = i !== n; });
    barra.style.width = `${((n + 1) / pasos.length) * 100}%`;
    numero.textContent = `Paso ${n + 1} de ${pasos.length}`;
    if (foco) pasos[n].querySelector<HTMLElement>('h3')?.focus();
  };

  raiz.querySelectorAll<HTMLButtonElement>('[data-tipo]').forEach((b) => b.addEventListener('click', () => {
    categoria = b.dataset.tipo!;
    elegido.textContent = b.textContent!.trim();
    ir(1, false);
    input.focus();
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    let hallazgos = await buscarVerificado(q, { filters: categoria ? { categoria } : {} });
    // Si se eligió mal la categoría, no debe parecer que no hay alertas.
    const fuera = categoria !== '' && !hallazgos.length;
    if (fuera) hallazgos = await buscarVerificado(q);
    const n = hallazgos.length;
    if (n) {
      const todas = `${base()}alertas/?q=${encodeURIComponent(q)}${categoria && !fuera ? `&categoria=${encodeURIComponent(categoria)}` : ''}`;
      const datos = (await Promise.all(hallazgos.slice(0, 3).map((h) => h.data()))).map(aTarjeta);
      salida.innerHTML = `<p class="res mal"><b>${n === 1 ? 'Hay 1 alerta que coincide' : `Hay ${n.toLocaleString('es-ES')} alertas que coinciden`}${fuera ? ' en otra categoría' : ''}.</b> Comprueba el lote en la ficha.</p><ul class="res-l">${datos.map((t) => `<li><a href="${esc(t.url)}">${esc(t.nombre)}</a></li>`).join('')}</ul><a class="mas" href="${todas}">Ver todas</a>`;
    } else {
      salida.innerHTML = '<p class="res ok"><b>No consta ninguna alerta.</b> Esto no significa que el producto sea seguro: prueba también con el lote o el nombre exacto.</p>';
    }
    ir(2);
  });

  raiz.querySelector('[data-reinicio]')?.addEventListener('click', () => { form.reset(); salida.replaceChildren(); ir(0); });
  ir(0, false);
}

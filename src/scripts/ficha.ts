/** "¿Es tu lote?" y "Vigilar marca" en la ficha de una alerta. */
import { guardarDespensa, leerDespensa } from './almacen';

const limpio = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^L(OTE|OT)?(?=\d)/, '');

const caja = document.querySelector<HTMLElement>('[data-lotes]');
if (caja) {
  const lotes: string[] = JSON.parse(caja.dataset.lotes!).map(limpio);
  const input = caja.querySelector('input')!;
  const salida = caja.querySelector<HTMLElement>('.lote-res')!;
  input.addEventListener('input', () => {
    const v = limpio(input.value);
    if (!v) { salida.className = 'lote-res'; salida.textContent = ''; return; }
    if (lotes.includes(v)) { salida.className = 'lote-res mal'; salida.innerHTML = '<b>Coincide.</b> Este lote está afectado: sigue los pasos de abajo.'; return; }
    if (lotes.some((l) => l.startsWith(v))) { salida.className = 'lote-res sigue'; salida.textContent = 'Sigue escribiendo…'; return; }
    salida.className = 'lote-res ok';
    salida.innerHTML = '<b>No coincide</b> con los lotes de esta alerta. Revisa que esté bien escrito y, si dudas, trátalo como afectado.';
  });
}

const vigilar = document.querySelector<HTMLButtonElement>('[data-vigilar]');
if (vigilar) {
  const marca = vigilar.dataset.vigilar!;
  const texto = vigilar.querySelector('span')!;
  const pintar = (d = leerDespensa()) => { texto.textContent = d.vigiladas.includes(marca) ? `Vigilando ${marca}` : `Vigilar ${marca}`; };
  vigilar.hidden = false;
  pintar();
  vigilar.addEventListener('click', () => {
    const d = leerDespensa();
    d.vigiladas = d.vigiladas.includes(marca) ? d.vigiladas.filter((v) => v !== marca) : [...d.vigiladas, marca];
    guardarDespensa(d);
    pintar(d);
  });
}

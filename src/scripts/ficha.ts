/** "¿Es tu lote?" y fotos del producto en la ficha de una alerta. */

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

// Las fotos solo se piden al pulsar: hasta entonces, ninguna web externa recibe la visita.
const fotos = document.querySelector<HTMLElement>('[data-fotos]');
if (fotos) {
  const urls: string[] = JSON.parse(fotos.dataset.fotos!);
  const abrir = fotos.querySelector<HTMLAnchorElement>('a.btn')!;
  const visor = fotos.querySelector('dialog')!;
  const grande = visor.querySelector('img')!;
  const cuenta = visor.querySelector<HTMLElement>('.visor-n')!;
  const pasos = visor.querySelectorAll<HTMLElement>('[data-paso]');
  let actual = 0;

  const mostrar = (n: number) => {
    actual = (n + urls.length) % urls.length;
    visor.classList.add('cargando');
    grande.src = urls[actual];
    grande.alt = `${fotos.dataset.nombre}, foto ${actual + 1} de ${urls.length}`;
    cuenta.textContent = `${actual + 1} de ${urls.length}`;
    cuenta.hidden = urls.length < 2;
    pasos.forEach((b) => { b.hidden = urls.length < 2; });
  };

  grande.addEventListener('load', () => visor.classList.remove('cargando'));
  grande.addEventListener('error', () => {
    urls.splice(actual, 1);
    if (urls.length) { mostrar(actual); return; }
    visor.close();
    abrir.remove();
    fotos.querySelector('.ref')!.textContent = 'No se han podido cargar las fotos. Puedes verlas en la fuente oficial.';
  });
  abrir.addEventListener('click', (e) => {
    e.preventDefault();
    mostrar(0);
    visor.showModal();
  });
  visor.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const boton = t.closest<HTMLElement>('[data-paso], [data-cerrar]');
    if (boton?.dataset.paso) mostrar(actual + Number(boton.dataset.paso));
    else if (boton || t === visor) visor.close();
  });
  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrar(actual - 1);
    if (e.key === 'ArrowRight') mostrar(actual + 1);
  });
  let inicio = 0;
  visor.addEventListener('pointerdown', (e) => { inicio = e.clientX; });
  visor.addEventListener('pointerup', (e) => {
    const d = e.clientX - inicio;
    if (e.pointerType !== 'mouse' && Math.abs(d) > 50) mostrar(actual + (d < 0 ? 1 : -1));
  });
}

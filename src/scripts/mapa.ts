/** Mapa de la portada: globo con la cifra y resaltado cruzado entre el mapa y la lista. */
const figura = document.querySelector<HTMLElement>('.mapa');
const globo = figura?.querySelector<HTMLElement>('[data-globo]');

if (figura && globo) {
  const enlaces = [...document.querySelectorAll<Element>('.mapa-rej [data-ca]')];
  const resaltar = (nombre: string | null) => enlaces.forEach((a) => a.classList.toggle('on', a.getAttribute('data-ca') === nombre));

  const mostrar = (a: Element, x: number, y: number) => {
    const q = figura.getBoundingClientRect();
    globo.replaceChildren(a.getAttribute('data-ca')!, ': ', Object.assign(document.createElement('b'), { textContent: a.getAttribute('data-n') }));
    globo.hidden = false;
    const medio = globo.offsetWidth / 2;
    globo.style.left = `${Math.min(q.width - medio, Math.max(medio, x - q.left))}px`;
    globo.style.top = `${Math.max(globo.offsetHeight + 10, y - q.top)}px`;
  };
  const ocultar = () => { globo.hidden = true; resaltar(null); };

  document.querySelector('.mapa-rej')?.addEventListener('pointerover', (e) => {
    const a = (e.target as Element).closest('[data-ca]');
    if (a) resaltar(a.getAttribute('data-ca')); else resaltar(null);
  });
  document.querySelector('.mapa-rej')?.addEventListener('pointerleave', ocultar);
  figura.addEventListener('pointermove', (e) => {
    const a = (e.target as Element).closest('[data-ca]');
    if (a && e.pointerType === 'mouse') mostrar(a, e.clientX, e.clientY); else globo.hidden = true;
  });
  figura.addEventListener('focusin', (e) => {
    const a = (e.target as Element).closest('[data-ca]');
    if (!a) return;
    const q = a.getBoundingClientRect();
    resaltar(a.getAttribute('data-ca'));
    mostrar(a, q.left + q.width / 2, q.top + q.height / 2);
  });
  figura.addEventListener('focusout', ocultar);
}

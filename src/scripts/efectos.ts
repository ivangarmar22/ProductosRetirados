/** Efectos comunes. Todos respetan prefers-reduced-motion. */
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const raiz = document.documentElement;

const aparicion = new IntersectionObserver((entradas) => entradas.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('visto'); aparicion.unobserve(e.target); }
}), { threshold: 0.08 });
document.querySelectorAll('[data-ver]').forEach((el) => aparicion.observe(el));

const formato = new Intl.NumberFormat('es-ES');
const contador = new IntersectionObserver((entradas) => entradas.forEach((e) => {
  if (!e.isIntersecting) return;
  contador.unobserve(e.target);
  const fin = Number((e.target as HTMLElement).dataset.cuenta);
  const inicio = performance.now();
  const paso = (t: number) => {
    const k = Math.min(1, (t - inicio) / 1400);
    e.target.textContent = formato.format(Math.round(fin * (1 - (1 - k) ** 3)));
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}), { threshold: 0.4 });
if (!quieto) document.querySelectorAll('[data-cuenta]').forEach((el) => contador.observe(el));

const cabecera = document.querySelector('.cab');
addEventListener('scroll', () => cabecera?.classList.toggle('compacta', scrollY > 40), { passive: true });

if (!quieto && matchMedia('(hover: hover)').matches) {
  let actual: HTMLElement | null = null;
  const soltar = () => { actual?.style.removeProperty('--rx'); actual?.style.removeProperty('--ry'); actual = null; };
  addEventListener('pointermove', (e) => {
    const t = (e.target as Element).closest?.<HTMLElement>('[data-tilt]') ?? null;
    if (t !== actual) soltar();
    if (!t) return;
    actual = t;
    const q = t.getBoundingClientRect();
    t.style.setProperty('--rx', `${((e.clientY - q.top) / q.height - 0.5) * -6}deg`);
    t.style.setProperty('--ry', `${((e.clientX - q.left) / q.width - 0.5) * 6}deg`);
  }, { passive: true });
}

const rotar = document.querySelector<HTMLElement>('[data-rotar]');
if (rotar && !quieto) {
  const palabras = rotar.dataset.rotar!.split('|');
  let n = 0;
  setInterval(() => {
    if (raiz.classList.contains('quieto') || document.hidden) return;
    rotar.classList.add('sale');
    setTimeout(() => { n = (n + 1) % palabras.length; rotar.textContent = palabras[n]; rotar.classList.remove('sale'); }, 260);
  }, 2600);
}

const pausa = document.querySelector<HTMLButtonElement>('[data-pausa]');
pausa?.addEventListener('click', () => {
  const parado = raiz.classList.toggle('quieto');
  const uso = pausa.querySelector('use')!;
  pausa.setAttribute('aria-pressed', String(parado));
  uso.setAttribute('href', uso.getAttribute('href')!.replace(/#.*/, parado ? '#play' : '#pause'));
});

document.querySelectorAll<HTMLButtonElement>('[data-copiar]').forEach((b) => {
  if (!navigator.clipboard) return;
  b.hidden = false;
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copiar!);
      b.querySelector('span')!.textContent = 'Copiado';
    } catch { /* el dato sigue a la vista */ }
  });
});

// Interacción común de los prototipos. Respeta prefers-reduced-motion.
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const plano = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Aparición al hacer scroll
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: 0.12 });
$$('[data-ver]').forEach((el, i) => { el.style.setProperty('--r', `${(i % 6) * 60}ms`); io.observe(el); });

// Contadores
const fmt = new Intl.NumberFormat('es-ES');
const cont = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  cont.unobserve(e.target);
  const fin = +e.target.dataset.cuenta;
  if (quieto) { e.target.textContent = fmt.format(fin); return; }
  const t0 = performance.now();
  const paso = (t) => { const k = Math.min(1, (t - t0) / 1400); e.target.textContent = fmt.format(Math.round(fin * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}), { threshold: 0.4 });
$$('[data-cuenta]').forEach((e) => cont.observe(e));

// Cabecera que se compacta
const cab = $('.cab');
if (cab) addEventListener('scroll', () => cab.classList.toggle('compacta', scrollY > 40), { passive: true });

// Inclinación de tarjetas
if (!quieto && matchMedia('(hover:hover)').matches) {
  $$('[data-tilt]').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const q = c.getBoundingClientRect();
      c.style.setProperty('--rx', `${((e.clientY - q.top) / q.height - 0.5) * -7}deg`);
      c.style.setProperty('--ry', `${((e.clientX - q.left) / q.width - 0.5) * 7}deg`);
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
  const capas = $$('[data-par]');
  if (capas.length) addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    capas.forEach((l) => { const k = +l.dataset.par; l.style.translate = `${x * k}px ${y * k}px`; });
  }, { passive: true });
}

// Sugerencias al escribir
const SUG = JSON.parse($('#sug-datos')?.textContent ?? '[]');
$$('[data-buscador]').forEach((f) => {
  const i = $('input', f), lista = $('.sug', f);
  let activo = -1;
  const pintar = () => {
    const q = plano(i.value.trim());
    const r = q.length < 2 ? [] : SUG.filter((s) => plano(s).includes(q)).slice(0, 6);
    activo = -1;
    lista.innerHTML = r.map((s) => `<li role="option"><a href="ficha.html">${s.replace(new RegExp(`(${i.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<mark>$1</mark>')}</a></li>`).join('');
    lista.hidden = !r.length;
    i.setAttribute('aria-expanded', String(r.length > 0));
  };
  i.addEventListener('input', pintar);
  i.addEventListener('keydown', (e) => {
    const it = $$('li', lista);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); activo = (activo + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % (it.length || 1); it.forEach((l, n) => l.classList.toggle('on', n === activo)); }
    if (e.key === 'Escape') lista.hidden = true;
    if (e.key === 'Enter' && activo >= 0) { e.preventDefault(); location.href = 'ficha.html'; }
  });
  f.addEventListener('submit', (e) => { e.preventDefault(); location.href = 'ficha.html'; });
  document.addEventListener('click', (e) => { if (!f.contains(e.target)) lista.hidden = true; });
});

// Texto que cambia en la portada
const rotar = $('[data-rotar]');
if (rotar && !quieto) {
  const ps = rotar.dataset.rotar.split('|'); let n = 0;
  setInterval(() => { rotar.classList.add('sale'); setTimeout(() => { n = (n + 1) % ps.length; rotar.textContent = ps[n]; rotar.classList.remove('sale'); }, 260); }, 2400);
}

// Comprobador guiado
$$('[data-comprobador]').forEach((w) => {
  const pasos = $$('.paso', w); const barra = $('.progreso i', w);
  const ir = (n) => { pasos.forEach((p, i) => { p.hidden = i !== n; }); barra.style.width = `${((n + 1) / pasos.length) * 100}%`; };
  $$('[data-tipo]', w).forEach((b) => b.addEventListener('click', () => { $('[data-elegido]', w).textContent = b.dataset.tipo; ir(1); }));
  $('[data-comprobar]', w)?.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = plano($('input', e.target).value.trim());
    if (!v) return;
    const r = SUG.filter((s) => plano(s).includes(v)).slice(0, 3);
    const s = $('[data-salida]', w);
    s.innerHTML = r.length
      ? `<p class="res mal"><b>Hay ${r.length} ${r.length === 1 ? 'alerta' : 'alertas'} que coinciden</b></p><ul>${r.map((x) => `<li><a href="ficha.html">${x}</a></li>`).join('')}</ul>`
      : '<p class="res ok"><b>No consta ninguna alerta.</b> Esto no significa que el producto sea seguro.</p>';
    ir(2);
  });
  $('[data-reinicio]', w)?.addEventListener('click', () => ir(0));
  ir(0);
});

// ¿Es tu lote?
const lote = $('[data-lote]');
if (lote) {
  const i = $('input', lote), s = $('[data-res]', lote), bueno = plano(lote.dataset.lote);
  i.addEventListener('input', () => {
    const v = plano(i.value.trim()).replace(/\s/g, '');
    if (!v) { s.className = 'lote-res'; s.textContent = ''; return; }
    if (v === bueno) { s.className = 'lote-res mal visible'; s.innerHTML = '<b>Coincide.</b> Este lote está afectado: sigue los pasos de abajo.'; }
    else if (bueno.startsWith(v)) { s.className = 'lote-res visible'; s.textContent = 'Sigue escribiendo…'; }
    else { s.className = 'lote-res ok visible'; s.innerHTML = '<b>No coincide</b> con esta alerta. Revisa que esté bien escrito.'; }
  });
}

// Compartir
$('[data-compartir]')?.addEventListener('click', async (e) => {
  try { await navigator.clipboard.writeText(location.href); e.currentTarget.textContent = 'Enlace copiado'; } catch { /* sin portapapeles */ }
});

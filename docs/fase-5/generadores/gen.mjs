import fs from 'node:fs';
import { cinta, logos, suelto } from './escenas.mjs';

const OUT = process.argv[2];
const D = JSON.parse(fs.readFileSync('datos.json', 'utf8'));
const ic = (n) => fs.readFileSync(`node_modules/lucide-static/icons/${n}.svg`, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/class="[^"]*"/, 'aria-hidden="true"').replace(/\s+/g, ' ').trim();
const n = (x) => x.toLocaleString('es-ES');

const CATS = [['alimentos', 'Alimentos', 'apple'], ['medicamentos', 'Medicamentos', 'pill'], ['cosmeticos', 'Cosméticos', 'sparkles'], ['juguetes', 'Juguetes', 'toy-brick'], ['electricos', 'Eléctricos', 'plug'], ['infantil', 'Infantil', 'baby'], ['vehiculos', 'Vehículos', 'car'], ['moda', 'Ropa y moda', 'shirt'], ['hogar', 'Hogar', 'house']];
const cuenta = (k) => D.cuentaCat[k] ?? 0;

const MAPA = [['Galicia', 0, 0, 1], ['Asturias', 1, 0, 1], ['Cantabria', 2, 0, 1], ['País Vasco', 3, 0, 1], ['Navarra', 4, 0, 1], ['Castilla y León', 1, 1, 2], ['La Rioja', 3, 1, 1], ['Aragón', 4, 1, 1], ['Cataluña', 5, 1, 1], ['Extremadura', 1, 2, 1], ['Madrid', 2, 2, 1], ['Castilla-La Mancha', 3, 2, 1], ['Comunidad Valenciana', 4, 2, 1], ['Illes Balears', 6, 2, 1], ['Andalucía', 1, 3, 2], ['Murcia', 3, 3, 1], ['Canarias', 0, 4, 1], ['Ceuta', 2, 4, 1], ['Melilla', 3, 4, 1]];
const corto = { 'Comunidad Valenciana': 'C. Valenciana', 'Castilla-La Mancha': 'C.-La Mancha', 'Castilla y León': 'Castilla y León', 'Illes Balears': 'Baleares' };
const maxCcaa = Math.max(...Object.values(D.ccaa));
const mapa = (activas) => `<div class="mapa">${MAPA.map(([nom, x, y, w]) => {
  const v = D.ccaa[nom] ?? 0;
  const on = activas ? activas.includes(nom) : true;
  const k = activas ? (on ? 1 : 0) : v / maxCcaa;
  return `<a href="#" class="ca${on ? '' : ' off'}" style="grid-column:${x + 1}/span ${w};grid-row:${y + 1};--k:${k.toFixed(2)}" title="${nom}: ${v} alertas"><b>${corto[nom] ?? nom}</b>${activas ? '' : `<span>${v}</span>`}</a>`;
}).join('')}</div>`;

const forma = { grave: 'triangle-alert', general: 'circle-alert', alergeno: 'wheat-off', clase: 'pill', sin: 'info' };
const tarjeta = (a, i) => `<article class="tar t-${a.nivel[1]}" data-ver data-tilt><a href="ficha.html"><span class="cat c-${a.cat}">${ic(CATS.find((c) => c[0] === a.cat)?.[2] ?? 'package')}</span><span class="niv n-${a.nivel[1]}">${ic(forma[a.nivel[1]])}${a.nivel[0]}</span><h3>${a.nombre}</h3><p class="mot">${a.motivo}</p>${a.ident ? `<p class="id">${a.ident}</p>` : ''}<p class="pie-t"><span>${a.fuente}</span><span>${a.fecha}</span></p></a></article>`;

const buscador = (ph = 'Marca, producto, lote o código de barras') => `<form class="busca" data-buscador role="search"><span class="lupa">${ic('search')}</span><label class="oculto" for="q">Buscar producto</label><input id="q" type="search" placeholder="${ph}" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="sug"><button type="submit">Buscar</button><ul class="sug" id="sug" role="listbox" hidden></ul></form>`;

const ticker = () => { const t = [...D.espana, ...D.europa].map((a) => `<span>${ic('triangle-alert')}<b>${a.nombre}</b> ${a.motivo}</span>`).join(''); return `<div class="ticker" aria-hidden="true"><div>${t}${t}</div></div>`; };

const comprobador = () => `<section class="comp" data-ver id="comprobar"><div class="comp-txt"><p class="ante">Comprobador</p><h2>¿Te afecta? Lo miramos en tres pasos</h2><p>Sin registros. Dinos qué es y te decimos qué hemos encontrado.</p></div><div class="comp-caja" data-comprobador><div class="progreso"><i></i></div>
<div class="paso"><h3>¿Qué tipo de producto es?</h3><div class="tipos">${CATS.slice(0, 6).map(([, t, i]) => `<button type="button" data-tipo="${t}">${ic(i)}${t}</button>`).join('')}</div></div>
<div class="paso" hidden><h3><span data-elegido></span>: escribe la marca o el lote</h3><form data-comprobar class="linea"><label class="oculto" for="cq">Marca o lote</label><input id="cq" placeholder="Por ejemplo: Urkabe"><button type="submit">Comprobar</button></form></div>
<div class="paso" hidden><h3>Resultado</h3><div data-salida></div><button type="button" class="otro" data-reinicio>Comprobar otro</button></div></div></section>`;

const categorias = (ilus) => `<section class="cats"><div class="tit" data-ver><p class="ante">Explora</p><h2>Por tipo de producto</h2></div><div class="rej-cat">${CATS.map(([k, t, i], x) => `<a href="#" class="cat-t c-${k}" data-ver data-tilt><span class="cat-i">${ilus[x % ilus.length]}</span><b>${t}</b><small>${n(cuenta(k))} alertas</small></a>`).join('')}</div></section>`;

const seccionMapa = () => `<section class="sec-mapa"><div class="tit" data-ver><p class="ante">Dónde</p><h2>Alertas alimentarias por comunidad</h2><p>Según la distribución que publica AESAN desde 2025. Pulsa tu comunidad.</p></div><div data-ver>${mapa()}</div></section>`;

const avisos = () => `<section class="avisos" data-ver><div><p class="ante">Avisos</p><h2>Entérate antes de hacer la compra</h2><p>Por Telegram, en tu correo o por RSS. Y si tienes alergias, solo las tuyas.</p></div><div class="av-b"><a href="#">${ic('send')}Telegram</a><a href="#">${ic('mail')}Newsletter</a><a href="#">${ic('rss')}RSS</a></div></section>`;

const pie = () => `<footer class="pie"><div><p class="pie-m">Productos Retirados</p><p>Web independiente. No es un organismo oficial: comprueba siempre la fuente. Que un producto no aparezca no significa que sea seguro.</p></div><nav aria-label="Pie"><a href="#">Fuentes</a><a href="#">Guías</a><a href="#">Apoya</a><a href="#">Aviso legal</a><a href="#">Privacidad</a></nav></footer>`;

const tabbar = () => `<nav class="tabbar" aria-label="Navegación móvil"><a href="home.html" class="on">${ic('house')}Inicio</a><a href="#">${ic('search')}Buscar</a><a href="#comprobar">${ic('circle-check-big')}Comprobar</a><a href="#">${ic('bell')}Avisos</a></nav>`;

const logo = (svg, cl = '') => `<a class="logo ${cl}" href="home.html" aria-label="Productos Retirados, inicio">${svg}<span>Productos<br><i>Retirados</i></span></a>`;

const doc = (titulo, estilo, cuerpo) => `<!doctype html><html lang="es-ES"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title><link rel="stylesheet" href="../comun.css"><link rel="stylesheet" href="estilos.css"></head><body>${cuerpo}<script type="application/json" id="sug-datos">${JSON.stringify(D.sugerencias)}</script><script src="../app.js" defer></script></body></html>\n`;

const F = D.ficha;
const ficha = (cab, extraHero = '') => {
  const lote = F.p.lotes[0];
  return `${cab}<main class="f"><section class="f-hero"><div class="f-in"><p class="migas"><a href="home.html">Inicio</a> / <a href="#">Alimentos</a></p><p class="f-niv">${ic('circle-alert')}Alerta general · AESAN</p><h1>${F.nombre}</h1><p class="f-mot">${F.motivo}</p></div>${extraHero}</section>
<div class="f-rej"><div class="f-col">
<section class="lote" data-lote="${lote.numero}" data-ver><h2>${ic('scan-barcode')}¿Es tu lote?</h2><p>Escribe el lote que aparece en tu envase.</p><label class="oculto" for="l">Número de lote</label><input id="l" inputmode="text" placeholder="Por ejemplo: ${lote.numero}" autocomplete="off"><p class="lote-res" data-res role="status"></p></section>
<section class="hacer" data-ver><h2>Qué hacer</h2><ol>${F.hacer.map((h) => `<li>${h}</li>`).join('')}</ol><small>Resumen del texto oficial. Lee siempre la fuente.</small></section>
<section class="dist" data-ver><h2>Dónde se ha distribuido</h2>${mapa(F.ccaa)}<p>${F.literal}</p></section>
</div><aside class="f-lat" data-ver><div class="datos"><h2>Datos del producto</h2><dl><dt>Marca</dt><dd>${F.p.marcas[0]}</dd><dt>Lote</dt><dd class="d-lote">${lote.numero}</dd><dt>Caducidad</dt><dd>${lote.caducidad.split('-').reverse().join('/')}</dd><dt>Peso</dt><dd>${F.p.peso}</dd><dt>Envase</dt><dd>${F.p.envase}</dd><dt>Conservación</dt><dd>${F.p.temperatura}</dd></dl></div>
<a class="b-fuente" href="${F.url}">${ic('external-link')}Ver fuente oficial</a><div class="comparte"><a href="#">${ic('message-circle')}WhatsApp</a><button type="button" data-compartir>${ic('link')}Copiar enlace</button></div><p class="ref">AESAN · ${F.ref} · Publicada ${F.fecha}</p></aside></div></main>${pie()}${tabbar()}`;
};

// ===================== A. VITRINA =====================
const pA = { a: ['#ffd25e', '#ffbe2e', '#e39a00'], b: ['#5de4cc', '#19c3a6', '#0d8f7a'], c: ['#8cb6ff', '#4c82f7', '#2c5bd0'], d: ['#3f4d6b', '#26324d', '#16213a'], alertaR: ['#ff8a70', '#ff5a3c', '#d33a1e'], papel: '#fffdf8', papelD: '#e9e3d6', tinta: '#16213a', alerta: '#ff3b1f', cintaC: '#26324d', cintaR: '#3f4d6b', haz: 'rgba(255,190,46,.42)', pantalla: '#5de4cc' };
const cabA = `<header class="cab"><div class="cab-in">${logo(logos.cesta('#16213a', '#ffbe2e', '#ff3b1f', '#fff'))}<nav aria-label="Principal"><a href="#" class="act">Alertas</a><a href="#">Alimentos</a><a href="#">Medicamentos</a><a href="#">Alérgenos</a><a href="#">Avisos</a></nav><a class="cta" href="#comprobar">${ic('circle-check-big')}Comprobar</a></div></header>`;
const homeA = `${cabA}<main><section class="hero"><div class="panel"><div class="hero-t"><p class="chip"><i></i>${n(D.semana)} alertas nuevas esta semana</p><h1>¿Está <em data-rotar="retirado?|en alerta?|caducado?">retirado?</em></h1><p class="ent">Alimentos, medicamentos, cosméticos y juguetes. Todas las alertas oficiales de España, en un solo buscador.</p>${buscador()}<ul class="rap"><li><a href="#">Listeria</a></li><li><a href="#">Salmonella</a></li><li><a href="#">Gluten</a></li><li><a href="#">Juguetes</a></li></ul></div><div class="hero-e">${cinta(pA)}</div></div></section>${ticker()}
<section class="cifras" data-ver><div><b data-cuenta="${D.total}">0</b><span>alertas en el buscador</span></div><div><b data-cuenta="${D.semanaEspana}">0</b><span>nuevas en España esta semana</span></div><div><b data-cuenta="4">0</b><span>fuentes oficiales</span></div></section>
<section class="ult"><div class="tit" data-ver><p class="ante">En España</p><h2>Últimas alertas</h2></div><div class="rej">${D.espana.slice(0, 6).map(tarjeta).join('')}</div></section>
${categorias(['brik:a', 'frasco:c', 'frasco:a', 'juguete:a', 'caja:c', 'lata:b', 'caja:a', 'caja:b', 'lata:c'].map((s) => { const [t, c] = s.split(':'); return suelto(t, pA, c); }))}${comprobador()}${seccionMapa()}${avisos()}</main>${pie()}${tabbar()}`;

for (const [d, nombre, home, cab, extra] of [
  ['a-vitrina', 'Vitrina', homeA, cabA, `<div class="f-ilus">${suelto('caja', pA, 'alertaR')}</div>`],
]) {
  fs.mkdirSync(`${OUT}/${d}`, { recursive: true });
  fs.writeFileSync(`${OUT}/${d}/home.html`, doc(`Productos Retirados · ${nombre}`, d, home));
  fs.writeFileSync(`${OUT}/${d}/ficha.html`, doc(`${F.nombre} · ${nombre}`, d, ficha(cab, extra)));
}
const L = { cesta: logos.cesta('#16213a', '#ffbe2e', '#ff3b1f', '#fff') };
fs.writeFileSync(`${OUT}/logos.json`, JSON.stringify(L));
console.log('generado');


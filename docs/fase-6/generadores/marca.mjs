// Logotipo, favicons, iconos e imagen para redes. Necesita sharp, opentype.js y @fontsource/figtree.
// Uso: node marca.mjs <public> <src/ilustraciones/cinta.svg>
import fs from 'node:fs';
import opentype from 'opentype.js';
import sharp from 'sharp';

const [PUB, CINTA] = process.argv.slice(2);
const MARCA = `${PUB}/marca`;
fs.mkdirSync(MARCA, { recursive: true });
const T = { tinta: '#1d2533', fondo: '#f7f6f2', sol: '#e4b45f', sombra: '#bd8a3c', coral: '#c8402a', crema: '#f3ede1', blanco: '#fff' };
const r = (n) => Math.round(n * 100) / 100;
const carga = (f) => { const b = fs.readFileSync(f); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const f7 = carga('node_modules/@fontsource/figtree/files/figtree-latin-700-normal.woff');
const f8 = carga('node_modules/@fontsource/figtree/files/figtree-latin-800-normal.woff');
function componer(font, t, size, x = 0, y = 0, track = 0) {
  const sc = size / font.unitsPerEm; const path = new opentype.Path(); let cx = x; let prev = null;
  for (const ch of t) { const g = font.charToGlyph(ch); if (prev) cx += font.getKerningValue(prev, g) * sc + track; path.extend(g.getPath(cx, y, size)); cx += g.advanceWidth * sc; prev = g; }
  return path;
}
function aD(cmds) {
  const n = (v) => String(r(v)); let d = ''; let o = false;
  for (const c of cmds) {
    if (c.type === 'M') { if (o) d += 'Z'; d += `M${n(c.x)} ${n(c.y)}`; o = true; }
    else if (c.type === 'L') d += `L${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Q') d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'C') d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Z') { d += 'Z'; o = false; }
  }
  return o ? `${d}Z` : d;
}
const txt = (font, t, size, x, y, track = 0) => { const p = componer(font, t, size, x, y, track); const b = p.getBoundingBox(); return { d: aD(p.commands), ...b }; };
const svg = (w, h, inner, o = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Productos Retirados">${o.bg ? `<rect width="${w}" height="${h}" fill="${o.bg}"/>` : ''}${inner}</svg>\n`;

// Cesta en rejilla de 64: ranuras altas, relieve y luz cenital. Se lee bien desde 32 px.
const CUERPO = 'M9.5 33h45l-4.4 21.9A5.6 5.6 0 0 1 44.6 59.5H19.4a5.6 5.6 0 0 1-5.5-4.6z';
function cesta(p = 'c', aro = T.blanco) {
  const ranuras = [18.4, 26.3, 34.2, 42.1].map((x) => {
    const ancho = 3.5; const y = 39; const alto = 14.2;
    return `<rect x="${x}" y="${y}" width="${ancho}" height="${alto}" rx="1.75" fill="url(#${p}r)"/><path d="M${x + 0.5} ${y + alto + 0.45}h${ancho - 1}" stroke="#fff" stroke-opacity=".5" stroke-width=".7" stroke-linecap="round"/>`;
  }).join('');
  return `<defs>
<linearGradient id="${p}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d58f"/><stop offset=".55" stop-color="#e4b45f"/><stop offset="1" stop-color="#bd8a3c"/></linearGradient>
<linearGradient id="${p}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#6b4312" stop-opacity="0"/><stop offset="1" stop-color="#6b4312" stop-opacity=".34"/></linearGradient>
<linearGradient id="${p}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2e08" stop-opacity=".42"/><stop offset="1" stop-color="#4a2e08" stop-opacity="0"/></linearGradient>
<linearGradient id="${p}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55637f"/><stop offset=".5" stop-color="#2e3a52"/><stop offset="1" stop-color="#1b2332"/></linearGradient>
<linearGradient id="${p}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2332"/><stop offset="1" stop-color="#4a3413"/></linearGradient>
<radialGradient id="${p}a" cx=".35" cy=".28" r=".9"><stop offset="0" stop-color="#ee8f77"/><stop offset=".5" stop-color="#d0523a"/><stop offset="1" stop-color="#9c2f1e"/></radialGradient>
<clipPath id="${p}k"><path d="${CUERPO}"/></clipPath></defs>
<path d="M18.5 26C19.5 19 23 13 27.8 9.4M45.5 26C44.6 21.5 43 17.6 40.8 14.2" stroke="url(#${p}b)" stroke-width="4.6" stroke-linecap="round" fill="none"/>
<path d="M17.9 22.8C19.3 17.6 22.2 12.6 26.2 9.4" stroke="#fff" stroke-opacity=".38" stroke-width="1" stroke-linecap="round" fill="none"/>
<path d="${CUERPO}" fill="url(#${p}c)"/>
<g clip-path="url(#${p}k)">${ranuras}<rect x="8" y="33" width="48" height="27" fill="url(#${p}l)"/><rect x="8" y="33" width="48" height="5.5" fill="url(#${p}s)"/><path d="M12 58.8h40" stroke="#6b4312" stroke-opacity=".35" stroke-width="1.4"/></g>
<rect x="5" y="24" width="54" height="9.6" rx="4.8" fill="url(#${p}b)"/><rect x="8.5" y="25.4" width="47" height="1.5" rx=".75" fill="#fff" opacity=".34"/>
<circle cx="49.5" cy="15" r="14" fill="${aro}"/><circle cx="49.5" cy="15" r="11.8" fill="url(#${p}a)"/>
<path d="M40.6 12.2a9.6 9.6 0 0 1 6.6-6.4" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round" fill="none"/>
<rect x="47.5" y="7.8" width="4" height="9.6" rx="2" fill="#fff"/><circle cx="49.5" cy="21" r="2.3" fill="#fff"/>`;
}

// Versión para pestañas: formas gruesas y suavizadas, sin fondo. Azul claro para verse también en temas oscuros.
const BORDE = '#5f6e8c';
const mini = (p = 'm') => `<defs><linearGradient id="${p}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efc878"/><stop offset="1" stop-color="#cf9c4a"/></linearGradient></defs>
<path d="M17 30C17.5 20 22 12.5 30 8" stroke="${BORDE}" stroke-width="6.5" stroke-linecap="round" fill="none"/>
<path d="M8.5 34h47l-4.6 22a6 6 0 0 1-5.9 4.8H19a6 6 0 0 1-5.9-4.8z" fill="url(#${p}c)"/>
<rect x="19" y="40" width="5.6" height="14" rx="2.8" fill="#6b4a1c"/><rect x="29.2" y="40" width="5.6" height="14" rx="2.8" fill="#6b4a1c"/><rect x="39.4" y="40" width="5.6" height="14" rx="2.8" fill="#6b4a1c"/>
<rect x="3" y="25" width="58" height="11" rx="5.5" fill="${BORDE}"/>
<circle cx="48" cy="15.5" r="14.5" fill="${T.coral}"/><rect x="45.4" y="6.5" width="5.2" height="11.5" rx="2.6" fill="#fff"/><circle cx="48" cy="22.6" r="3" fill="#fff"/>`;

const w = (f, s) => fs.writeFileSync(`${MARCA}/${f}`, s);
const lock = (color, acento, p, aro) => {
  const a = txt(f8, 'Productos', 34, 0, 0, -0.4); const b = txt(f8, 'Retirados', 34, 0, 36, -0.4);
  const iso = 72; const gap = 14; const ty = (iso - (b.y2 - a.y1)) / 2 - a.y1;
  const W = Math.ceil(iso + gap + Math.max(a.x2, b.x2));
  return { w: W, h: iso, inner: `<g transform="scale(${iso / 64})">${cesta(p, aro)}</g><g transform="translate(${iso + gap} ${r(ty)})"><path d="${a.d}" fill="${color}"/><path d="${b.d}" fill="${acento}"/></g>` };
};
w('isotipo.svg', svg(64, 64, cesta()));
const h = lock(T.tinta, T.coral, 'a', T.blanco); w('logo.svg', svg(h.w, h.h, h.inner));
const o = lock(T.fondo, '#f0b6a6', 'o', T.tinta); w('logo-oscuro.svg', svg(o.w, o.h, o.inner));
for (const k of [1, 2, 4]) await sharp(Buffer.from(svg(h.w, h.h, h.inner)), { density: 72 * k * 3 }).resize(h.w * k, h.h * k, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${MARCA}/logo@${k}x.png`);

fs.writeFileSync(`${PUB}/favicon.svg`, svg(64, 64, mini()));
const png = async (s) => sharp(Buffer.from(svg(64, 64, mini())), { density: Math.ceil(72 * (s / 64) * 8) }).resize(s, s, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
const ps = { 16: await png(16), 32: await png(32), 48: await png(48) };
const lista = [[16, ps[16]], [32, ps[32]], [48, ps[48]]];
const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(3, 4);
const dir = Buffer.alloc(48); let off = 54;
lista.forEach(([s, b], i) => { const q = i * 16; dir[q] = s; dir[q + 1] = s; dir.writeUInt16LE(1, q + 4); dir.writeUInt16LE(32, q + 6); dir.writeUInt32LE(b.length, q + 8); dir.writeUInt32LE(off, q + 12); off += b.length; });
fs.writeFileSync(`${PUB}/favicon.ico`, Buffer.concat([head, dir, ...lista.map((x) => x[1])]));
const icono = (zona) => { const m = (64 - 64 * zona) / 2; return svg(64, 64, `<g transform="translate(${m} ${m}) scale(${zona})">${cesta('i')}</g>`, { bg: T.fondo }); };
for (const [f, s, z] of [['apple-touch-icon.png', 180, 0.84], ['icon-192.png', 192, 0.9], ['icon-512.png', 512, 0.9], ['icon-maskable-512.png', 512, 0.66]]) await sharp(Buffer.from(icono(z)), { density: 72 * (s / 64) * 3 }).resize(s, s, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${PUB}/${f}`);
fs.writeFileSync(`${PUB}/site.webmanifest`, `${JSON.stringify({ name: 'Productos Retirados', short_name: 'P. Retirados', description: 'Comprueba si un producto está retirado en España.', lang: 'es-ES', start_url: './', display: 'standalone', background_color: T.fondo, theme_color: T.fondo, icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] }, null, 2)}\n`);

// Imagen para redes: fondo claro, titular y cinta detenida.
const escena = fs.readFileSync(CINTA, 'utf8');
const dx = +escena.match(/--dx:([\d.]+)px/)[1]; const dy = +escena.match(/--dy:([\d.]+)px/)[1];
const fija = escena.replace(/<g class="item" style="--i:(\d)">/g, (_, i) => `<g transform="translate(${r(dx * (+i + 0.5) / 6)} ${r(dy * (+i + 0.5) / 6)})">`).replace(/class="[^"]*"/g, '').replace(/style="[^"]*"/g, '').replace(' aria-hidden="true"', '').replace(/<svg /, '<svg x="556" y="86" width="600" height="489" ');
const t1 = txt(f8, '¿Está', 96, 64, 300, -2); const t2 = txt(f8, 'retirado?', 96, 64, 400, -2);
const dom = txt(f7, 'Alertas oficiales de España', 30, 66, 468); const dom2 = txt(f7, 'en un solo buscador', 30, 66, 508);
const lk = lock(T.tinta, T.coral, 'g', T.blanco);
const og = `<rect width="1200" height="630" fill="${T.fondo}"/><rect x="24" y="24" width="1152" height="582" rx="28" fill="${T.crema}"/><g transform="translate(64 60)">${lk.inner}</g><path d="${t1.d}" fill="${T.tinta}"/><path d="${t2.d}" fill="${T.coral}"/><path d="${dom.d}${dom2.d}" fill="#5a6372"/>${fija}`;
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">${og}</svg>`), { density: 216 }).resize(1200, 630, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${PUB}/og.png`);
console.log('marca OK', h.w, h.h);

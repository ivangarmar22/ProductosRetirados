// Cinta de la portada: escena isométrica vectorial. Sin filtros, que se recalcularían en cada fotograma.
// Uso: node cinta.mjs <src/ilustraciones/cinta.svg>
import fs from 'node:fs';
import { Iso } from '../../fase-5/generadores/escenas.mjs';

const C = Math.cos(Math.PI / 6);
const r = (n) => Math.round(n * 10) / 10;
const aRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const aHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mezcla = (h, con, k) => aHex(aRgb(h).map((v, i) => v + (con[i] - v) * k));
const claro = (h, k) => mezcla(h, [255, 255, 255], k);
const oscuro = (h, k) => mezcla(h, [20, 24, 36], k);

const ACERO = ['#f1f3f6', '#c9cfd8', '#98a1ae'];
const CARCASA = ['#f4f5f8', '#d9dee6', '#aab3c0'];
const GRAFITO = ['#4a5568', '#333c4d', '#232a38'];
const PAPEL = '#fbf8f1';
const TINTA = '#2a3242';
const CORAL = ['#e58a74', '#cf5a42', '#a83f2b'];
const SALVIA = ['#b6cfc0', '#7ea893', '#5c8872'];
const PIZARRA = ['#b4c3d8', '#7f97b8', '#5d7699'];
const MIEL = ['#f0d398', '#dcae5e', '#b98a3e'];
const ARENA = ['#efe6d6', '#ddd0ba', '#bfae93'];

const defs = new Map();
const lineal = (id, paradas, x2 = 1, y2 = 1) => { defs.set(id, `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${paradas.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`); return `url(#${id})`; };
const cara = (c) => lineal(`f${c.slice(1)}`, [[0, claro(c, 0.14)], [0.6, c], [1, oscuro(c, 0.14)]]);
const tubo = (c) => lineal(`t${c.slice(1)}`, [[0, oscuro(c, 0.16)], [0.28, claro(c, 0.34)], [0.62, c], [1, oscuro(c, 0.3)]], 1, 0);

class Lienzo extends Iso {
  caja(x, y, z, w, d, h, c, brillo = 0.5) {
    const p = this.P.bind(this);
    this.poly([p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)], cara(c[1]));
    this.poly([p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)], cara(c[2]));
    this.poly([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)], cara(c[0]));
    const a = p(x, y + d, z + h); const b = p(x + w, y + d, z + h); const e = p(x + w, y, z + h); const f = p(x + w, y + d, z);
    this.raw(`<path d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}L${r(e[0])} ${r(e[1])}M${r(b[0])} ${r(b[1])}L${r(f[0])} ${r(f[1])}" fill="none" stroke="#fff" stroke-opacity="${brillo}" stroke-width=".9" stroke-linejoin="round"/>`);
    return this;
  }
  rodillo(x, y, z, rad, h, c, tapa = c[0]) {
    const [cx, cy] = this.P(x, y, z); const [, ty] = this.P(x, y, z + h); const rx = 1.2247 * rad * this.u; const ry = 0.7071 * rad * this.u;
    this.raw(`<path d="M${r(cx - rx)} ${r(ty)}V${r(cy)}A${r(rx)} ${r(ry)} 0 0 0 ${r(cx + rx)} ${r(cy)}V${r(ty)}Z" fill="${tubo(c[1])}"/>`);
    this.raw(`<ellipse cx="${r(cx)}" cy="${r(ty)}" rx="${r(rx)}" ry="${r(ry)}" fill="${cara(tapa)}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>`);
    return this;
  }
  aro(x, y, rad, z0, z1, fill) {
    const [cx, y0] = this.P(x, y, z0); const [, y1] = this.P(x, y, z1); const rx = 1.2247 * rad * this.u; const ry = 0.7071 * rad * this.u;
    this.raw(`<path d="M${r(cx - rx)} ${r(y1)}A${r(rx)} ${r(ry)} 0 0 0 ${r(cx + rx)} ${r(y1)}V${r(y0)}A${r(rx)} ${r(ry)} 0 0 1 ${r(cx - rx)} ${r(y0)}Z" fill="${fill}"/>`);
    return this;
  }
  sombra(x, y, z, rx, ry) {
    const [cx, cy] = this.P(x, y, z);
    this.raw(`<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${rx}" ry="${ry}" fill="#0d1220" fill-opacity=".38"/>`);
    return this;
  }
}

const U = 13; const OX = 300; const OY = 150;
const nuevo = () => new Lienzo({ u: U, ox: OX, oy: OY });
const X0 = -8; const LARGO = 40; const Y0 = 2; const ANCHO = 9; const Z = 5;
const AX = 13;

/** Etiqueta con dos líneas de texto simuladas y un sello de color. */
function etiqueta(g, f, u, v, w, h, acento) {
  g.rect(f, u, v, w, h, PAPEL);
  g.rect(f, u + w * 0.12, v + h * 0.18, w * 0.5, h * 0.14, TINTA);
  g.rect(f, u + w * 0.12, v + h * 0.42, w * 0.76, h * 0.07, '#9aa3b2');
  g.rect(f, u + w * 0.12, v + h * 0.56, w * 0.6, h * 0.07, '#9aa3b2');
  g.rect(f, u + w * 0.12, v + h * 0.74, w * 0.3, h * 0.12, acento);
}

const PRODUCTOS = {
  // Caja de cereales.
  caja(g, x, y) {
    const w = 3.8; const d = 1.9; const h = 6.4;
    g.sombra(x + w / 2, y + d / 2 + 0.5, Z, 34, 14);
    g.caja(x, y, Z, w, d, h, SALVIA);
    const f = g.L(x, y, Z, w, d, h);
    g.rect(f, 0, 0, w, 1.1, SALVIA[2]);
    etiqueta(g, f, 0.45, 1.5, 2.9, 3.6, CORAL[1]);
  },
  // Brik con cierre a dos aguas.
  brik(g, x, y) {
    const w = 3; const d = 3; const h = 5.8; const p = g.P.bind(g);
    g.sombra(x + w / 2, y + d / 2 + 0.3, Z, 30, 15);
    g.caja(x, y, Z, w, d, h, PIZARRA);
    g.poly([p(x, y + d, Z + h), p(x + w, y + d, Z + h), p(x + w, y + d / 2, Z + h + 1.3), p(x, y + d / 2, Z + h + 1.3)], cara(PIZARRA[0]));
    g.poly([p(x + w, y, Z + h), p(x + w, y + d, Z + h), p(x + w, y + d / 2, Z + h + 1.3)], cara(PIZARRA[2]));
    g.poly([p(x, y + d / 2 + 0.16, Z + h + 1.3), p(x + w, y + d / 2 + 0.16, Z + h + 1.3), p(x + w, y + d / 2 + 0.16, Z + h + 1.9), p(x, y + d / 2 + 0.16, Z + h + 1.9)], PAPEL);
    const f = g.L(x, y, Z, w, d, h);
    etiqueta(g, f, 0.35, 1.1, 2.3, 3.4, PIZARRA[2]);
  },
  // Lata con etiqueta.
  lata(g, x, y) {
    const c = [x + 1.7, y + 1.7]; const rad = 1.7;
    g.sombra(c[0], c[1] + 0.3, Z, 27, 14);
    g.rodillo(...c, Z, rad, 4, ACERO, '#dfe3e9');
    g.aro(...c, rad, Z + 0.5, Z + 3.5, tubo(ARENA[0]));
    g.aro(...c, rad, Z + 1.3, Z + 2.5, tubo(MIEL[1]));
  },
  // Producto señalado por el escáner.
  alerta(g, x, y) {
    const w = 4; const d = 3; const h = 3.8;
    g.sombra(x + w / 2, y + d / 2 + 0.4, Z, 38, 17);
    g.caja(x, y, Z, w, d, h, CORAL);
    const t = g.T(x, y, Z, w, d, h);
    g.rect(t, 0, d / 2 - 0.25, w, 0.5, MIEL[0]);
    const f = g.L(x, y, Z, w, d, h);
    etiqueta(g, f, 0.5, 0.7, 3, 2.4, CORAL[2]);
  },
  // Frasco con dosificador.
  frasco(g, x, y) {
    const c = [x + 1.5, y + 1.5]; const rad = 1.5;
    g.sombra(c[0], c[1] + 0.3, Z, 24, 12);
    g.rodillo(...c, Z, rad, 4.6, SALVIA, SALVIA[0]);
    g.aro(...c, rad, Z + 1.1, Z + 3.3, tubo(PAPEL));
    g.aro(...c, rad, Z + 1.9, Z + 2.2, tubo(SALVIA[2]));
    g.rodillo(...c, Z + 4.6, 0.75, 0.9, GRAFITO, GRAFITO[0]);
    g.rodillo(...c, Z + 5.5, 1.05, 0.9, GRAFITO, GRAFITO[0]);
  },
  // Tarro con tapa.
  tarro(g, x, y) {
    const c = [x + 1.7, y + 1.7]; const rad = 1.7;
    g.sombra(c[0], c[1] + 0.3, Z, 27, 14);
    g.rodillo(...c, Z, rad, 3.6, MIEL, MIEL[0]);
    g.aro(...c, rad, Z + 0.8, Z + 2.8, tubo(PAPEL));
    g.aro(...c, rad, Z + 1.5, Z + 1.8, tubo(CORAL[1]));
    g.rodillo(...c, Z + 3.6, 1.8, 1, GRAFITO, GRAFITO[0]);
  },
};

const pin = (x, y) => `<g class="bandera"><g transform="translate(${r(x)} ${r(y)})"><path d="M0 24C-3 17-15 10-15 -3A15 15 0 1 1 15 -3C15 10 3 17 0 24Z" fill="${CORAL[1]}" stroke="#fff" stroke-width="2.4"/><rect x="-2.2" y="-11.5" width="4.4" height="11.5" rx="2.2" fill="#fff"/><circle cy="5" r="2.5" fill="#fff"/></g></g>`;

// Sombra de suelo, alargada en la dirección de la cinta.
const suelo = (() => {
  const g = nuevo(); const [cx, cy] = g.P(X0 + LARGO / 2, Y0 + ANCHO / 2, 0);
  defs.set('suelo', '<radialGradient id="suelo"><stop offset="0" stop-color="#1d2533" stop-opacity=".26"/><stop offset=".6" stop-color="#1d2533" stop-opacity=".12"/><stop offset="1" stop-color="#1d2533" stop-opacity="0"/></radialGradient>');
  return `<ellipse cx="${r(cx)}" cy="${r(cy + 16)}" rx="306" ry="74" fill="url(#suelo)" transform="rotate(30 ${r(cx)} ${r(cy + 16)})"/>`;
})();

// Parte trasera: patas, carril del fondo, cinta y columna trasera del escáner.
const atras = nuevo();
for (const px of [X0 + 3, X0 + LARGO - 5]) {
  atras.caja(px, Y0 + 0.5, 0, 1, 1, Z - 1.4, ACERO, 0.35);
  atras.caja(px, Y0 + ANCHO - 1.5, 0, 1, 1, Z - 1.4, ACERO, 0.35);
  atras.caja(px + 0.2, Y0 + 1.5, 1.4, 0.6, ANCHO - 3, 0.5, ACERO, 0.3);
  atras.caja(px - 0.25, Y0 + ANCHO - 1.75, 0, 1.5, 1.5, 0.35, GRAFITO, 0.2);
}
atras.caja(X0, Y0, Z - 1.5, LARGO, ANCHO, 1.5, GRAFITO, 0.2);
atras.caja(X0 - 0.2, Y0 - 0.6, Z - 0.9, LARGO + 0.4, 0.6, 1.4, ACERO, 0.6);
const top = atras.T(X0, Y0, Z, LARGO, ANCHO, 0);
const banda = [top(0, 0), top(LARGO, 0), top(LARGO, ANCHO), top(0, ANCHO)];
atras.poly(banda, lineal('banda', [[0, '#3a4456'], [0.5, '#2a3241'], [1, '#222936']], 1, 0.6));
defs.set('corte', `<clipPath id="corte"><polygon points="${banda.map((q) => q.map(r).join(',')).join(' ')}"/></clipPath>`);
const lamas = [];
for (let i = -1; i < LARGO / 2 + 1; i++) { const a = top(i * 2, 0.3); const b = top(i * 2, ANCHO - 0.3); lamas.push(`M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`); }
atras.raw(`<g clip-path="url(#corte)"><path class="rayas" d="${lamas.join('')}" stroke="#4d586c" stroke-width="1.6" fill="none"/></g>`);
atras.caja(AX, Y0 - 1.5, 0, 2.6, 1.1, 16, CARCASA, 0.8);

// Productos que viajan por la cinta.
const dist = 36; const dx = r(dist * C * U); const dy = r(dist * 0.5 * U);
const items = ['caja', 'brik', 'lata', 'alerta', 'frasco', 'tarro'].map((tipo, i) => {
  const g = nuevo(); const x = X0 + 0.3; const y = Y0 + 3;
  PRODUCTOS[tipo](g, x, y);
  const [fx, fy] = g.P(x + 2, y + 1.5, Z + 3.8);
  return `<g class="item" style="--i:${i}">${g}${tipo === 'alerta' ? pin(fx, fy - 30) : ''}</g>`;
}).join('');

// Parte delantera: haz, carril frontal, columna y dintel con pantalla.
const f = nuevo(); const p = f.P.bind(f);
const hx = AX + 1.3;
const luz = lineal('luz', [[0, '#bfe9df', 0.75], [0.7, '#bfe9df', 0.16], [1, '#bfe9df', 0]], 0, 1);
f.poly([p(hx, Y0, 16), p(hx, Y0 + ANCHO, 16), p(hx, Y0 + ANCHO, Z), p(hx, Y0, Z)], luz, 'class="haz"');
const a = p(hx, Y0 + 0.2, Z); const b = p(hx, Y0 + ANCHO - 0.2, Z);
f.raw(`<path class="haz" d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}" stroke="#a7f0dd" stroke-width="2" stroke-linecap="round"/>`);
f.caja(X0 - 0.2, Y0 + ANCHO, Z - 1.5, LARGO + 0.4, 0.6, 2, ACERO, 0.7);
const carril = f.L(X0 - 0.2, Y0 + ANCHO, Z - 1.5, LARGO + 0.4, 0.6, 2);
for (let i = 2; i < LARGO; i += 6) f.circleOn?.(carril, i, 1, 0.14, '#8c95a3');
f.rect(carril, 0, 1.45, LARGO + 0.4, 0.1, '#ffffff');
f.caja(AX, Y0 + ANCHO + 0.4, 0, 2.6, 1.1, 16, CARCASA, 0.8);
f.caja(AX - 0.3, Y0 - 1.8, 16, 3.2, ANCHO + 3.6, 2.6, CARCASA, 0.9);
const dintel = f.R(AX - 0.3, Y0 - 1.8, 16, 3.2, ANCHO + 3.6, 2.6);
f.rect(dintel, 1, 0.5, ANCHO + 1.6, 1.6, '#1f2734');
f.rect(dintel, 1.5, 0.95, 3.4, 0.2, '#a7f0dd');
f.rect(dintel, 1.5, 1.35, 2.2, 0.2, '#6d7a8f');
f.rect(dintel, 6, 0.9, 0.9, 0.8, CORAL[1]);
f.rect(dintel, 7.3, 0.9, 0.9, 0.8, '#a7f0dd');

const escena = `<svg class="escena" viewBox="70 -26 584 476" aria-hidden="true" style="--dx:${dx}px;--dy:${dy}px"><defs>${[...defs.values()].join('')}</defs>${suelo}${atras}<g>${items}</g>${f}</svg>`;
fs.writeFileSync(process.argv[2], escena);

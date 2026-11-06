// Escenas isométricas animables. Proyección real a 30°, todo vectorial.
const C = Math.cos(Math.PI / 6);
const r = (n) => Math.round(n * 10) / 10;

export class Iso {
  constructor({ u = 14, ox = 0, oy = 0 } = {}) { Object.assign(this, { u, ox, oy }); this.o = []; }
  P(x, y, z = 0) { return [this.ox + (x - y) * C * this.u, this.oy + (x + y) * 0.5 * this.u - z * this.u]; }
  raw(s) { this.o.push(s); return this; }
  poly(pts, fill, extra = '') { this.o.push(`<polygon points="${pts.map((p) => `${r(p[0])},${r(p[1])}`).join(' ')}" fill="${fill}" ${extra}/>`); return this; }
  // Caja con arista de luz: da volumen sin usar sombras difusas.
  box(x, y, z, w, d, h, c) {
    const p = this.P.bind(this);
    this.poly([p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)], c[1]);
    this.poly([p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)], c[2]);
    this.poly([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)], c[0]);
    const a = p(x, y + d, z + h), b = p(x + w, y + d, z + h), e = p(x + w, y, z + h);
    this.o.push(`<path d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}L${r(e[0])} ${r(e[1])}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.2" stroke-linejoin="round"/>`);
    return this;
  }
  L(x, y, z, w, d, h) { return (u, v) => this.P(x + u, y + d, z + h - v); }
  R(x, y, z, w, d, h) { return (u, v) => this.P(x + w, y + d - u, z + h - v); }
  T(x, y, z, w, d, h) { return (u, v) => this.P(x + u, y + v, z + h); }
  rect(f, u, v, w, h, fill) { return this.poly([f(u, v), f(u + w, v), f(u + w, v + h), f(u, v + h)], fill); }
  barras(f, u, v, w, h, color, pat = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 2]) {
    const t = pat.reduce((a, b) => a + b, 0); let pos = 0;
    pat.forEach((n, i) => { const bw = (n / t) * w; if (i % 2 === 0) this.rect(f, u + pos, v, bw, h, color); pos += bw; });
    return this;
  }
  cil(x, y, z, rad, h, c) {
    const [cx, cy] = this.P(x, y, z); const [, ty] = this.P(x, y, z + h); const rx = 1.2247 * rad * this.u; const ry = 0.7071 * rad * this.u;
    this.o.push(`<path d="M${r(cx - rx)} ${r(ty)}V${r(cy)}A${r(rx)} ${r(ry)} 0 0 0 ${r(cx + rx)} ${r(cy)}V${r(ty)}Z" fill="${c[1]}"/>`);
    this.o.push(`<path d="M${r(cx + rx * 0.25)} ${r(ty + ry * 0.97)}V${r(cy + ry * 0.97)}A${r(rx)} ${r(ry)} 0 0 0 ${r(cx + rx)} ${r(cy)}V${r(ty)}Z" fill="${c[2]}"/>`);
    this.o.push(`<ellipse cx="${r(cx)}" cy="${r(ty)}" rx="${r(rx)}" ry="${r(ry)}" fill="${c[0]}" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>`);
    return this;
  }
  banda(x, y, rad, z0, z1, fill) {
    const [cx, y0] = this.P(x, y, z0); const [, y1] = this.P(x, y, z1); const rx = 1.2247 * rad * this.u; const ry = 0.7071 * rad * this.u;
    this.o.push(`<path d="M${r(cx - rx)} ${r(y1)}A${r(rx)} ${r(ry)} 0 0 0 ${r(cx + rx)} ${r(y1)}V${r(y0)}A${r(rx)} ${r(ry)} 0 0 1 ${r(cx - rx)} ${r(y0)}Z" fill="${fill}"/>`);
    return this;
  }
  sombra(x, y, w, d, c) { const p = this.P.bind(this); return this.poly([p(x + 0.4, y + 0.4), p(x + w + 1.6, y + 0.4), p(x + w + 1.6, y + d + 1), p(x + 0.4, y + d + 1)], c); }
  toString() { return this.o.join(''); }
}

/** Productos reutilizables. t = {a,b,c,d}: cuatro rampas [claro, medio, oscuro], y papel/tinta. */
export function producto(g, tipo, x, y, z, t, tono = 'a') {
  const c = t[tono];
  if (tipo === 'brik') {
    const w = 3.4, d = 2.6, h = 6.4;
    g.box(x, y, z, w, d, h, c);
    const p = g.P.bind(g);
    g.poly([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d / 2, z + h + 1), p(x, y + d / 2, z + h + 1)], t.papelD);
    g.poly([p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d / 2, z + h + 1), p(x, y + d / 2, z + h + 1)], c[0]);
    const f = g.L(x, y, z, w, d, h);
    g.rect(f, 0.4, 1.3, 2.6, 3, t.papel); g.barras(f, 0.7, 2.6, 2, 1.3, t.tinta); g.rect(f, 0.7, 1.7, 2, 0.4, c[1]);
  } else if (tipo === 'lata') {
    g.cil(x + 1.7, y + 1.7, z, 1.7, 3.6, c);
    g.banda(x + 1.7, y + 1.7, 1.7, z + 0.7, z + 2.8, t.papel);
    g.banda(x + 1.7, y + 1.7, 1.7, z + 0.7, z + 1, c[2]);
  } else if (tipo === 'frasco') {
    g.cil(x + 1.5, y + 1.5, z, 1.5, 4.4, c);
    g.banda(x + 1.5, y + 1.5, 1.5, z + 1, z + 3.2, t.papel);
    g.cil(x + 1.5, y + 1.5, z + 4.4, 0.8, 0.8, t.d);
    g.cil(x + 1.5, y + 1.5, z + 5.2, 1.1, 1, t.d);
  } else if (tipo === 'caja') {
    const w = 4, d = 3, h = 3.6;
    g.box(x, y, z, w, d, h, c);
    const f = g.L(x, y, z, w, d, h);
    g.rect(f, 0.5, 0.7, 3, 2.2, t.papel); g.barras(f, 0.8, 1, 2.4, 1.2, t.tinta);
    const tp = g.T(x, y, z, w, d, h);
    g.rect(tp, 0, d / 2 - 0.2, w, 0.4, c[2]);
  } else if (tipo === 'juguete') {
    g.box(x, y, z, 2.6, 2.6, 2.6, t.a); g.box(x + 3, y, z, 2.6, 2.6, 2.6, t.b); g.box(x + 1.4, y + 0.4, z + 2.6, 2.6, 2.6, 2.6, t.c);
  }
  return g;
}

const bandera = (x, y, t, cls = 'bandera') => `<g class="${cls}"><g transform="translate(${r(x)} ${r(y)})"><path d="M0 26 L-9 12 A17 17 0 1 1 9 12 Z" fill="${t.alerta}"/><rect x="-2.6" y="-14" width="5.2" height="15" rx="2.6" fill="#fff"/><circle cy="7" r="3" fill="#fff"/></g></g>`;

/** Cinta de supermercado: los productos pasan por el escáner y uno salta. */
export function cinta(t) {
  const u = 13, ox = 300, oy = 150;
  const nuevo = () => new Iso({ u, ox, oy });
  const g = nuevo();
  const x0 = -8, largo = 40, y0 = 2, ancho = 9, z = 5;
  // Patas y cuerpo
  g.box(x0 + 3, y0 + 1, 0, 1.4, ancho - 2, z - 1.2, t.d); g.box(x0 + largo - 5, y0 + 1, 0, 1.4, ancho - 2, z - 1.2, t.d);
  g.box(x0, y0, z - 1.2, largo, ancho, 1.2, t.b);
  const top = g.T(x0, y0, z, largo, ancho, 0);
  g.poly([top(0, 0), top(largo, 0), top(largo, ancho), top(0, ancho)], t.cintaC);
  const rayas = [];
  for (let i = 0; i < 20; i++) { const a = top(i * 2, 0.6), b = top(i * 2, ancho - 0.6); rayas.push(`M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`); }
  g.raw(`<path class="rayas" d="${rayas.join('')}" stroke="${t.cintaR}" stroke-width="2" fill="none"/>`);
  // Arco, parte trasera
  const ax = 13;
  g.box(ax, y0 - 1.4, 0, 2, 1.4, 15, t.a);
  const atras = g.toString();

  const dist = 40; const dx = r(dist * C * u); const dy = r(dist * 0.5 * u);
  const secuencia = [['caja', 'b'], ['brik', 'c'], ['lata', 'a'], ['caja', 'alerta3'], ['frasco', 'b'], ['brik', 'a']];
  const items = secuencia.map(([tipo, tono], i) => {
    const q = nuevo();
    const o = { ...t, alerta3: t.alertaR };
    producto(q, tipo, x0 - 3, y0 + 2.8, z, o, tono);
    const [fx, fy] = q.P(x0 - 1, y0 + 4, z + (tipo === 'brik' ? 8.6 : 6.4));
    const extra = tono === 'alerta3' ? bandera(fx, fy, t) : '';
    return `<g class="item" style="--i:${i}">${q}${extra}</g>`;
  }).join('');

  const f = nuevo();
  // Haz del escáner
  const p = f.P.bind(f);
  f.poly([p(ax + 1, y0, 14), p(ax + 1, y0 + ancho, 14), p(ax + 1, y0 + ancho, z), p(ax + 1, y0, z)], t.haz, 'class="haz"');
  f.box(ax, y0 + ancho, 0, 2, 1.4, 15, t.a);
  f.box(ax, y0 - 1.4, 15, 2, ancho + 2.8, 1.8, t.a);
  const panel = f.L(ax, y0 - 1.4, 15, 2, ancho + 2.8, 1.8);
  f.rect(panel, 0.3, 0.4, 1.4, 1, t.pantalla);
  return `<svg class="escena" viewBox="-40 -30 680 500" aria-hidden="true" style="--dx:${dx}px;--dy:${dy}px">${atras}<g>${items}</g>${f}</svg>`;
}

/** Estante enorme con un haz que lo barre y un producto que late. */
export function estante(t) {
  const u = 15; const g = new Iso({ u, ox: 330, oy: 400 });
  const w = 30, d = 6;
  const baldas = [0.6, 9, 17.4];
  g.box(0, 0, 0, 0.8, 0.8, 26, t.d); g.box(w - 0.8, 0, 0, 0.8, 0.8, 26, t.d);
  const mezcla = [['caja', 'a'], ['lata', 'b'], ['brik', 'c'], ['frasco', 'a'], ['caja', 'b'], ['lata', 'c']];
  let n = 0; let posAlerta = null;
  for (const z of [...baldas].reverse()) {
    g.box(0, 0, z, w, d, 0.6, t.b);
    let x = 1.4;
    while (x < w - 5) {
      const [tipo, tono] = mezcla[n % mezcla.length];
      n++;
      if (n === 8) { posAlerta = g.P(x + 2, 3, z + 7.8); producto(g, 'caja', x, 1.6, z + 0.6, { ...t, r: t.alertaR }, 'r'); x += 5; continue; }
      producto(g, tipo, x, 1.6, z + 0.6, t, tono);
      x += tipo === 'caja' ? 5 : tipo === 'juguete' ? 7 : 4.4;
    }
  }
  g.box(0, d - 0.8, 0, 0.8, 0.8, 26, t.d); g.box(w - 0.8, d - 0.8, 0, 0.8, 0.8, 26, t.d);
  const p = g.P.bind(g);
  const haz = `<polygon class="barrido" points="${[p(0, d + 0.2, 26), p(3.4, d + 0.2, 26), p(3.4, d + 0.2, 0), p(0, d + 0.2, 0)].map((q) => q.map(r).join(',')).join(' ')}" fill="${t.haz}"/>`;
  const dist = w - 3.4;
  const pulso = `<g transform="translate(${r(posAlerta[0])} ${r(posAlerta[1] + 34)})"><circle class="pulso" r="26" fill="none" stroke="${t.alerta}" stroke-width="3"/><circle class="pulso p2" r="26" fill="none" stroke="${t.alerta}" stroke-width="3"/></g>`;
  return `<svg class="escena" viewBox="225 -30 520 730" aria-hidden="true" style="--dx:${r(dist * C * u)}px;--dy:${r(dist * 0.5 * u)}px">${g}${haz}${pulso}${bandera(posAlerta[0], posAlerta[1], t)}</svg>`;
}

/** Productos sueltos para componer a mano. */
export function suelto(tipo, t, tono = 'a') {
  const g = new Iso({ u: 20, ox: 100, oy: 40 });
  producto(g, tipo, 0, 0, 0, t, tono);
  return `<svg viewBox="0 -40 200 240" aria-hidden="true">${g}</svg>`;
}

export const logos = {
  cesta: (tinta, base, alerta, fondo) => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 27 28 9M46 27 36 9" stroke="${tinta}" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="5" y="23" width="54" height="9" rx="4.5" fill="${tinta}"/><path d="M10 34h44l-4.6 21.4A5 5 0 0 1 44.5 59h-25a5 5 0 0 1-4.9-3.6z" fill="${base}"/><g fill="${fondo}"><rect x="21" y="39" width="4.4" height="14" rx="2.2"/><rect x="29.8" y="39" width="4.4" height="14" rx="2.2"/><rect x="38.6" y="39" width="4.4" height="14" rx="2.2"/></g><circle cx="49" cy="15" r="13.5" fill="${alerta}" stroke="${fondo}" stroke-width="3"/><rect x="46.8" y="7.5" width="4.4" height="10" rx="2.2" fill="#fff"/><circle cx="49" cy="21.4" r="2.5" fill="#fff"/></svg>`,
  lupa: (tinta, base, alerta, fondo) => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M41 41 57 57" stroke="${tinta}" stroke-width="10" stroke-linecap="round"/><circle cx="27" cy="27" r="20.5" fill="${base}" stroke="${tinta}" stroke-width="7"/><rect x="24" y="13" width="6" height="18" rx="3" fill="${alerta}"/><circle cx="27" cy="38" r="3.6" fill="${alerta}"/></svg>`,
  caja: (tinta, base, alerta, fondo) => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M28 4 52 17.5 28 31 4 17.5z" fill="${base}"/><path d="M4 17.5 28 31v27L4 44.5z" fill="${tinta}"/><path d="M52 17.5 28 31v27l24-13.5z" fill="${tinta}" opacity=".78"/><path d="M15 11 39 24.5v6.6l-6-3.4v-6L9 14.2z" fill="${fondo}" opacity=".85"/><circle cx="45" cy="45" r="16" fill="${fondo}"/><circle cx="45" cy="45" r="13" fill="none" stroke="${alerta}" stroke-width="6"/><path d="M35.8 35.8 54.2 54.2" stroke="${alerta}" stroke-width="6"/></svg>`,
};

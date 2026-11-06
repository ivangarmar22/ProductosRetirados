// Primitivas isométricas: ejes a 30°, luz fija desde arriba a la izquierda.
const C = Math.cos(Math.PI / 6);
const r1 = (n) => Math.round(n * 10) / 10;

export class Iso {
  constructor({ u = 10, ox = 0, oy = 0, stroke = 'none', sw = 0 } = {}) {
    Object.assign(this, { u, ox, oy, stroke, sw });
    this.out = []; this.bb = [1e9, 1e9, -1e9, -1e9];
  }
  grow(x, y) { const b = this.bb; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }
  P(x, y, z = 0) { const p = [this.ox + (x - y) * C * this.u, this.oy + (x + y) * 0.5 * this.u - z * this.u]; this.grow(p[0], p[1]); return p; }
  raw(s) { this.out.push(s); return this; }
  poly(pts, fill, extra = '') {
    const d = pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ');
    const st = this.stroke !== 'none' ? ` stroke="${this.stroke}" stroke-width="${this.sw}" stroke-linejoin="round"` : '';
    this.out.push(`<polygon points="${d}" fill="${fill}"${st} ${extra}/>`);
    return this;
  }
  line(a, b, color = this.stroke, w = this.sw) {
    this.out.push(`<path d="M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`);
    return this;
  }
  // Caja: caras visibles superior, +y (izquierda) y +x (derecha).
  box(x, y, z, w, d, h, c) {
    const { P } = this; const p = P.bind(this);
    this.poly([p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)], c.left);
    this.poly([p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)], c.right);
    this.poly([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)], c.top);
    return this;
  }
  // Coordenadas sobre una cara: u a la derecha, v hacia abajo desde la arista superior.
  onLeft(x, y, z, w, d, h) { return (u, v) => this.P(x + u, y + d, z + h - v); }
  onRight(x, y, z, w, d, h) { return (u, v) => this.P(x + w, y + d - u, z + h - v); }
  onTop(x, y, z, w, d, h) { return (u, v) => this.P(x + u, y + v, z + h); }
  rect(f, u, v, w, h, fill) { return this.poly([f(u, v), f(u + w, v), f(u + w, v + h), f(u, v + h)], fill); }
  // Código de barras dibujado sobre una cara.
  barcode(f, u, v, w, h, color, pattern = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2]) {
    const total = pattern.reduce((a, b) => a + b, 0); let pos = 0; const save = [this.stroke, this.sw]; this.stroke = 'none';
    pattern.forEach((n, i) => { const bw = (n / total) * w; if (i % 2 === 0) this.rect(f, u + pos, v, bw, h, color); pos += bw; });
    [this.stroke, this.sw] = save; return this;
  }
  // Cilindro vertical con tapa.
  cyl(x, y, z, r, h, c) {
    const [cx, cy] = this.P(x, y, z); const [, ty] = this.P(x, y, z + h);
    const rx = 1.2247 * r * this.u; const ry = 0.7071 * r * this.u; // encuadre cil
    this.grow(cx - rx, ty - ry); this.grow(cx + rx, cy + ry);
    const st = this.stroke !== 'none' ? ` stroke="${this.stroke}" stroke-width="${this.sw}"` : '';
    this.out.push(`<path d="M${r1(cx - rx)} ${r1(ty)}V${r1(cy)}A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(cy)}V${r1(ty)}Z" fill="${c.side}"${st}/>`);
    if (c.shade) this.out.push(`<path d="M${r1(cx + rx * 0.2)} ${r1(ty + ry * 0.97)}V${r1(cy + ry * 0.97)}A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(cy)}V${r1(ty)}Z" fill="${c.shade}"/>`);
    this.out.push(`<ellipse cx="${r1(cx)}" cy="${r1(ty)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${c.top}"${st}/>`);
    return this;
  }
  // Círculo en el plano vertical +y (mira a la izquierda) o en el suelo.
  circleOn(f, cu, cv, r, fill, extra = '') {
    const pts = []; for (let i = 0; i < 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push(f(cu + r * Math.cos(t), cv + r * Math.sin(t))); }
    return this.poly(pts, fill, extra);
  }
  ground(x, y, rw, fill) {
    const [cx, cy] = this.P(x, y, 0);
    this.out.push(`<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(1.2247 * rw * this.u)}" ry="${r1(0.7071 * rw * this.u)}" fill="${fill}"/>`);
    return this;
  }
  svg(title, pad = 14) {
    const [a, b, c, d] = this.bb; const w = Math.ceil(c - a + pad * 2); const h = Math.ceil(d - b + pad * 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Math.floor(a - pad)} ${Math.floor(b - pad)} ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">${this.out.join('')}</svg>
`;
  }
  // Sombra proyectada en el suelo, en dirección +x +y.
  shadow(x, y, w, d, len, fill) {
    const p = this.P.bind(this); const st = this.stroke; this.stroke = 'none';
    this.poly([p(x + w, y, 0), p(x + w + len, y + len * 0.35, 0), p(x + w + len, y + d + len * 0.35, 0), p(x + len * 0.3, y + d + len * 0.35, 0), p(x, y + d, 0), p(x + w, y + d, 0)], fill);
    this.stroke = st; return this;
  }
  hatch(f, w, h, n, color, sw) {
    let d = ''; for (let i = 1; i < n; i++) { const a = f((w * i) / n, 0); const b = f((w * i) / n, h); d += `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`; }
    this.out.push(`<path d="${d}" stroke="${color}" stroke-width="${sw}" fill="none"/>`); return this;
  }
  // Banda de etiqueta alrededor de un cilindro.
  band(x, y, r, z0, z1, fill) {
    const [cx, y0] = this.P(x, y, z0); const [, y1] = this.P(x, y, z1); const rx = 1.2247 * r * this.u; const ry = 0.7071 * r * this.u;
    this.out.push(`<path d="M${r1(cx - rx)} ${r1(y1)}A${r1(rx)} ${r1(ry)} 0 0 0 ${r1(cx + rx)} ${r1(y1)}V${r1(y0)}A${r1(rx)} ${r1(ry)} 0 0 1 ${r1(cx - rx)} ${r1(y0)}Z" fill="${fill}"/>`); return this;
  }
}

// Resto del set isométrico: misma retícula, luz, paleta y sombra que las dos validadas.
import fs from 'node:fs';
import { Iso } from './iso.mjs';
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const P = {
  carbon: '#14181f', carbon2: '#2b313b', carbon3: '#3e4652', etiqueta: '#fbf8f1', etiquetaD: '#e6e0d2', etiquetaDD: '#cfc8b8',
  kraft: '#d4a76a', kraftL: '#e3bf8a', kraftD: '#b58749', sello: '#c22f10', selloL: '#e23d1f', selloD: '#8f2009',
  azul: '#21407a', azulL: '#31599f', azulD: '#172e59', sombra: '#d8d1c1', gris: '#8c8a83',
};
const C = {
  kraft: { top: P.kraftL, left: P.kraft, right: P.kraftD },
  azul: { top: P.azulL, left: P.azul, right: P.azulD },
  rojo: { top: P.selloL, left: P.sello, right: P.selloD },
  blanco: { top: P.etiqueta, left: P.etiquetaD, right: P.etiquetaDD },
  metal: { top: P.carbon3, left: P.carbon, right: P.carbon2 },
};
const cil = { azul: { side: P.azul, shade: P.azulD, top: P.azulL }, rojo: { side: P.sello, shade: P.selloD, top: P.selloL }, blanco: { side: P.etiquetaD, shade: P.etiquetaDD, top: P.etiqueta }, kraft: { side: P.kraft, shade: P.kraftD, top: P.kraftL }, metal: { side: P.carbon, shade: P.carbon2, top: P.carbon3 } };
const nuevo = (u = 16) => new Iso({ u, ox: 300, oy: 120 });
const bola = (g, x, y, z, r, c, cl) => { const [cx, cy] = g.P(x, y, z); const k = r * g.u; g.grow(cx - k, cy - k); g.grow(cx + k, cy + k); g.raw(`<circle cx="${cx}" cy="${cy}" r="${k}" fill="${c}"/><circle cx="${cx - k * 0.3}" cy="${cy - k * 0.3}" r="${k * 0.42}" fill="${cl}"/>`); };

const E = {};

E.lupa = () => {
  const g = nuevo();
  const x = 2, y = 2, w = 12, d = 2, h = 15;
  g.shadow(x, y, w, d, 5, P.sombra);
  g.box(x, y, 0, w, d, h, C.blanco);
  const f = g.onLeft(x, y, 0, w, d, h);
  g.rect(f, 1, 1, 10, 1.4, P.carbon);
  g.rect(f, 1, 3.2, 7, 0.4, P.carbon); g.rect(f, 1, 4.2, 8.4, 0.4, P.carbon);
  g.barcode(f, 1, 6, 10, 3.6, P.carbon);
  g.rect(f, 1, 10.6, 5, 1.3, P.sello); g.rect(f, 1.4, 11, 4.2, 0.5, P.etiqueta);
  const l = (u, v) => g.P(3.5 + u, 8, 12.5 - v);
  const a = l(7.4, 7.4), b = l(12.2, 12.2);
  g.raw(`<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${P.carbon}" stroke-width="18" stroke-linecap="round"/><path d="M${a[0]} ${a[1] - 3}L${b[0]} ${b[1] - 3}" stroke="${P.carbon3}" stroke-width="10" stroke-linecap="round"/>`);
  g.circleOn(l, 4.5, 4.5, 5.2, P.carbon);
  g.circleOn(l, 4.3, 4.3, 4.2, '#d5e3ee');
  g.barcode(l, 2.3, 3, 4, 2.6, P.carbon);
  return g;
};

E.alimentos = () => {
  const g = nuevo();
  g.shadow(1, 2, 8, 5.5, 4, P.sombra);
  g.box(1, 2, 0, 7, 5, 13, C.rojo);
  const f = g.onLeft(1, 2, 0, 7, 5, 13);
  g.rect(f, 0.8, 3, 5.4, 6, P.etiqueta); g.rect(f, 1.4, 3.8, 4.2, 0.7, P.sello); g.barcode(f, 1.4, 5.4, 4.2, 2.4, P.carbon);
  g.poly([g.P(1, 2, 13), g.P(8, 2, 13), g.P(8, 4.5, 15), g.P(1, 4.5, 15)], P.etiquetaD);
  g.poly([g.P(1, 7, 13), g.P(8, 7, 13), g.P(8, 4.5, 15), g.P(1, 4.5, 15)], P.selloL);
  g.cyl(15, 7, 0, 3.2, 6.5, cil.azul);
  g.band(15, 7, 3.2, 1.2, 5, P.etiqueta);
  g.band(15, 7, 3.2, 1.2, 1.7, P.kraft);
  return g;
};

E.medicamentos = () => {
  const g = nuevo();
  g.shadow(0, 0, 12, 7, 4, P.sombra);
  g.box(0, 0, 0, 12, 7, 5, C.blanco);
  const f = g.onLeft(0, 0, 0, 12, 7, 5);
  g.rect(f, 0, 0, 3.4, 5, P.azul); g.rect(f, 4.2, 1, 6.6, 0.7, P.carbon); g.rect(f, 4.2, 2.4, 4.6, 0.4, P.gris); g.rect(f, 4.2, 3.2, 3.6, 0.4, P.gris);
  const t = g.onTop(0, 0, 0, 12, 7, 5);
  g.rect(t, 1, 3, 3.6, 0.9, P.sello); g.rect(t, 2.35, 1.65, 0.9, 3.6, P.sello);
  // Blíster
  const bx = 3, by = 11, w = 12, d = 7;
  g.shadow(bx, by, w, d, 1.5, P.sombra);
  g.box(bx, by, 0, w, d, 0.4, { top: '#dfe3e6', left: P.etiquetaDD, right: P.gris });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.cyl(bx + 1.9 + i * 2.8, by + 1.9 + j * 3.2, 0.4, 1, 0.7, cil.blanco);
  return g;
};

E.cosmeticos = () => {
  const g = nuevo();
  g.shadow(3, 3, 5, 5, 4, P.sombra);
  g.cyl(5, 5, 0, 3, 9, cil.kraft);
  g.band(5, 5, 3, 3, 7, P.etiqueta);
  g.cyl(5, 5, 9, 1.4, 1.6, cil.metal);
  g.cyl(5, 5, 10.6, 2.1, 1.8, cil.metal);
  g.shadow(11, 5, 8, 4, 3, P.sombra);
  // Tubo tumbado: caja alargada con tapón
  g.box(11, 5, 0, 9, 3.6, 3.2, C.azul);
  const f = g.onLeft(11, 5, 0, 9, 3.6, 3.2);
  g.rect(f, 1, 0.8, 5.5, 1.6, P.etiqueta); g.rect(f, 1.4, 1.3, 4.6, 0.4, P.carbon);
  g.box(20, 5.5, 0.4, 2, 2.6, 2.4, C.metal);
  return g;
};

E.juguetes = () => {
  const g = nuevo();
  g.shadow(0, 0, 11, 11, 4, P.sombra);
  g.box(0, 0, 0, 5.4, 5.4, 5.4, C.rojo);
  g.box(5.8, 0, 0, 5.4, 5.4, 5.4, C.azul);
  g.box(0, 5.8, 0, 5.4, 5.4, 5.4, C.kraft);
  g.box(2.8, 2.8, 5.4, 5.4, 5.4, 5.4, C.blanco);
  [[g.onLeft(2.8, 2.8, 5.4, 5.4, 5.4, 5.4), P.sello], [g.onRight(2.8, 2.8, 5.4, 5.4, 5.4, 5.4), P.azul]].forEach(([f, c]) => g.circleOn(f, 2.7, 2.7, 1.5, c));
  g.circleOn(g.onLeft(0, 5.8, 0, 5.4, 5.4, 5.4), 2.7, 2.7, 1.5, P.etiqueta);
  g.circleOn(g.onRight(5.8, 0, 0, 5.4, 5.4, 5.4), 2.7, 2.7, 1.5, P.etiqueta);
  bola(g, 15, 10, 2.6, 2.6, P.sello, P.selloL);
  return g;
};

E.electricos = () => {
  const g = nuevo();
  g.shadow(1, 1, 9, 9, 3, P.sombra);
  g.box(1, 1, 0, 9, 9, 6, C.blanco);
  const t = g.onTop(1, 1, 0, 9, 9, 6);
  const [cx, cy] = t(4.5, 4.5);
  g.raw(`<ellipse cx="${cx}" cy="${cy}" rx="${1.2247 * 3 * 16}" ry="${0.7071 * 3 * 16}" fill="${P.etiquetaDD}"/>`);
  const [a1, b1] = t(3.2, 5.8); const [a2, b2] = t(5.8, 3.2);
  g.raw(`<ellipse cx="${a1}" cy="${b1}" rx="9" ry="5.2" fill="${P.carbon}"/><ellipse cx="${a2}" cy="${b2}" rx="9" ry="5.2" fill="${P.carbon}"/>`);
  // Rayo en la cara izquierda
  const f = g.onLeft(1, 1, 0, 9, 9, 6);
  g.poly([f(5, 0.8), f(3.2, 3.2), f(4.4, 3.2), f(3.6, 5.2), f(6, 2.4), f(4.8, 2.4)], P.sello);
  // Cargador
  g.shadow(14, 6, 5, 4, 2.6, P.sombra);
  g.box(14, 6, 0, 5, 4, 4.4, C.metal);
  g.cyl(13.4, 7, 1.6, 0.4, 0.1, cil.metal);
  const c = g.onRight(14, 6, 0, 5, 4, 4.4);
  g.rect(c, 1, 1.4, 2, 1.6, P.carbon3);
  return g;
};

E.infantil = () => {
  const g = nuevo();
  g.shadow(3, 3, 4, 4, 4, P.sombra);
  g.cyl(5, 5, 0, 2.6, 8.5, cil.blanco);
  g.band(5, 5, 2.6, 0, 1.5, P.etiquetaDD);
  [2.5, 4.5, 6.5].forEach((z) => g.band(5, 5, 2.6, z, z + 0.16, P.gris));
  g.cyl(5, 5, 8.5, 2.8, 1.4, cil.azul);
  g.cyl(5, 5, 9.9, 1.2, 1.9, cil.kraft);
  g.cyl(5, 5, 11.8, 0.6, 0.8, cil.kraft);
  // Chupete
  g.shadow(11, 5, 4, 4, 2, P.sombra);
  g.cyl(13, 7, 0, 2.6, 0.5, cil.rojo);
  g.cyl(13, 7, 0.5, 1, 1.4, cil.kraft);
  bola(g, 13, 7, 2.5, 0.95, P.selloD, P.sello);
  return g;
};

E.vehiculos = () => {
  const g = nuevo();
  g.shadow(0, 2, 18, 8, 3, P.sombra);
  g.box(0, 2, 1, 18, 8, 3.4, C.rojo);
  g.box(4, 2.6, 4.4, 9.4, 6.8, 3.2, C.blanco);
  const f = g.onLeft(4, 2.6, 4.4, 9.4, 6.8, 3.2);
  g.rect(f, 0.6, 0.5, 3.8, 2, P.azulD); g.rect(f, 5, 0.5, 3.8, 2, P.azulD);
  const r = g.onRight(4, 2.6, 4.4, 9.4, 6.8, 3.2);
  g.rect(r, 0.6, 0.5, 5.6, 2, P.azulD);
  const fr = g.onRight(0, 2, 1, 18, 8, 3.4);
  g.rect(fr, 1, 1, 1.5, 0.8, P.kraftL); g.rect(fr, 5.5, 1, 1.5, 0.8, P.kraftL);
  const fl = g.onLeft(0, 2, 1, 18, 8, 3.4);
  [[3.6], [14.4]].forEach(([u]) => { g.circleOn(fl, u, 2.6, 1.9, P.carbon); g.circleOn(fl, u, 2.6, 0.9, P.etiquetaDD); });
  return g;
};

E.alergenos = () => {
  const g = nuevo();
  g.shadow(1, 1, 16, 16, 2, P.sombra);
  g.cyl(9, 9, 0, 8, 0.6, cil.blanco);
  const [cx, cy] = g.P(9, 9, 0.6);
  g.raw(`<ellipse cx="${cx}" cy="${cy}" rx="${1.2247 * 6 * 16}" ry="${0.7071 * 6 * 16}" fill="${P.etiquetaD}"/>`);
  // Huevo, pan y frutos secos
  const [ex, ey] = g.P(6.5, 9.5, 1.8);
  g.raw(`<ellipse cx="${ex}" cy="${ey}" rx="24" ry="30" fill="${P.etiqueta}"/><ellipse cx="${ex - 7}" cy="${ey - 10}" rx="8" ry="10" fill="#fff"/>`);
  g.box(9.5, 5, 0.6, 5, 4, 2.2, C.kraft);
  bola(g, 11, 12, 1.5, 1.1, P.kraftD, P.kraft); bola(g, 13, 11, 1.5, 1.1, P.kraftD, P.kraft); bola(g, 9.6, 13.2, 1.5, 1.1, P.kraftD, P.kraft);
  return g;
};

E.devolucion = () => {
  const g = nuevo();
  g.shadow(0, 2, 18, 7, 4, P.sombra);
  g.box(0, 2, 0, 18, 7, 7.5, C.azul);
  g.box(-0.5, 1.5, 7.5, 19, 8, 0.7, C.blanco);
  const f = g.onLeft(0, 2, 0, 18, 7, 7.5);
  g.rect(f, 1.5, 1.6, 15, 3.8, P.azulL);
  g.box(2, 3, 8.2, 5, 4, 3.6, C.kraft);
  const c = g.onLeft(2, 3, 8.2, 5, 4, 3.6);
  g.rect(c, 0.8, 0.8, 3.4, 2, P.etiqueta); g.barcode(c, 1, 1, 3, 1.5, P.carbon);
  // Ticket
  g.box(10, 4, 8.2, 3.6, 3, 0.1, C.blanco);
  const t = g.onTop(10, 4, 8.2, 3.6, 3, 0.1);
  [0.6, 1.2, 1.8, 2.4].forEach((v) => g.rect(t, 0.5, v, 2.6, 0.18, P.gris));
  g.box(14.6, 4, 8.2, 2.6, 3.4, 2, C.metal);
  return g;
};

E.archivador = () => {
  const g = nuevo();
  g.shadow(1, 1, 10, 9, 4, P.sombra);
  g.box(1, 1, 0, 10, 9, 15, C.metal);
  [0.8, 5.6, 10.4].forEach((z, i) => {
    const y = 1; const f = g.onLeft(1, y, 0, 10, 9, 15);
    g.rect(f, 0.8, 15 - z - 3.8, 8.4, 3.8, i === 1 ? P.azul : P.carbon3);
    g.rect(f, 3.4, 15 - z - 2.9, 3.2, 1.1, P.etiqueta);
    g.rect(f, 4.2, 15 - z - 1.3, 1.6, 0.4, P.kraftL);
  });
  g.box(14, 5, 0, 7, 5, 0.5, C.blanco);
  g.box(14.5, 5.4, 0.5, 7, 5, 0.5, C.kraft);
  g.box(15, 5.8, 1, 7, 5, 0.5, C.rojo);
  return g;
};

E.buzon = () => {
  const g = nuevo();
  g.shadow(3, 3, 6, 10, 4, P.sombra);
  g.box(5, 7, 0, 1.4, 1.4, 8, C.metal);
  g.box(2, 3, 8, 7, 10, 6, C.rojo);
  const f = g.onLeft(2, 3, 8, 7, 10, 6);
  g.rect(f, 1.5, 1.6, 4, 0.9, P.selloD);
  const r = g.onRight(2, 3, 8, 7, 10, 6);
  g.rect(r, 2, 1.6, 6, 0.8, P.selloD);
  g.box(9, 7, 12.6, 0.4, 3, 3.6, C.kraft);
  // Sobre
  g.shadow(13, 9, 7, 5, 1.4, P.sombra);
  g.box(13, 9, 0, 7, 5, 0.4, C.blanco);
  const t = g.onTop(13, 9, 0, 7, 5, 0.4);
  g.poly([t(0, 0), t(3.5, 2.7), t(7, 0)], P.etiquetaD);
  return g;
};

E.cable = () => {
  const g = nuevo();
  g.shadow(1, 1, 7, 7, 3, P.sombra);
  g.box(1, 1, 0, 7, 7, 4.4, C.blanco);
  const t = g.onTop(1, 1, 0, 7, 7, 4.4);
  const [a, b] = t(2.4, 4.6); const [c, d] = t(4.6, 2.4);
  g.raw(`<ellipse cx="${a}" cy="${b}" rx="8" ry="4.6" fill="${P.carbon}"/><ellipse cx="${c}" cy="${d}" rx="8" ry="4.6" fill="${P.carbon}"/>`);
  g.shadow(13, 7, 4.6, 4, 2, P.sombra);
  const p = g.P(15.4, 9, 2);
  const q = g.P(22, 15, 0);
  g.grow(q[0], q[1]);
  g.raw(`<path d="M${p[0]} ${p[1]}C${p[0] + 70} ${p[1] + 10} ${q[0] - 40} ${q[1] - 60} ${q[0]} ${q[1]}" stroke="${P.carbon}" stroke-width="7" stroke-linecap="round" fill="none"/>`);
  g.box(12.4, 7, 0, 5, 4, 4, C.metal);
  g.box(10.6, 8, 1.4, 1.8, 0.5, 0.5, C.kraft); g.box(10.6, 9.6, 1.4, 1.8, 0.5, 0.5, C.kraft);
  // Chispa de aviso
  const [sx, sy] = g.P(9.2, 5.4, 6.4);
  g.raw(`<path d="M${sx} ${sy - 22}l7 14 15 2-11 10 3 15-14-8-14 8 3-15-11-10 15-2z" fill="${P.sello}"/>`);
  return g;
};

E.caja = () => {
  const g = nuevo();
  const x = 2, y = 2, w = 13, d = 11, h = 8;
  g.shadow(x, y, w, d, 5, P.sombra);
  // Interior visible y solapas abiertas
  g.poly([g.P(x, y, h), g.P(x + w, y, h), g.P(x + w, y + d, h), g.P(x, y + d, h)], P.kraftD);
  g.poly([g.P(x, y, h), g.P(x + w, y, h), g.P(x + w, y, h - 4), g.P(x + 3, y + 3, h - 4)], '#8f6a37');
  g.poly([g.P(x, y, h), g.P(x, y + d, h), g.P(x + 3, y + d, h - 3), g.P(x + 3, y + 3, h - 4)], '#a07a43');
  g.poly([g.P(x, y, h), g.P(x + w, y, h), g.P(x + w, y - 4, h + 4), g.P(x, y - 4, h + 4)], P.kraftL);
  g.poly([g.P(x, y, h), g.P(x, y + d, h), g.P(x - 4, y + d, h + 4), g.P(x - 4, y, h + 4)], P.kraft);
  const c = { left: P.kraft, right: P.kraftD };
  g.poly([g.P(x, y + d, h), g.P(x + w, y + d, h), g.P(x + w, y + d, 0), g.P(x, y + d, 0)], c.left);
  g.poly([g.P(x + w, y, h), g.P(x + w, y + d, h), g.P(x + w, y + d, 0), g.P(x + w, y, 0)], c.right);
  g.poly([g.P(x + w, y + d, h), g.P(x + w + 4, y + d, h + 4), g.P(x + w + 4, y, h + 4), g.P(x + w, y, h)], P.kraftL);
  g.poly([g.P(x, y + d, h), g.P(x + w, y + d, h), g.P(x + w, y + d + 4, h + 4), g.P(x, y + d + 4, h + 4)], '#ecd3ad');
  return g;
};

const titulos = { lupa: 'Lupa sobre una etiqueta', alimentos: 'Brik y lata', medicamentos: 'Caja de medicamento y blíster', cosmeticos: 'Frasco y tubo', juguetes: 'Cubos de juguete y pelota', electricos: 'Enchufe y cargador', infantil: 'Biberón y chupete', vehiculos: 'Coche', alergenos: 'Plato con alimentos', devolucion: 'Mostrador de devolución con caja y ticket', archivador: 'Archivador con fichas', buzon: 'Buzón y sobre', cable: 'Cable desenchufado', caja: 'Caja vacía' };
for (const [k, fn] of Object.entries(E)) fs.writeFileSync(`${out}/${k}.svg`, fn().svg(titulos[k]));
console.log(Object.keys(E).length, 'escenas');

// Ilustraciones de validación del estilo Etiqueta: planas, sin trazo, luz arriba a la izquierda.
import fs from 'node:fs';
import { Iso } from './iso.mjs';
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const P = {
  carbon: '#14181f', carbon2: '#2b313b', carbon3: '#3e4652', etiqueta: '#fbf8f1', etiquetaD: '#e6e0d2', etiquetaDD: '#cfc8b8',
  kraft: '#d4a76a', kraftL: '#e3bf8a', kraftD: '#b58749', sello: '#c22f10', selloL: '#e23d1f', selloD: '#8f2009',
  azul: '#21407a', azulL: '#31599f', azulD: '#172e59', sombra: '#d8d1c1', gris: '#8c8a83',
};

function envase() {
  const g = new Iso({ u: 16, ox: 270, oy: 96 });
  const c = { top: P.kraftL, left: P.kraft, right: P.kraftD };
  const x = 2, y = 2, z = 0, w = 15, d = 11, h = 11;
  const bx = 21, by = 10;
  g.shadow(x, y, w, d, 7, P.sombra);
  g.shadow(bx - 2, by - 2, 4, 4, 3, P.sombra);
  g.box(x, y, z, w, d, h, c);
  const ft = g.onTop(x, y, z, w, d, h);
  g.rect(ft, 0, d / 2 - 0.08, w, 0.16, P.kraftD); g.rect(ft, w / 2 - 0.9, 0, 1.8, d, '#ecd3ad');
  const fl = g.onLeft(x, y, z, w, d, h);
  g.rect(fl, 1.1, 1.2, 12.8, 8.6, P.etiqueta);
  g.rect(fl, 1.1, 1.2, 12.8, 1.6, P.carbon);
  g.rect(fl, 1.8, 1.75, 4.6, 0.5, P.etiqueta);
  g.barcode(fl, 1.9, 3.5, 7, 3.6, P.carbon);
  g.rect(fl, 1.9, 7.4, 7, 0.34, P.carbon);
  g.rect(fl, 1.9, 8.2, 4.4, 0.34, P.carbon);
  g.rect(fl, 1.9, 8.9, 5.6, 0.2, P.gris);
  g.circleOn(fl, 11.4, 6.2, 1.9, P.sello);
  g.circleOn(fl, 11.4, 6.2, 1.45, P.etiqueta);
  g.circleOn(fl, 11.4, 6.2, 1.15, P.sello);
  g.rect(fl, 10.5, 5.9, 1.8, 0.6, P.etiqueta);
  const fr = g.onRight(x, y, z, w, d, h);
  g.rect(fr, 1.2, 1.2, 8.6, 0.5, P.kraftL);
  g.rect(fr, 1.2, 2.2, 6.2, 0.5, P.kraftL);
  g.cyl(bx, by, 0, 2.5, 6.2, { side: P.azul, shade: P.azulD, top: P.azulL });
  g.band(bx, by, 2.5, 1.2, 4.2, P.etiqueta);
  g.band(bx, by, 2.5, 1.2, 1.6, P.sello);
  const [tx, ty] = g.P(bx, by, 6.2);
  g.raw(`<ellipse cx="${tx}" cy="${ty}" rx="23" ry="13.3" fill="${P.azulD}"/>`);
  return g.svg('Envase con etiqueta, código de barras y sello de lote');
}

function estante() {
  const g = new Iso({ u: 15, ox: 300, oy: 60 });
  const metal = { top: P.carbon3, left: P.carbon, right: P.carbon2 };
  const balda = { top: P.etiqueta, left: P.etiquetaD, right: P.etiquetaDD };
  const caja = { top: P.kraftL, left: P.kraft, right: P.kraftD };
  const roja = { top: P.selloL, left: P.sello, right: P.selloD };
  const azul = { top: P.azulL, left: P.azul, right: P.azulD };
  g.shadow(0, 0, 26, 6, 5, P.sombra);
  g.box(0, 0, 0, 0.6, 0.6, 17.5, metal);
  g.box(25.4, 0, 0, 0.6, 0.6, 17.5, metal);
  const paquete = (x, w, h, c, z) => {
    const y = 1.6, d = 3.4;
    g.box(x, y, z, w, d, h, c);
    const f = g.onLeft(x, y, z, w, d, h);
    g.rect(f, w * 0.14, h * 0.2, w * 0.72, h * 0.42, P.etiqueta);
    g.barcode(f, w * 0.22, h * 0.28, w * 0.56, h * 0.2, P.carbon, [2, 1, 1, 2, 3, 1, 1, 2, 2]);
  };
  const bote = (x, r, h, z) => {
    g.cyl(x, 3.3, z, r, h, { side: P.azul, shade: P.azulD, top: P.azulL });
    g.band(x, 3.3, r, z + h * 0.25, z + h * 0.7, P.etiqueta);
  };
  // Balda inferior
  g.box(0, 0, 0.4, 26, 6, 0.5, balda);
  paquete(1.4, 3.4, 3.8, caja, 0.9); paquete(5.4, 3.4, 3.8, caja, 0.9); bote(11.6, 1.5, 3.4, 0.9); bote(15.2, 1.5, 3.4, 0.9); paquete(18.2, 3.2, 3, roja, 0.9); paquete(21.8, 3.2, 3, roja, 0.9);
  // Balda superior: un hueco en el centro con la etiqueta de precio
  g.box(0, 0, 9.6, 26, 6, 0.5, balda);
  paquete(1.4, 3.4, 3.6, azul, 10.1); paquete(5.4, 3.4, 3.6, azul, 10.1);
  bote(20.2, 1.5, 3.2, 10.1); bote(23.6, 1.5, 3.2, 10.1);
  // Marca del producto retirado en la balda
  const ft = g.onTop(0, 0, 9.6, 26, 6, 0.5);
  [[10.2, 1.7, 4.4, 0.14], [10.2, 5.0, 4.4, 0.14], [10.2, 1.7, 0.14, 3.4], [14.5, 1.7, 0.14, 3.4]].forEach(([u, v, w, h]) => g.rect(ft, u, v, w, h, P.sello));
  const fb = g.onLeft(0, 0, 9.6, 26, 6, 0.5);
  g.rect(fb, 10.6, -0.02, 3.6, 0.5, P.sello);
  // Montantes delanteros
  g.box(0, 5.4, 0, 0.6, 0.6, 17.5, metal);
  g.box(25.4, 5.4, 0, 0.6, 0.6, 17.5, metal);
  return g.svg('Estante de supermercado con un hueco marcado donde había un producto');
}

fs.writeFileSync(`${out}/hero-envase.svg`, envase());
fs.writeFileSync(`${out}/estante-hueco.svg`, estante());

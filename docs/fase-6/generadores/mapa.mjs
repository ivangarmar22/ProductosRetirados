// Genera src/lib/mapa-espana.ts a partir de Natural Earth 1:10m (dominio público).
//   base=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
//   curl -LO $base/ne_10m_admin_0_countries.geojson
//   curl -LO $base/ne_10m_admin_1_states_provinces.geojson
//   npx mapshaper (ver `capa`), y después: node mapa.mjs <carpeta con los geojson> <salida.ts>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [dir, salida] = process.argv.slice(2);
const mapshaper = path.join(dir, 'node_modules/mapshaper/bin/mapshaper');
const capa = (entrada, ...ops) => {
  const f = path.join(dir, `tmp-${Math.random().toString(36).slice(2)}.json`);
  execFileSync(process.execPath, [mapshaper, path.join(dir, entrada), ...ops, '-o', f, 'format=geojson'], { stdio: 'pipe' });
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  fs.rmSync(f);
  return j.features ?? j.geometries.map((geometry) => ({ geometry, properties: {} }));
};

const MAIN = { minLon: -9.6, maxLon: 4.5, minLat: 35.1, maxLat: 44 };
const CANARIAS = { minLon: -18.3, maxLon: -13.3, minLat: 27.5, maxLat: 29.5 };
const W = 600;
const K = Math.cos((39.5 * Math.PI) / 180);
const H = Math.round(((MAIN.maxLat - MAIN.minLat) / ((MAIN.maxLon - MAIN.minLon) * K)) * W);
const IW = 152;
const IH = Math.round(IW * ((CANARIAS.maxLat - CANARIAS.minLat) / ((CANARIAS.maxLon - CANARIAS.minLon) * Math.cos((28.5 * Math.PI) / 180))));
const INSET = { x: 12, y: H - IH - 12, w: IW, h: IH };
const principal = ([lon, lat]) => [((lon - MAIN.minLon) / (MAIN.maxLon - MAIN.minLon)) * W, ((MAIN.maxLat - lat) / (MAIN.maxLat - MAIN.minLat)) * H];
const recuadro = ([lon, lat]) => [INSET.x + ((lon - CANARIAS.minLon) / (CANARIAS.maxLon - CANARIAS.minLon)) * INSET.w, INSET.y + ((CANARIAS.maxLat - lat) / (CANARIAS.maxLat - CANARIAS.minLat)) * INSET.h];

const d1 = (v) => Math.round(v * 10) / 10;
// Coordenadas relativas: el fichero ocupa casi la mitad.
const trazo = (puntos, cerrado) => {
  const p = puntos.map((q) => q.map((v) => Math.round(v * 10)));
  const delta = p.slice(1).map((q, i) => `${(q[0] - p[i][0]) / 10} ${(q[1] - p[i][1]) / 10}`.replace(/(^| )(-?)0[.]/g, '$1$2.'));
  return `M${p[0][0] / 10} ${p[0][1] / 10}l${delta.join(' ')}${cerrado ? 'z' : ''}`;
};
const anillos = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []).flat();
const lineas = (g) => (g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : g.type === 'GeometryCollection' ? g.geometries.flatMap(lineas) : []);
const area = (f, proy) => anillos(f.geometry).map((r) => trazo(r.map(proy), true)).join('');

const NOMBRES = { 'Foral de Navarra': 'Navarra', Valenciana: 'Comunidad Valenciana', 'Canary Is.': 'Canarias', 'Islas Baleares': 'Illes Balears' };
const provincias = ['-filter', "admin === 'Spain'"];
const rebaja = ['-simplify', 'interval=1700', 'keep-shapes'];
const ccaa = capa('ne_10m_admin_1_states_provinces.geojson', ...provincias, '-dissolve', 'region', ...rebaja, '-filter-islands', 'min-area=3km2', 'remove-empty');
const limites = capa('ne_10m_admin_1_states_provinces.geojson', ...provincias, '-filter', "region !== 'Canary Is.'", ...rebaja, '-innerlines');
const vecinos = capa('ne_10m_admin_0_countries.geojson', '-filter', "['Portugal','France','Andorra','Morocco','Algeria'].includes(ADMIN)", '-clip', 'bbox=-10.3,34.6,5.2,44.7', '-simplify', 'interval=3000', 'keep-shapes', '-filter-islands', 'min-area=30km2', 'remove-empty');

const regiones = Object.fromEntries(ccaa.map((f) => {
  const nombre = NOMBRES[f.properties.region] ?? f.properties.region;
  return [nombre, area(f, nombre === 'Canarias' ? recuadro : principal)];
}).sort(([a], [b]) => a.localeCompare(b, 'es')));
const centro = (nombre) => {
  const r = ccaa.find((f) => (NOMBRES[f.properties.region] ?? f.properties.region) === nombre);
  const p = anillos(r.geometry).flat().map(principal);
  return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length].map(d1);
};
const js = (v) => JSON.stringify(v);
fs.writeFileSync(salida, `// Generado por docs/fase-6/generadores/mapa.mjs desde Natural Earth 1:10m (dominio público). No editar.
export const ANCHO = ${W};
export const ALTO = ${H};
export const RECUADRO = ${js(INSET)};
export const CEUTA = ${js(centro('Ceuta'))};
export const MELILLA = ${js(centro('Melilla'))};
export const VECINOS = ${js(vecinos.map((f) => area(f, principal)).join(''))};
export const PROVINCIAS = ${js(limites.flatMap((f) => lineas(f.geometry)).map((l) => trazo(l.map(principal), false)).join(''))};
export const REGIONES: Record<string, string> = ${JSON.stringify(regiones, null, 2)};
`);
console.log(Object.keys(regiones).length, 'regiones', (fs.statSync(salida).size / 1024).toFixed(1), 'KB', 'H', H, INSET);

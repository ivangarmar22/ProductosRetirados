// Prueba Pagefind real sobre la salida de Astro: tamaño de índice, consultas y bytes transferidos.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.css': 'text/css' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(4599);
fs.writeFileSync(path.join(root, 't.html'), '<!doctype html><title>t</title>');
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage();
let bytes = 0; p.on('response', async (r) => { try { bytes += (await r.body()).length; } catch {} });
await p.goto('http://localhost:4599/t.html');
const qs = ['jamón cocido', 'jamon cocido', 'jamón cosido', 'listeria', 'lysteria', 'URKABE', 'urkave', '61027', '3418178586009', 'MSMR00215', 'msmr', 'R_38/2026', 'huevo'];
const res = await p.evaluate(async (qs) => {
  const pf = await import('/pagefind/pagefind.js'); await pf.init();
  const out = [];
  for (const q of qs) { const t = performance.now(); const s = await pf.search(q); out.push([q, s.results.length, Math.round(performance.now() - t)]); }
  return out;
}, qs);
res.forEach(([q, n, ms]) => console.log(q.padEnd(18), String(n).padStart(6), 'resultados', ms + ' ms'));
console.log('transferido en la sesión:', Math.round(bytes / 1024), 'KB');
await b.close(); srv.close();

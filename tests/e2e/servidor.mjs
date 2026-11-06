// Servidor estático mínimo para probar dist/ sin dependencias.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon' };
const raiz = join(process.cwd(), 'dist');

createServer((q, r) => {
  let f = join(raiz, decodeURIComponent(q.url.split('?')[0]));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) {
    r.writeHead(404, { 'content-type': TIPOS['.html'] });
    return createReadStream(join(raiz, '404.html')).pipe(r);
  }
  r.writeHead(200, { 'content-type': TIPOS[extname(f)] ?? 'application/octet-stream' });
  createReadStream(f).pipe(r);
}).listen(4599);

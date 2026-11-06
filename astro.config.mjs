import { defineConfig } from 'astro/config';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// La URL pública decide el dominio y la subcarpeta. Sin dominio propio el sitio
// vive en https://ivangarmar22.github.io/ProductosRetirados.
const url = new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321');

/** Cambia con los ficheros: sin esto, quien ya visitó la web sigue viendo los iconos antiguos. */
const version = createHash('md5').update(readFileSync('public/iconos.svg')).update(readFileSync('public/favicon.svg')).digest('hex').slice(0, 8);

/** En desarrollo no hay índice de búsqueda: se sirve el de la última compilación. */
const pagefindEnDesarrollo = {
  name: 'pagefind-en-desarrollo',
  configureServer(servidor) {
    servidor.middlewares.use('/pagefind', (peticion, respuesta, siguiente) => {
      const fichero = join('dist/pagefind', decodeURIComponent(peticion.url.split('?')[0]));
      if (!existsSync(fichero) || !statSync(fichero).isFile()) return siguiente();
      if (fichero.endsWith('.js')) respuesta.setHeader('Content-Type', 'text/javascript');
      createReadStream(fichero).pipe(respuesta);
    });
  },
};

export default defineConfig({
  site: url.origin,
  base: url.pathname.replace(/\/$/, '') || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory', concurrency: 4 },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: { plugins: [pagefindEnDesarrollo], define: { 'import.meta.env.PUBLIC_VERSION': JSON.stringify(version) } },
});

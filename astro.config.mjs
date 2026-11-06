import { defineConfig } from 'astro/config';

// La URL pública decide el dominio y la subcarpeta. Sin dominio propio el sitio
// vive en https://ivangarmar22.github.io/ProductosRetirados.
const url = new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321');

export default defineConfig({
  site: url.origin,
  base: url.pathname.replace(/\/$/, '') || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory', concurrency: 4 },
  compressHTML: true,
  devToolbar: { enabled: false },
});

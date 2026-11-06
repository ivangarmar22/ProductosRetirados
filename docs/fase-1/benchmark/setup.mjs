// Escribe la misma ficha en los tres stacks. La ruta del JSON se pasa por BENCH_DATA.
import fs from 'node:fs';
const w = (f, c) => { fs.mkdirSync(f.split('/').slice(0, -1).join('/'), { recursive: true }); fs.writeFileSync(f, c); };

// ---------- Astro ----------
w('astro/astro.config.mjs', `import { defineConfig } from 'astro/config';\nexport default defineConfig({ build: { format: 'directory' } });\n`);
w('astro/src/pages/alerta/[id].astro', `---
import fs from 'node:fs';
export function getStaticPaths() {
  const data = JSON.parse(fs.readFileSync(process.env.BENCH_DATA, 'utf8')).slice(0, +process.env.BENCH_N);
  return data.map((a) => ({ params: { id: a.id }, props: { a } }));
}
const { a } = Astro.props;
---
<html lang="es-ES"><head><meta charset="utf-8" /><title>{a.titulo}</title><meta name="description" content={a.riesgo.descripcion?.slice(0, 150)} /></head>
<body><main><h1>{a.titulo}</h1>
<p>{a.fechas.publicacion} · {a.categoria.literal}</p>
{a.productos.map((p) => (<section><h2>{p.nombre}</h2><p>{p.marcas.join(', ')}</p>
<ul>{p.lotes.map((l) => <li>{l.numero} {l.caducidad}</li>)}</ul><p>{p.ean.join(', ')}</p></section>))}
<h2>Riesgo</h2><p>{a.riesgo.descripcion}</p>
<h2>Medidas</h2><ul>{a.medidas.map((m) => <li>{m.texto}</li>)}</ul>
<a href={a.urlOficial}>Fuente oficial</a></main></body></html>
`);

// ---------- Next ----------
w('next/next.config.mjs', `export default { output: 'export', trailingSlash: true };\n`);
w('next/app/layout.jsx', `export default function L({ children }) { return <html lang="es-ES"><body>{children}</body></html>; }\n`);
w('next/app/page.jsx', `export default function P() { return <main>Inicio</main>; }\n`);
w('next/app/alerta/[id]/page.jsx', `import fs from 'node:fs';
let cache;
const load = () => (cache ??= JSON.parse(fs.readFileSync(process.env.BENCH_DATA, 'utf8')).slice(0, +process.env.BENCH_N));
export const dynamicParams = false;
export function generateStaticParams() { return load().map((a) => ({ id: a.id })); }
export async function generateMetadata({ params }) { const { id } = await params; const a = load()[+id.split('-')[1]]; return { title: a.titulo, description: a.riesgo.descripcion?.slice(0, 150) }; }
export default async function Page({ params }) {
  const { id } = await params; const a = load()[+id.split('-')[1]];
  return <main><h1>{a.titulo}</h1><p>{a.fechas.publicacion} · {a.categoria.literal}</p>
    {a.productos.map((p, i) => <section key={i}><h2>{p.nombre}</h2><p>{p.marcas.join(', ')}</p>
      <ul>{p.lotes.map((l, j) => <li key={j}>{l.numero} {l.caducidad}</li>)}</ul><p>{p.ean.join(', ')}</p></section>)}
    <h2>Riesgo</h2><p>{a.riesgo.descripcion}</p>
    <h2>Medidas</h2><ul>{a.medidas.map((m, i) => <li key={i}>{m.texto}</li>)}</ul>
    <a href={a.urlOficial}>Fuente oficial</a></main>;
}
`);

// ---------- Angular ----------
w('ng/src/app/app.html', `<router-outlet />\n`);
w('ng/src/app/data.ts', `const g = globalThis as any;
export function load(): any[] {
  if (!g.__bench) {
    const fs = g.process.getBuiltinModule('fs');
    g.__bench = JSON.parse(fs.readFileSync(g.process.env.BENCH_DATA, 'utf8')).slice(0, +g.process.env.BENCH_N);
  }
  return g.__bench;
}
`);
w('ng/src/app/ficha.ts', `import { Component, inject, PLATFORM_ID, input, computed } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { load } from './data';
@Component({ selector: 'app-ficha', template: \`
@if (a(); as a) {
<main><h1>{{ a.titulo }}</h1><p>{{ a.fechas.publicacion }} · {{ a.categoria.literal }}</p>
@for (p of a.productos; track $index) { <section><h2>{{ p.nombre }}</h2><p>{{ p.marcas.join(', ') }}</p>
<ul>@for (l of p.lotes; track $index) { <li>{{ l.numero }} {{ l.caducidad }}</li> }</ul><p>{{ p.ean.join(', ') }}</p></section> }
<h2>Riesgo</h2><p>{{ a.riesgo.descripcion }}</p>
<h2>Medidas</h2><ul>@for (m of a.medidas; track $index) { <li>{{ m.texto }}</li> }</ul>
<a [href]="a.urlOficial">Fuente oficial</a></main>
}\` })
export class Ficha {
  id = input.required<string>();
  server = isPlatformServer(inject(PLATFORM_ID));
  t = inject(Title); m = inject(Meta);
  a = computed(() => { if (!this.server) return null; const a = load()[+this.id().split('-')[1]]; this.t.setTitle(a.titulo); this.m.updateTag({ name: 'description', content: (a.riesgo.descripcion || '').slice(0, 150) }); return a; });
}
`);
w('ng/src/app/app.routes.ts', `import { Routes } from '@angular/router';
import { Ficha } from './ficha';
export const routes: Routes = [{ path: 'alerta/:id', component: Ficha }];
`);
w('ng/src/app/app.routes.server.ts', `import { RenderMode, ServerRoute } from '@angular/ssr';
import { load } from './data';
export const serverRoutes: ServerRoute[] = [
  { path: 'alerta/:id', renderMode: RenderMode.Prerender, async getPrerenderParams() { return load().map((a) => ({ id: a.id })); } },
  { path: '**', renderMode: RenderMode.Prerender },
];
`);
let cfg = fs.readFileSync('ng/src/app/app.config.ts', 'utf8');
if (!cfg.includes('withComponentInputBinding')) {
  cfg = cfg.replace("provideRouter(routes)", "provideRouter(routes, withComponentInputBinding())").replace("import { provideRouter } from '@angular/router';", "import { provideRouter, withComponentInputBinding } from '@angular/router';");
  fs.writeFileSync('ng/src/app/app.config.ts', cfg);
}
let ang = fs.readFileSync('ng/angular.json', 'utf8');
ang = ang.replace('"outputMode": "server"', '"outputMode": "static"').replace(/"ssr": \{\s*"entry": "src\/server.ts"\s*\}/, '"ssr": false');
fs.writeFileSync('ng/angular.json', ang);
fs.rmSync('ng/src/app/app.spec.ts', { force: true });
console.log('setup OK');

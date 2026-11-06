// Ejecuta cada build, mide tiempo, memoria aproximada, tamaño de salida y JS de una ficha.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const data = path.resolve('data.json').replaceAll('\\', '/');
const stacks = {
  astro: { cwd: 'astro', cmd: 'npx astro build', out: 'dist', clean: ['dist', '.astro'] },
  next: { cwd: 'next', cmd: 'npx next build', out: 'out', clean: ['out', '.next'] },
  ng: { cwd: 'ng', cmd: 'npx ng build', out: 'dist/ng/browser', clean: ['dist', '.angular'] },
};
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const results = [];
for (const n of process.argv.slice(2).map(Number)) {
  for (const [name, s] of Object.entries(stacks)) {
    s.clean.forEach((c) => fs.rmSync(path.join(s.cwd, c), { recursive: true, force: true }));
    const t0 = Date.now();
    const r = spawnSync(s.cmd, { cwd: s.cwd, shell: true, encoding: 'utf8', timeout: 1500000, maxBuffer: 1 << 28, env: { ...process.env, BENCH_DATA: data, BENCH_N: String(n), NG_CLI_ANALYTICS: 'false', NEXT_TELEMETRY_DISABLED: '1', ASTRO_TELEMETRY_DISABLED: '1', NODE_OPTIONS: '--max-old-space-size=12288' } });
    const seg = ((Date.now() - t0) / 1000).toFixed(1);
    const row = { stack: name, n, seg, status: r.status };
    if (r.status === 0 && fs.existsSync(path.join(s.cwd, s.out))) {
      const files = walk(path.join(s.cwd, s.out));
      const html = files.filter((f) => f.endsWith('.html'));
      const page = files.find((f) => f.replaceAll('\\', '/').endsWith('alerta/alerta-7/index.html'));
      const js = files.filter((f) => f.endsWith('.js'));
      row.ficheros = files.length; row.html = html.length;
      row.salidaMB = +(files.reduce((a, f) => a + fs.statSync(f).size, 0) / 1048576).toFixed(1);
      row.fichaKB = page ? +(fs.statSync(page).size / 1024).toFixed(1) : null;
      const scripts = page ? [...fs.readFileSync(page, 'utf8').matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]) : [];
      row.scripts = scripts.length;
      row.jsTotalKB = +(js.reduce((a, f) => a + fs.statSync(f).size, 0) / 1024).toFixed(0);
    } else { row.error = (r.stderr + r.stdout).slice(-900); }
    results.push(row); console.log(JSON.stringify(row));
    fs.writeFileSync('resultados.json', JSON.stringify(results, null, 1));
  }
}

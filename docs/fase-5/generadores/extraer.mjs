// Saca de data/ lo que usarán los prototipos. Todo real.
import fs from 'node:fs';
import path from 'node:path';
const [raiz, out] = process.argv.slice(2);
const base = path.join(raiz, 'data/alertas');
const todas = fs.readdirSync(base).flatMap((f) => fs.readdirSync(path.join(base, f)).map((n) => JSON.parse(fs.readFileSync(path.join(base, f, n), 'utf8'))))
  .sort((a, b) => b.fechas.publicacion.localeCompare(a.fechas.publicacion));
const fecha = (i) => i.split('-').reverse().join('/');
const ident = (a) => { const p = a.productos[0]; const t = []; if (p?.lotes[0]?.numero) t.push(`Lote ${p.lotes[0].numero.slice(0, 18)}`); else if (p?.lotesTexto) t.push(p.lotesTexto.slice(0, 26)); if (p?.ean[0]) t.push(`EAN ${p.ean[0]}`); return t.join(' · '); };
const nivel = (a) => { const n = a.riesgo.nivelLiteral; if (a.fuente === 'safety-gate') return /grave/i.test(n ?? '') ? ['Riesgo grave', 'grave'] : ['Otro nivel', 'sin']; if (n?.startsWith('Clase')) return [n, 'clase']; if (a.fuente === 'aesan') { if (a.riesgo.tipoNormalizado?.includes('alergeno')) return ['Alérgenos', 'alergeno']; return ['Alerta general', 'general']; } return ['Retirada', 'sin']; };
const corta = (a) => ({ nombre: a.nombreVisible.slice(0, 64), motivo: (a.motivo ?? '').slice(0, 70), ident: ident(a), fecha: fecha(a.fechas.publicacion), nivel: nivel(a), cat: a.categoria.normalizada, fuente: { aesan: 'AESAN', 'aemps-medicamentos': 'AEMPS', 'aemps-cosmeticos': 'AEMPS', 'safety-gate': 'Safety Gate' }[a.fuente], ccaa: a.distribucion.ccaa });
const espana = todas.filter((a) => a.fuente !== 'safety-gate').slice(0, 9).map(corta);
const europa = todas.filter((a) => a.fuente === 'safety-gate' && a.publico !== 'profesionales').slice(0, 6).map(corta);
const cuentaCat = {}; for (const a of todas) cuentaCat[a.categoria.normalizada] = (cuentaCat[a.categoria.normalizada] ?? 0) + 1;
const ccaa = {}; for (const a of todas) for (const c of a.distribucion.ccaa) ccaa[c] = (ccaa[c] ?? 0) + 1;
const semana = '2026-10-30';
const sugerencias = [...new Set(todas.filter((a) => a.fuente !== 'safety-gate').slice(0, 160).concat(todas.filter((a) => a.fuente === 'safety-gate').slice(0, 140)).map((a) => a.nombreVisible.slice(0, 54)))];
const j = todas.find((a) => a.id === 'aesan-2026-80');
fs.writeFileSync(out, JSON.stringify({
  total: todas.length, semana: todas.filter((a) => a.fechas.publicacion >= semana).length, semanaEspana: todas.filter((a) => a.fechas.publicacion >= semana && a.fuente !== 'safety-gate').length,
  espana, europa, cuentaCat, ccaa, sugerencias,
  ficha: { nombre: j.nombreVisible, motivo: j.motivo, ref: j.referenciaOficial, fecha: fecha(j.fechas.publicacion), hacer: j.hacer, ccaa: j.distribucion.ccaa, literal: j.distribucion.literal, url: j.urlOficial, p: j.productos[0] },
}, null, 1));
console.log(todas.length, espana.length, Object.keys(ccaa).length, sugerencias.length);
console.log(espana.slice(0, 4).map((e) => `${e.nombre} | ${e.motivo} | ${e.ident}`));
console.log(ccaa);

// Genera N alertas sintéticas con la forma del esquema real, a partir de los ejemplos normalizados.
import fs from 'node:fs';
const [ejemplos, out, n] = process.argv.slice(2);
const base = JSON.parse(fs.readFileSync(ejemplos, 'utf8'));
const lorem = base.map((b) => b.riesgo.descripcion || b.recomendacion || b.titulo).join(' ');
const data = [];
for (let i = 0; i < +n; i++) {
  const b = structuredClone(base[i % base.length]);
  b.id = `alerta-${i}`;
  b.titulo = `${b.titulo} ${i}`;
  b.riesgo.descripcion = lorem;
  data.push(b);
}
fs.writeFileSync(out, JSON.stringify(data));
console.log(data.length, 'alertas', Math.round(fs.statSync(out).size / 1024), 'KB');

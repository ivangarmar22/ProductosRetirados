/** Agrupa ampliaciones con su alerta original y enlaza alertas relacionadas, sin fusionarlas nunca. */
import type { Alerta } from './tipos.ts';

export interface Relacion { historial?: string[]; relacionadas?: string[] }

export function calcularRelaciones(alertas: Alerta[]): Record<string, Relacion> {
  const salida: Record<string, Relacion> = {};
  const de = (id: string) => (salida[id] ??= {});

  // Historial: misma referencia oficial dentro de una fuente.
  const porRef = new Map<string, Alerta[]>();
  for (const a of alertas) {
    if (!a.referenciaOficial) continue;
    const k = `${a.fuente}|${a.referenciaOficial}`;
    (porRef.get(k) ?? porRef.set(k, []).get(k)!).push(a);
  }
  for (const grupo of porRef.values()) {
    if (grupo.length < 2) continue;
    const orden = grupo
      .sort((x, y) => x.fechas.publicacion.localeCompare(y.fechas.publicacion) || x.idFuente.localeCompare(y.idFuente, 'es', { numeric: true }))
      .map((a) => a.id);
    for (const id of orden) de(id).historial = orden;
  }

  // Relacionadas: EAN o marca + modelo o marca + lote iguales en otra fuente.
  const porClave = new Map<string, Alerta[]>();
  for (const a of alertas) {
    for (const c of a.dedup.claves) {
      if (c.startsWith('ref:')) continue;
      (porClave.get(c) ?? porClave.set(c, []).get(c)!).push(a);
    }
  }
  for (const grupo of porClave.values()) {
    // Una clave compartida por muchas alertas no identifica un producto.
    if (grupo.length < 2 || grupo.length > 6) continue;
    for (const a of grupo) {
      for (const b of grupo) {
        if (a.id === b.id) continue;
        if (a.fuente === b.fuente && a.referenciaOficial === b.referenciaOficial) continue;
        const r = de(a.id);
        r.relacionadas ??= [];
        if (!r.relacionadas.includes(b.id)) r.relacionadas.push(b.id);
      }
    }
  }
  return salida;
}

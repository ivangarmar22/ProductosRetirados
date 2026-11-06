/** Mi despensa vive solo en el navegador. */
const CLAVE = 'mi-despensa';
export interface Despensa { vigiladas: string[]; visita?: string }

export function leerDespensa(): Despensa {
  try { return { vigiladas: [], ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') }; } catch { return { vigiladas: [] }; }
}
export function guardarDespensa(d: Despensa) {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch { /* modo privado */ }
}

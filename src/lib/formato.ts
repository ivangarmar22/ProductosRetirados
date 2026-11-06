/** Formato de España: fechas dd/mm/aaaa y números es-ES. */
export const fecha = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};
export const numero = (n: number) => n.toLocaleString('es-ES');
export const fechaHora = (iso: string | undefined): string => {
  if (!iso) return 'sin datos';
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
};
export const recortar = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : t);
export const escaparXml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

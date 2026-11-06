/** Cliente HTTP respetuoso: se identifica, cumple robots.txt, espacia las peticiones y reintenta poco. */
const USER_AGENT = 'ProductosRetiradosBot/1.0 (+https://github.com/ivangarmar22/ProductosRetirados)';
const PAUSA_MS = Number(process.env.PAUSA_MS ?? 2000);

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Regla { permitir: boolean; patron: string }

/** Reglas aplicables a nuestro bot: su grupo si existe y, si no, el grupo "*". */
export function parsearRobots(texto: string, agente = 'productosretiradosbot'): Regla[] {
  const grupos = new Map<string, Regla[]>();
  let actuales: string[] = [];
  let enCabecera = false;
  for (const bruta of texto.split(/\r?\n/)) {
    const linea = bruta.replace(/#.*/, '').trim();
    const m = linea.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const clave = m[1].toLowerCase();
    const valor = m[2].trim();
    if (clave === 'user-agent') {
      if (!enCabecera) actuales = [];
      enCabecera = true;
      const ua = valor.toLowerCase();
      actuales.push(ua);
      if (!grupos.has(ua)) grupos.set(ua, []);
    } else if (clave === 'allow' || clave === 'disallow') {
      enCabecera = false;
      if (!valor) continue;
      for (const ua of actuales) grupos.get(ua)!.push({ permitir: clave === 'allow', patron: valor });
    } else enCabecera = false;
  }
  return grupos.get(agente) ?? grupos.get('*') ?? [];
}

const aRegex = (patron: string) =>
  new RegExp(`^${patron.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')}`);

/** Gana la regla más larga; a igualdad, la que permite (RFC 9309). */
export function rutaPermitida(reglas: Regla[], ruta: string): boolean {
  let mejor: Regla | null = null;
  for (const r of reglas) {
    if (!aRegex(r.patron).test(ruta)) continue;
    if (!mejor || r.patron.length > mejor.patron.length || (r.patron.length === mejor.patron.length && r.permitir)) mejor = r;
  }
  return mejor ? mejor.permitir : true;
}

class ErrorFuente extends Error {}

export class Cliente {
  private robots = new Map<string, Regla[] | 'bloqueado'>();
  private ultimo = new Map<string, number>();

  private async turno(host: string) {
    const espera = (this.ultimo.get(host) ?? 0) + PAUSA_MS - Date.now();
    if (espera > 0) await esperar(espera);
    this.ultimo.set(host, Date.now());
  }

  private async peticion(url: string, init: RequestInit = {}, tiempo = 60000): Promise<Response> {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), tiempo);
    try {
      return await fetch(url, { ...init, signal: control.signal, headers: { 'User-Agent': USER_AGENT, ...init.headers } });
    } finally {
      clearTimeout(reloj);
    }
  }

  private async cargarRobots(origen: string): Promise<Regla[] | 'bloqueado'> {
    const guardado = this.robots.get(origen);
    if (guardado) return guardado;
    let reglas: Regla[] | 'bloqueado';
    try {
      await this.turno(new URL(origen).host);
      const r = await this.peticion(`${origen}/robots.txt`, {}, 30000);
      if (r.status >= 500) reglas = 'bloqueado';
      else if (r.ok && (r.headers.get('content-type') ?? '').match(/text\/(plain|x-robots)/)) reglas = parsearRobots(await r.text());
      else reglas = [];
    } catch {
      // Inaccesible: la RFC 9309 pide asumir que no se puede rastrear.
      reglas = 'bloqueado';
    }
    this.robots.set(origen, reglas);
    return reglas;
  }

  /** Lanza ErrorFuente si robots.txt no lo permite o si la respuesta no es correcta. */
  async pedir(url: string, init: RequestInit = {}): Promise<Response> {
    const u = new URL(url);
    const reglas = await this.cargarRobots(u.origin);
    if (reglas === 'bloqueado') throw new ErrorFuente(`robots.txt inaccesible en ${u.host}`);
    if (!rutaPermitida(reglas, u.pathname + u.search)) throw new ErrorFuente(`robots.txt no permite ${u.pathname}`);
    let ultimoError: unknown;
    for (let intento = 0; intento < 3; intento++) {
      await this.turno(u.host);
      try {
        const r = await this.peticion(url, init);
        if (r.ok) return r;
        if (r.status < 500 && r.status !== 429) throw new ErrorFuente(`HTTP ${r.status} en ${url}`);
        ultimoError = new ErrorFuente(`HTTP ${r.status} en ${url}`);
      } catch (e) {
        if (e instanceof ErrorFuente) throw e;
        ultimoError = e;
      }
      await esperar(5000 * (intento + 1));
    }
    throw ultimoError instanceof Error ? ultimoError : new ErrorFuente(`Fallo en ${url}`);
  }

  texto = async (url: string) => (await this.pedir(url)).text();
  json = async <T>(url: string, cabeceras: Record<string, string> = {}) =>
    (await (await this.pedir(url, { headers: { Accept: 'application/json', ...cabeceras } })).json()) as T;
}

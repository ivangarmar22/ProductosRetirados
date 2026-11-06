/** Forma de una alerta normalizada. La fuente de verdad es schema/alerta.schema.json. */
export type Fuente = 'aesan' | 'aemps-medicamentos' | 'aemps-productos-sanitarios' | 'aemps-cosmeticos' | 'consumo' | 'safety-gate';

export interface Lote {
  numero: string | null;
  caducidad?: string | null;
  consumoPreferente?: string | null;
  codigoNacional?: string | null;
}

export interface Producto {
  nombre: string | null;
  marcas: string[];
  modelos: string[];
  lotes: Lote[];
  ean: string[];
  registroAemps?: string | null;
  descripcion?: string | null;
  envase?: string | null;
  peso?: string | null;
  temperatura?: string | null;
  fechasTexto?: string | null;
  /** Texto literal cuando el lote no es solo un código, por ejemplo "Todos los lotes". */
  lotesTexto?: string | null;
}

export interface Alerta {
  id: string;
  slug: string;
  fuente: Fuente;
  idFuente: string;
  referenciaOficial: string | null;
  urlOficial: string;
  tipoAviso: 'alerta' | 'ampliacion' | 'correccion';
  alertaBase?: string | null;
  titulo: string;
  nombreVisible: string;
  motivo?: string | null;
  resumen?: string | null;
  fechas: { publicacion: string; publicacionWeb?: string | null; modificacion?: string | null };
  categoria: { literal: string; normalizada?: string | null };
  publico?: 'consumidores' | 'profesionales' | null;
  productos: Producto[];
  riesgo: { tipos: string[]; tipoNormalizado?: string[]; descripcion: string | null; nivelLiteral: string | null; alergenos?: string[] };
  medidas: { texto: string; fecha?: string | null }[];
  recomendacion?: string | null;
  hacer?: string[];
  hacerOrigen?: 'fuente' | 'general';
  distribucion: {
    ccaa: string[];
    /** La fuente habla de todo o casi todo el país, sin citar comunidades. */
    nacional?: boolean;
    paisNotificante: string | null;
    paisOrigen: string | null;
    paisesDetectado: string[];
    autoridadNotificante: string | null;
    literal: string | null;
  };
  empresas: { rol: 'titular' | 'fabricante' | 'vendedor-online'; nombre: string }[];
  imagenes: { urlOrigen: string | null; nombreFichero?: string | null }[];
  documentos: { url: string; nombre: string | null }[];
  dedup: { claves: string[] };
  procedencia: {
    formato: 'html' | 'json-incrustado' | 'json-api' | 'xml';
    extraccion: 'campo-estructurado' | 'texto-etiquetado' | 'texto-libre';
    consultadoEn: string;
    hashContenido?: string | null;
    enriquecido?: boolean;
  };
}

/** Sin slug ni fechas de consulta: lo que devuelven los parsers antes de guardar. */
export type AlertaParseada = Omit<Alerta, 'slug'> & { slug?: string };

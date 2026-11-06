import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { analizarTitulo, campoDeEtiqueta, distribucionDe, interpretarLotes, parsearFicha, parsearSitemap } from '../../pipeline/fuentes/aesan.ts';
import { extraerMedicamentos, nombreDeNota, normalizarMedicamento, parsearListaCosmeticos, parsearNotaCosmetico, lotesDeNota } from '../../pipeline/fuentes/aemps.ts';
import { enriquecer, medidasDesdeXml, parsearInforme, parsearLista } from '../../pipeline/fuentes/safety-gate.ts';
import type { Alerta, AlertaParseada } from '../../pipeline/tipos.ts';

const fx = (f: string) => readFileSync(`fixtures/${f}`, 'utf8');
const ajv = new ((Ajv as unknown as { default?: typeof Ajv }).default ?? Ajv)({ allErrors: true, strict: false });
(((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats) as typeof addFormats)(ajv);
const validar = ajv.compile(JSON.parse(readFileSync('schema/alerta.schema.json', 'utf8')));
const valida = (a: AlertaParseada) => {
  const ok = validar({ ...a, slug: a.slug ?? a.id });
  expect(ok, JSON.stringify(validar.errors?.slice(0, 3))).toBe(true);
};

describe('AESAN', () => {
  it('lee el sitemap e ignora las páginas que no son alertas', () => {
    const e = parsearSitemap(fx('aesan/sitemap.xml'));
    expect(e.length).toBeGreaterThan(170);
    expect(e.some((x) => x.slug === '2026_80')).toBe(true);
    expect(e.some((x) => x.slug === 'buscador-alertas')).toBe(false);
  });

  it('reduce las variantes de etiqueta reales, incluida la errata', () => {
    expect(campoDeEtiqueta('teperatura')).toBe('temperatura');
    expect(campoDeEtiqueta('números de lote')).toBe('lote');
    expect(campoDeEtiqueta('número de lotes')).toBe('lote');
    expect(campoDeEtiqueta('Nombre de marca comercial')).toBe('marca');
    expect(campoDeEtiqueta('codigo de barras')).toBe('ean');
    expect(campoDeEtiqueta('lotes y fecha de consumo preferente')).toBe('fechas');
  });

  it('separa motivo, producto y origen del título', () => {
    const t = analizarTitulo('Alerta por presencia de Listeria monocytogenes en jamón cocido procedente de España (Ref. ES2026/665)');
    expect(t).toEqual({ motivo: 'Listeria monocytogenes', producto: 'jamón cocido', origen: 'España' });
  });

  it('parsea una ficha con lista etiquetada', () => {
    const a = parsearFicha(fx('aesan/alerta-2026_80.html'), '2026_80');
    expect(a.referenciaOficial).toBe('ES2026/665');
    expect(a.fechas.publicacion).toBe('2026-11-04');
    expect(a.nombreVisible).toBe('Jamón cocido URKABE');
    const p = a.productos[0];
    expect(p.marcas).toEqual(['URKABE']);
    expect(p.lotes).toEqual([{ numero: '61027', caducidad: '2026-11-26', consumoPreferente: null }]);
    expect(p.peso).toBe('175 g');
    expect(a.distribucion.ccaa).toEqual(['Castilla y León', 'Madrid', 'Navarra', 'País Vasco']);
    expect(a.distribucion.literal).toContain('no es descartable');
    expect(a.hacer?.[0]).toBe('Si tienes este producto en casa, no lo consumas.');
    expect(a.hacer?.join(' ')).toContain('centro de salud');
    valida(a);
  });

  it('usa el título cuando la ficha no trae lista', () => {
    const a = parsearFicha(fx('aesan/alerta-2026_78.html'), '2026_78');
    expect(a.categoria.normalizada).toBe('complementos');
    expect(a.motivo).toMatch(/sildenafilo/i);
    expect(a.nombreVisible).toMatch(/complemento/i);
    valida(a);
  });

  it('detecta el alérgeno en una advertencia', () => {
    const a = parsearFicha(fx('aesan/alerta-2026_77.html'), '2026_77');
    expect(a.riesgo.alergenos).toContain('Huevo');
    expect(a.riesgo.tipoNormalizado).toContain('alergeno');
    valida(a);
  });

  it('no pierde lotes: lo dudoso se conserva como texto', () => {
    expect(interpretarLotes('L7, 12345').texto).toContain('L7');
    expect(interpretarLotes('L25123, 25124L').texto).toContain('25124L');
    expect(interpretarLotes('2024G, A12345').texto).toContain('2024G');
    expect(interpretarLotes('12-34-56, L99999').texto).toContain('12-34-56');
  });

  it('distingue la zona de distribución de la empresa distribuidora', () => {
    expect(distribucionDe(['La empresa distribuidora ALDI ha publicado información.']).literal).toBeNull();
    expect(distribucionDe(['La distribución ha sido a:', 'Madrid y Navarra.']).ccaa).toEqual(['Madrid', 'Navarra']);
    expect(distribucionDe(['Se ha tenido conocimiento de la distribución de otros lotes.', 'La distribución ha sido en Galicia.']).ccaa).toEqual(['Galicia']);
  });

  it('marca como nacional solo si la distribución lo dice', () => {
    expect(distribucionDe(['La distribución se ha realizado en la mayor parte del territorio nacional.']).nacional).toBe(true);
    expect(distribucionDe(['Es previsible que haya distribución de los lotes a toda España.']).nacional).toBe(true);
    expect(distribucionDe(['La distribución ha sido en todas las comunidades autónomas.']).nacional).toBe(true);
    expect(distribucionDe(['La distribución ha sido en Madrid.', 'Se ha informado a todas las comunidades autónomas.']).nacional).toBe(false);
  });

  it('extrae todos los lotes de una nota de cosméticos', () => {
    expect(lotesDeNota('afecta a los lotes ABC123, DEF456 y GHI789 del producto')).toEqual(['ABC123', 'DEF456', 'GHI789']);
    expect(lotesDeNota('Lote: 2305')).toEqual(['2305']);
    expect(lotesDeNota('Retirada de un lote del producto')).toEqual([]);
  });

  it('separa códigos de lote, fechas y texto literal', () => {
    expect(interpretarLotes('250652 Fecha de caducidad: 05/09/2027')).toEqual({ lotes: [{ numero: '250652', caducidad: '2027-09-05', consumoPreferente: null }], texto: null });
    expect(interpretarLotes('Todos los lotes').lotes).toEqual([]);
    expect(interpretarLotes('todos los lotes').texto).toBe('Todos los lotes');
    const dos = interpretarLotes('2301 para el envase de 50 g 3101 para el envase de 800 g');
    expect(dos.lotes.map((l) => l.numero)).toEqual(['2301', '3101']);
    expect(dos.texto).toContain('envase');
    expect(interpretarLotes('fecha de consumo preferente 14.10.25').lotes).toEqual([]);
    expect(interpretarLotes('L260566GG0, L260567GG0').lotes.map((l) => l.numero)).toEqual(['L260566GG0', 'L260567GG0']);
  });

  it('saca el motivo de las advertencias sin la frase habitual', () => {
    expect(analizarTitulo('Advertencia para personas con intolerancia a la lactosa: Lactosa no declarada en etiquetado de producto X procedente de Italia').motivo).toBe('Lactosa no declarada');
  });

  it('conserva la referencia en ampliaciones y separa productos', () => {
    const a = parsearFicha(fx('aesan/alerta-2026_33_ampliacion_6.html'), '2026_33_ampliacion_6');
    expect(a.tipoAviso).toBe('ampliacion');
    expect(a.referenciaOficial).toBe('ES2026/240');
    expect(a.productos.length).toBeGreaterThan(5);
    valida(a);
  });

  it('reconoce las correcciones', () => {
    const a = parsearFicha(fx('aesan/alerta-2025_56_Correc.html'), '2025_56_Correc');
    expect(a.tipoAviso).toBe('correccion');
    valida(a);
  });
});

describe('AEMPS', () => {
  const lista = extraerMedicamentos(fx('aemps/alertas-medicamentos-uso-humano.html'));

  it('encuentra el JSON incrustado', () => {
    expect(lista.length).toBeGreaterThan(300);
  });

  it('falla de forma visible si desaparece la variable', () => {
    expect(() => extraerMedicamentos('<html></html>')).toThrow(/normalizedData/);
  });

  it('normaliza el formato actual', () => {
    const a = normalizarMedicamento(lista[0]);
    expect(a.referenciaOficial).toBe('R_38/2026');
    expect(a.riesgo.nivelLiteral).toBe('Clase 2');
    expect(a.productos[0].lotes[0].numero).toBe('2461580');
    expect(a.productos[0].lotes[0].codigoNacional).toBe('768370');
    expect(a.fechas.publicacion).toBe('2026-10-26');
    valida(a);
  });

  it('acepta las 381 alertas, incluido el formato antiguo', () => {
    lista.forEach((m) => valida(normalizarMedicamento(m)));
  });

  it('saca el nombre de los títulos largos de cosméticos', () => {
    expect(nombreDeNota('La AEMPS informa del cese de comercialización, retirada del mercado y recuperación de varios lotes de productos de protección solar Parasol')).toBe('protección solar Parasol');
  });

  it('lee el listado y la nota de cosméticos', () => {
    const notas = parsearListaCosmeticos(fx('aemps/cosmeticos-2026.html'));
    expect(notas.length).toBeGreaterThan(10);
    expect(notas[0]).toMatchObject({ fecha: '2026-10-22', ref: 'COS, 22/2026' });
    const a = parsearNotaCosmetico(fx('aemps/cosmetico-agrado-spf50.html'), 'https://www.aemps.gob.es/informa/la-aemps-informa-agrado/');
    expect(a.referenciaOficial).toBe('COS, 07/2026');
    expect(a.fechas.publicacion).toBe('2026-04-09');
    expect(a.nombreVisible).toMatch(/agrado crema solar spf 50/i);
    expect(a.productos[0].lotes.map((l) => l.numero)).toContain('41997300');
    expect(a.hacer?.join(' ')).toMatch(/no la utilice/);
    valida(a);
  });
});

describe('Safety Gate', () => {
  it('conserva el parámetro search en las URLs de informe', () => {
    const l = parsearLista(fx('safety-gate/weekly-list.xml'));
    expect(l.length).toBeGreaterThan(1100);
    expect(l[0].url).toContain('language=es');
    expect(l[0].url).toContain('search=WEB_REPORT');
  });

  it('normaliza el informe actual', () => {
    const lista = parsearInforme(fx('safety-gate/weekly-10000330-es.xml'));
    expect(lista).toHaveLength(63);
    lista.forEach(valida);
    const a = lista.find((x) => x.idFuente === '10118629')!;
    expect(a.productos[0].ean).toEqual(['3418178586009']);
    expect(a.productos[0].marcas).toEqual(["Solei d'Ocre"]);
    expect(a.riesgo.nivelLiteral).toBe('Riesgo grave');
    expect(a.distribucion.paisNotificante).toBe('Luxemburgo');
  });

  it('separa EAN pegados en el XML', () => {
    const lista = parsearInforme(fx('safety-gate/weekly-10000330-es.xml'));
    expect(lista.some((a) => a.productos[0].ean.length >= 2)).toBe(true);
    lista.forEach((a) => a.productos[0].ean.forEach((e) => expect(e).toMatch(/^\d{8,14}$/)));
  });

  it('trata Unknown como dato ausente', () => {
    const lista = parsearInforme(fx('safety-gate/weekly-10000330-es.xml'));
    lista.forEach((a) => a.productos[0].lotes.forEach((l) => expect(l.numero).not.toMatch(/unknown/i)));
  });

  it('acepta informes antiguos e ids negativos', () => {
    const lista = parsearInforme(fx('safety-gate/weekly-2006-20-es.xml'));
    expect(lista.length).toBeGreaterThan(5);
    expect(lista[0].id).toMatch(/^safety-gate-n?\d+$/);
    lista.forEach(valida);
  });

  it('una alerta defectuosa no tira el informe y la fecha imposible usa la del informe', () => {
    const xml = fx('safety-gate/weekly-10000330-es.xml').replace('<publicationDate>03-11-2026</publicationDate>', '<publicationDate>31-11-2026</publicationDate>').replace('alertDetail/10118629', 'sin-id');
    const errores: string[] = [];
    const lista = parsearInforme(xml, errores);
    expect(lista.length).toBe(62);
    expect(errores).toHaveLength(1);
    expect(lista[0].fechas.publicacion).toBe('2026-11-06');
  });

  it('recupera las medidas pegadas', () => {
    const m = medidasDesdeXml('Tipo de operador económico que ha tomado la medida o las medidas notificadas: OtrosCategoría de medidas: Retirada del producto de manos de los usuarios finalesFecha de entrada en vigor: 13/05/2026Tipo de operador económico que ha tomado la medida o las medidas notificadas: OtrosCategoría de medidas: Retirada del producto del mercado onlineFecha de entrada en vigor: 08/05/2026');
    expect(m.map((x) => x.texto)).toEqual(['Retirada del producto de manos de los usuarios finales', 'Retirada del producto del mercado online']);
  });

  it('enriquece con el JSON: países detectados y arrays reales', () => {
    const base = parsearInforme(fx('safety-gate/weekly-10000330-es.xml')).find((x) => x.idFuente === '10118629')!;
    const j = JSON.parse(fx('safety-gate/notification-10118629-es.json'));
    const e = enriquecer({ ...base, slug: base.id } as Alerta, j);
    expect(e.procedencia.enriquecido).toBe(true);
    expect(e.productos[0].modelos.length).toBe(2);
    expect(e.fechas.modificacion).toBe('2026-11-04');
    const r = JSON.parse(fx('safety-gate/notification-con-reacciones.json'));
    expect(enriquecer({ ...base, slug: base.id } as Alerta, r).distribucion.paisesDetectado.length).toBeGreaterThan(0);
  });
});

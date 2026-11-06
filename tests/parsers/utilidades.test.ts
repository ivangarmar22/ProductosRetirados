import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsearRobots, rutaPermitida } from '../../pipeline/http.ts';
import { categoriaProducto, clavesDedup, extraerAlergenos, extraerCcaa, extraerEan, fechaIso, fechaLarga, fechaMadrid, gtinValido, marcaClave, nombreLimpio, slug, tiposRiesgo, urlValida } from '../../pipeline/normalizar.ts';

describe('robots.txt reales', () => {
  const aemps = parsearRobots(readFileSync('fixtures/_robots/aemps.txt', 'utf8'));
  it('bloquea los feeds y wp-json de AEMPS', () => {
    expect(rutaPermitida(aemps, '/feed/')).toBe(false);
    expect(rutaPermitida(aemps, '/wp-json/oembed/1.0/')).toBe(false);
    expect(rutaPermitida(aemps, '/?s=lote')).toBe(false);
  });
  it('permite las páginas de alertas de AEMPS', () => {
    expect(rutaPermitida(aemps, '/comunicacion/alertas/')).toBe(true);
    expect(rutaPermitida(aemps, '/informa/la-aemps-informa-de-algo/')).toBe(true);
  });
  it('AESAN lo permite todo', () => {
    expect(rutaPermitida(parsearRobots(readFileSync('fixtures/_robots/aesan.txt', 'utf8')), '/alertas/2026_80')).toBe(true);
  });
  it('la regla más larga gana', () => {
    const r = parsearRobots('User-agent: *\nDisallow: /a\nAllow: /a/b');
    expect(rutaPermitida(r, '/a/b/c')).toBe(true);
    expect(rutaPermitida(r, '/a/x')).toBe(false);
  });
  it('sigue el grupo de nuestro bot si existe', () => {
    const r = parsearRobots('User-agent: *\nAllow: /\n\nUser-agent: ProductosRetiradosBot\nDisallow: /');
    expect(rutaPermitida(r, '/x')).toBe(false);
  });
});

describe('normalización', () => {
  it('fechas', () => {
    expect(fechaIso('04/11/2026')).toBe('2026-11-04');
    expect(fechaIso('03-11-2026')).toBe('2026-11-03');
    expect(fechaIso('sin fecha')).toBeNull();
    expect(fechaIso('31/06/2026')).toBeNull();
    expect(fechaIso('30/02/2026')).toBeNull();
    expect(fechaLarga('Fecha de publicación: 09 de abril de 2026')).toBe('2026-04-09');
    expect(fechaMadrid(1793027866000)).toBe('2026-10-26');
  });
  it('rechaza URLs de retirada que son texto libre', () => {
    expect(urlValida('https://fr.aliexpress.com')).toBe('https://fr.aliexpress.com/');
    expect(urlValida('www.ejemplo.com aviso')).toBeNull();
    expect(urlValida('ver web')).toBeNull();
  });
  it('nombres sin punto final y con mayúscula', () => {
    expect(nombreLimpio('complemento alimenticio.')).toBe('Complemento alimenticio');
  });
  it('categorías que antes caían en Otros', () => {
    expect(categoriaProducto('Guirnaldas luminosas')).toBe('electricos');
    expect(categoriaProducto('Artículos de pirotecnia')).toBe('ocio');
  });
  it('slug sin tildes', () => {
    expect(slug('Jamón cocido URKABE')).toBe('jamon-cocido-urkabe');
  });
  it('GTIN', () => {
    expect(gtinValido('3418178586009')).toBe(true);
    expect(gtinValido('3418178586008')).toBe(false);
  });
  it('separa EAN pegados solo si todos son válidos', () => {
    expect(extraerEan('50553004097755055300409782')).toEqual(['5055300409775', '5055300409782']);
    expect(extraerEan('1234')).toEqual([]);
    expect(extraerEan(null)).toEqual([]);
  });
  it('CCAA y alérgenos', () => {
    expect(extraerCcaa('Castilla y León, Madrid, Navarra y País Vasco')).toEqual(['Castilla y León', 'Madrid', 'Navarra', 'País Vasco']);
    expect(extraerAlergenos('almendra y huevo no declarados')).toEqual(['Huevo', 'Frutos secos']);
  });
  it('marcas comparables entre fuentes', () => {
    expect(marcaClave('Fiestas Guirca SL')).toBe(marcaClave('FIESTAS GUIRCA'));
    expect(marcaClave('Mile')).toBe(marcaClave('MILE'));
  });
  it('los duplicados reales comparten clave marca + modelo', () => {
    const sg = clavesDedup('SR/03097/26', [{ marcas: ['Mile'], modelos: ['MSMR00215'], lotes: [], ean: ['6923292231812'] }]);
    const consumo = clavesDedup('160/2026', [{ marcas: ['MILE'], modelos: ['MSMR00215'], lotes: [{ numero: '2022-09' }], ean: [] }]);
    expect(sg.filter((k) => consumo.includes(k))).toEqual(['mm:mile:msmr00215']);
  });
  it('tipos de riesgo', () => {
    expect(tiposRiesgo('Listeria monocytogenes')).toEqual(['microbiologico']);
    expect(tiposRiesgo('nada conocido')).toEqual(['otros']);
  });
});

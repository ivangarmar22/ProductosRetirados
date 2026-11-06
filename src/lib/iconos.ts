/** Nombres del sprite public/iconos.svg. Sin dependencias: lo usan tanto el servidor como el navegador. */
export const ICONO_CATEGORIA: Record<string, string> = {
  alimentos: 'orange', complementos: 'leaf', medicamentos: 'pill', cosmeticos: 'sparkle', juguetes: 'puzzle-piece', electricos: 'plug',
  infantil: 'baby', vehiculos: 'car', moda: 't-shirt', ocio: 'bicycle', hogar: 'hammer', otros: 'package',
};

/** Forma distinta por nivel: el riesgo no depende solo del color. */
export const ICONO_NIVEL: Record<string, string> = { grave: 'warning', general: 'warning-circle', alergeno: 'grains-slash', clase: 'pill', sin: 'info' };


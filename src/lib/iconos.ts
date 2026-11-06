/** Nombres del sprite public/iconos.svg. Sin dependencias: lo usan tanto el servidor como el navegador. */
export const ICONO_CATEGORIA: Record<string, string> = {
  alimentos: 'apple', complementos: 'leaf', medicamentos: 'pill', cosmeticos: 'sparkles', juguetes: 'toy-brick', electricos: 'plug',
  infantil: 'baby', vehiculos: 'car', moda: 'shirt', ocio: 'bike', hogar: 'hammer', otros: 'package',
};

/** Forma distinta por nivel: el riesgo no depende solo del color. */
export const ICONO_NIVEL: Record<string, string> = { grave: 'triangle-alert', general: 'circle-alert', alergeno: 'wheat-off', clase: 'pill', sin: 'info' };

export const ILUSTRACION_CATEGORIA: Record<string, string> = {
  alimentos: 'alimentos', complementos: 'medicamentos', medicamentos: 'medicamentos', cosmeticos: 'cosmeticos', juguetes: 'juguetes',
  electricos: 'electricos', infantil: 'infantil', vehiculos: 'vehiculos', ocio: 'juguetes', hogar: 'cable', moda: 'caja', otros: 'caja',
};

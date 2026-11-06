# Fase 2: propuesta

Pendiente de tu validación. La arquitectura técnica está en [`arquitectura.md`](arquitectura.md).

## 1. Logo

Los tres conceptos de esta fase se descartaron y se borraron. El logo definitivo es la cesta con alerta, en `public/marca/`.

**1. La barra fuera (mi recomendación).** Un código de barras al que se le ha retirado una barra: la imagen literal del servicio. Es el más reconocible sin texto y sigue legible a 16 px.

**2. La tilde.** La tilde roja de ESTÁ es lo único que se sale de la línea: un aviso discreto y muy español. Isotipo sobre etiqueta oscura.

**3. La pregunta.** El nombre es una pregunta y el signo de apertura es exclusivo de nuestro idioma. Es el más cercano, pero el dominio no lleva signos, y eso obliga a mantener dos formas del nombre.

Marcas sin verificar en OEPM y EUIPO. Conviene hacerlo antes de registrar nada.

## 2. Ilustraciones isométricas

Terminadas para validar el estilo, en [`ilustraciones/`](ilustraciones/): `hero-envase.svg` (2,8 KB) y `estante-hueco.svg` (5,2 KB).

Reglas: proyección a 30°, colores planos de los tokens, sin trazo, luz desde arriba a la izquierda, sombra proyectada opaca y objetivo de menos de 15 KB.

| Escena | Dónde va | Estado |
|---|---|---|
| Envase con lote y código de barras | Inicio, imagen Open Graph | Terminada |
| Estante con un hueco marcado | 404, sin resultados | Terminada |
| Lupa sobre una etiqueta | Cabecera del buscador, guía "dónde está el lote" | Pendiente |
| Lata y brik | Categoría alimentos | Pendiente |
| Blíster y caja | Categoría medicamentos | Pendiente |
| Tubo y frasco | Categoría cosméticos | Pendiente |
| Cubos y peluche | Categoría juguetes | Pendiente |
| Cargador y enchufe | Categoría eléctricos | Pendiente |
| Biberón y chupete | Categoría infantil | Pendiente |
| Coche pequeño | Categoría vehículos | Pendiente |
| Plato con ingredientes | Alérgenos, Mis alergias | Pendiente |
| Mostrador de devolución | Guía "Qué hacer si tienes un producto retirado" | Pendiente |
| Archivador con fichas | Fuentes y metodología | Pendiente |
| Buzón con sobre | Avisos | Pendiente |
| Cable desenchufado | Error de carga, estado de fuentes | Pendiente |
| Caja vacía | Estado vacío de listados y de Mis alergias | Pendiente |

Son decorativas (`aria-hidden`) y nunca sustituyen al dato. En móvil no aparecen antes del listado. Sin animación en la v1.

## 3. Mapa del sitio

URLs en español y estables. El slug de cada alerta se fija la primera vez y no cambia aunque cambie el título.

```
/                                   Inicio
/alertas/                           Listado y buscador
/alertas/pagina/2/                  Paginación rastreable
/alerta/jamon-cocido-urkabe-aesan-2026-80/   Ficha
/categorias/                        Índice
/categoria/alimentos/               Categoría
/alergenos/                         Índice
/alergeno/huevo/                    Alérgeno
/marcas/                            Índice
/marca/urkabe/                      Marca
/mis-alergias/                      Preferencias locales
/avisos/                            Telegram, newsletter y RSS
/guias/que-hacer-producto-retirado/ Guía
/guias/donde-esta-el-lote/          Guía
/fuentes/                           Fuentes y metodología
/estado/                            Salud de cada fuente
/estadisticas/                      Por mes, categoría, motivo y origen
/sobre/                             Sobre el proyecto
/apoya/                             Donaciones
/aviso-legal/  /privacidad/  /cookies/  /accesibilidad/
/404.html
/rss.xml  /rss/categoria/<slug>.xml  /rss/alergeno/<slug>.xml
/sitemap-index.xml  /robots.txt
```

Las páginas de marca solo se generan con 2 o más alertas, para no llenar el sitio de páginas pobres.

## 4. Wireframes

Abre [`wireframes.html`](wireframes.html): listado, sin resultados, ficha, Mis alergias, Avisos y Apoya.

Tres decisiones de contenido que conviene que mires:

- **Sin resultados** nunca dice que el producto sea seguro: "No consta ninguna alerta. Esto no significa que el producto sea seguro."
- **Las alertas de Safety Gate** llevan el aviso de que no consta si se han vendido en España.
- **Las ampliaciones** se agrupan en un historial dentro de la ficha original. Cada una sigue enlazando a su página oficial.

## 5. Correo a Consumo

Borrador en [`correo-consumo.md`](correo-consumo.md). Lo envías tú.

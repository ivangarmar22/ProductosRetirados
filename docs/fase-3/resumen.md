# Fase 3: qué se ha construido

Estado a 06/11/2026. Todo está en local, sin commits, a la espera de revisión.

## Cifras

| Medida | Resultado |
|---|---|
| Alertas | 22.335 (Safety Gate 21.720, medicamentos 381, AESAN 182, cosméticos 52) |
| Páginas | 24.796 |
| Tamaño del sitio | 247 MB (límite de Pages: 1 GB) |
| Compilación completa en local | Unos 2 minutos y 15 segundos |
| Ilustraciones | 16 escenas, 69 KB en total |

## Pruebas

| Prueba | Resultado |
|---|---|
| Tests de parsers con fixtures reales | 40 de 40 |
| Comprobación de 15 páginas a 360, 390, 768, 1024, 1280 y 1440 px | 90 de 90, sin scroll horizontal y con objetivos táctiles de 44 px |
| Flujos con Playwright, en móvil, tablet y escritorio | 61 correctos; 2 omitidos por ser solo de móvil |
| axe (WCAG 2.2 AA) en 9 tipos de página | Sin incidencias |
| Lighthouse móvil en 7 páginas | 100 en las 4 categorías |

Lighthouse se ejecutó sobre un servidor local. Los valores en GitHub Pages pueden variar.

## Cambios respecto al plan

- **Datos en la rama `datos`.** Estaba previsto versionarlos en `main`, pero son más de 22.000 ficheros. `data/` queda ignorada y `main` solo tiene código.
- **Sin Preact.** El buscador y los filtros son TypeScript sin framework: una dependencia menos.
- **Newsletter sin envío automático.** El plan gratuito de MailerLite no envía por API. Hay un feed semanal en `/rss/semanal.xml`, y por eso no existe `newsletter.yml`.
- **Escáner aplazado.** Su primer criterio exige probarlo en iPhone y Android reales.
- **Safety Gate desde 2020**, y aun así el sitio ocupa la mitad de lo estimado.
- **Inicio con dos bloques.** Safety Gate publica unas 60 alertas semanales frente a 2 o 3 de AESAN: mezcladas, las españolas desaparecerían.
- **Datos estructurados:** `Article` y `BreadcrumbList`. schema.org no tiene un tipo para retiradas.

## Hallazgos durante la construcción

- **Pagefind devuelve resultados sin relación.** Si no encuentra una palabra, la recorta: "xqzjwv" daba "XQ Fresh". Se añadió una verificación propia: los códigos con dígitos deben coincidir enteros, así que `61028` nunca encuentra el lote `61027`.
- **EAN pegados** en el XML de Safety Gate, mezclando EAN-13 y UPC de 12 dígitos. Se separan validando el dígito de control.
- **Fechas imposibles** en las fuentes (31/06). Se tratan como dato ausente.
- **"Todos los lotes"** no es un código, pero es información crítica: se conserva como texto literal.

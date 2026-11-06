# Arquitectura técnica

Propuesta de la Fase 2. Lo que cambió al construirlo está en [`../fase-3/resumen.md`](../fase-3/resumen.md).

## 1. Stack y dependencias

| Paquete | Para qué |
|---|---|
| `astro` | Generador del sitio |
| `pagefind` | Búsqueda e índice estático, con filtros |
| `preact` y `@astrojs/preact` | Solo las islas de buscador y filtros, como en LeyAnimal |
| `node-html-parser` o similar | Parsear AESAN y cosméticos (se elige en Fase 3) |
| `fast-xml-parser` o similar | XML de Safety Gate |
| `ajv` y `ajv-formats` | Validar contra el esquema |
| `barcode-detector` | Escáner, cargado solo al pulsar. Sujeto a la sección 7 |
| `vitest`, `@playwright/test`, `@axe-core/playwright` | Tests |
| `svgo` | Optimizar SVG |

Sin Tailwind: CSS propio con tokens, como en los bocetos. Fuentes autoalojadas: Sofia Sans Extra Condensed, IBM Plex Sans y Mono. Node 26 LTS en CI.

## 2. Estructura del repositorio

```
.github/workflows/      actualizar.yml  ci.yml  newsletter.yml
data/
  alertas/<fuente>/<id>.json   Una alerta normalizada por fichero
  estado/fuentes.json          Salud de cada fuente
  estado/notificados.json      Alertas ya avisadas
docs/                   Informes de cada fase
fixtures/               Respuestas reales para tests
pipeline/
  fuentes/              aesan.ts  aemps-medicamentos.ts  aemps-cosmeticos.ts  safety-gate.ts  consumo.ts (desactivada)
  http.ts               Cliente: robots.txt, pausas, reintentos, User-Agent
  normalizar/           Marcas, alérgenos, CCAA, fechas
  dedup.ts  validar.ts  ejecutar.ts
  avisos/               telegram.ts  newsletter.ts
schema/alerta.schema.json
src/
  componentes/  islas/  layouts/  pages/  estilos/tokens.css  lib/
public/                 CNAME  logo  ilustraciones  fuentes
tests/                  parsers/  e2e/
```

## 3. Pipeline de datos

```
Por cada fuente, de forma aislada:
  robots.txt → descargar novedades → parsear → normalizar → validar
       │ si falla: se conserva el último dato bueno y se registra en estado/fuentes.json
       ▼
Unir: deduplicar, agrupar ampliaciones, enlazar relacionadas
       ▼
¿Hay cambios? ── no ──▶ fin (solo actualiza estado)
       │ sí
       ▼
Commit a data/ → build de Astro → Pagefind → despliegue → Telegram
```

**Cómo se detectan novedades en cada fuente:**

| Fuente | Método |
|---|---|
| AESAN | `lastmod` del sitemap; solo descarga fichas nuevas o cambiadas |
| AEMPS medicamentos | Una petición; extrae `normalizedData` y compara por hash |
| AEMPS cosméticos | Listado anual; descarga notas nuevas |
| Safety Gate | Lista XML; informes nuevos en español. Enriquecimiento por JSON si está disponible; si falla, se queda con el XML oficial |
| Consumo | **Desactivada** hasta tener respuesta y `robots.txt` resuelto. Sin código de descarga en producción |

**Carga inicial de Safety Gate:** el XML son unas 350 peticiones desde 2020. El enriquecimiento JSON serían unas 24.000 (unas 13 horas con pausas de 2 s), así que se hace por tandas de unas 500 en cada ejecución, empezando por lo más reciente.

**Normas de respeto:** comprobación de `robots.txt` en cada ejecución, User-Agent `EstaRetiradoBot/1.0 (+https://estaretirado.es/fuentes/)`, pausas de al menos 2 s por dominio, lista blanca de campos. Las fuentes no envían `ETag`, por lo que se usa hash de contenido.

**Datos en el repositorio:** se versionan en una rama propia, `datos`, y `data/` está ignorada en `main`. Dan historial real de cambios sin mezclarse con el código.

## 4. Workflows

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `actualizar.yml` | `cron: 17 */3 * * *` y manual | Pipeline completo. Concurrencia 1, sin cancelar |
| `ci.yml` | Pull requests y push | Tests de parsers, tipos, build, Playwright, axe, Lighthouse |
| `newsletter.yml` | Semanal | Resumen de la semana por MailerLite |

Despliegue con `upload-pages-artifact` y `deploy-pages`, como LeyAnimal. Los avisos son idempotentes: `notificados.json` evita repetir un mensaje si se relanza.

**Secrets necesarios:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, `MAILERLITE_API_KEY`. Variables: `PUBLIC_SITE_URL`.

## 5. Búsqueda y filtros

- **Pagefind** indexa las fichas con `data-pagefind-filter` para fuente, categoría, riesgo, alérgeno, CCAA, fecha y marca. Su API admite filtrar sin término de búsqueda y devuelve contadores.
- **Corrector propio:** un `vocabulario.json` con marcas y productos, cargado al no haber resultados. Sugiere por distancia de edición.
- **Estado en la URL:** todo filtro se refleja en la query string.
- **Sin JavaScript:** páginas de listado, categoría y paginación siguen funcionando como HTML.

**Pendiente de prueba en Fase 3:** la ordenación por fecha en Pagefind y el peso de sus índices con datos reales.

## 6. Presupuesto de rendimiento

| Recurso | Límite |
|---|---|
| Ficha: JavaScript | 0 KB salvo menú y compartir, si hacen falta (< 3 KB) |
| Listado: JavaScript propio | < 30 KB con gzip, sin contar Pagefind |
| CSS total | < 20 KB con gzip |
| Fuentes | 2 ficheros en carga inicial, con `preload` del titular |
| HTML por ficha | < 15 KB sin comprimir |
| Ilustración | < 15 KB |
| LCP / CLS / INP en móvil | < 2,0 s / < 0,05 / < 200 ms |
| Lighthouse móvil | ≥ 95 en las 4 categorías, en inicio, listado y ficha |
| Sitio publicado | < 700 MB, con alerta en CI (límite 1 GB) |

## 7. Escáner: criterios para incluirlo

Solo entra en la v1 si cumple todo esto; si no, queda para después.

1. Lee EAN-13 en Chrome Android y en Safari iOS en **dispositivos reales**. Esta prueba necesita tu móvil.
2. Motor alojado por nosotros y cargado solo al pulsar el botón, sin afectar a Lighthouse.
3. Si la cámara no está disponible o se deniega, hay alternativa clara para escribir el código.
4. Con cero resultados, muestra el aviso de que no significa que sea seguro y lleva a buscar por marca y lote.

## 8. Riesgos y puntos sin verificar

| Riesgo | Plan |
|---|---|
| **MailerLite:** no he podido confirmar su API de campañas, el formulario sin cookies ni el RSS a correo en el plan gratuito | Comprobarlo en su documentación al empezar la Fase 3. Si el formulario añade cookies, habrá que reflejarlo en `/cookies/` |
| **Tamaño del artefacto de Pages:** la cuota de almacenamiento de artefactos del plan gratuito y el timeout de 10 minutos pueden chocar con unos 500 MB | Medir en el primer despliegue real. Retención de 1 día. Si falla, recortar el histórico (es un parámetro) |
| **APIs no documentadas** (AEMPS, JSON de Safety Gate) | Tests de contrato con fixtures, degradación al XML y aviso en `/estado/` |
| **Datos estructurados:** falta decidir el tipo de schema.org | Investigarlo en Fase 3, sin inventar tipos |
| **Minutos de Actions** en repos públicos | Sin verificar. Vigilar en las primeras semanas |
| **Google Analytics** futuro | Exigirá banner de consentimiento y revisar privacidad y cookies |

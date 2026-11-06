# Fixtures

Respuestas reales de las fuentes, descargadas el 06/11/2026 con un User-Agent identificable y pausas entre peticiones. Son la base de los tests de parsers en Fase 3. El análisis está en [docs/fase-0/informe.md](../docs/fase-0/informe.md).

No se editan a mano: si una fuente cambia, se añade un fixture nuevo con fecha.

| Carpeta | Contenido |
|---|---|
| `_robots/` | `robots.txt` de cada dominio. Falta `servicios.consumo.gob.es`, que no respondió |
| `_legal/` | Avisos legales y ficha del dataset de Safety Gate en data.europa.eu |
| `aesan/` | Listados, sitemap y fichas: normal (`2026_80`), alérgenos (`2026_77`), complemento (`2026_78`), ampliación (`2026_33_ampliacion_6`) y corrección (`2025_56_Correc`) |
| `aemps/` | Medicamentos con JSON incrustado, muestra de 10 alertas, productos sanitarios (`alertasps-p1.json`), cosméticos y veterinarios |
| `consumo/` | Páginas de dsca.gob.es, el 403 de la ruta antigua y respuestas de `rapnaBEPublic` |
| `safety-gate/` | Lista de informes, informes semanales en XML (2006, 2022 y 2026) y fichas JSON |

## Ficheros de referencia para tests

| Caso | Fichero |
|---|---|
| Ficha AESAN con lista etiquetada | `aesan/alerta-2026_80.html` |
| Ficha AESAN sin lista | `aesan/alerta-2026_78.html` |
| Ampliación con muchos productos | `aesan/alerta-2026_33_ampliacion_6.html` |
| JSON incrustado de medicamentos | `aemps/alertas-medicamentos-uso-humano.html` |
| Nota de cosmético en prosa | `aemps/cosmetico-agrado-spf50.html` |
| Ficha de Consumo completa | `consumo/rapna-detalle-84321.json` |
| Notificaciones antiguas de Consumo | `consumo/rapna-antiguas-p0.json` |
| Safety Gate con reacciones de países | `safety-gate/notification-con-reacciones.json` |
| Safety Gate sin reacciones | `safety-gate/notification-10118629-es.json` |
| XML de formato antiguo | `safety-gate/weekly-2006-20-es.xml` |

`safety-gate/muestra-45-reacting.json` guarda la muestra usada para medir países de detección.

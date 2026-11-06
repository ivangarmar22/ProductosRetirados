# Fase 0: informe de investigación

Fecha de las comprobaciones: 06/11/2026. Las cifras salen de peticiones reales guardadas en [`/fixtures`](../../fixtures/README.md), salvo las marcadas como **estimación** o **sin verificar**.

## 1. Lo más importante

**Es viable y el dato es mejor de lo previsto.** Cuatro de las seis fuentes dan JSON o XML estructurado, y hay datos que ni el planteamiento inicial contemplaba. Pero seis puntos cambian el proyecto:

| # | Hallazgo | Consecuencia |
|---|---|---|
| 1 | **"Filtrar lo que afecte a España" no es fiable en Safety Gate.** El XML no trae países de detección. El JSON sí (`reactingCountries`), pero en una muestra de 45 alertas España no reacciona en ninguna y notifica en 2. | Hay que decidir cómo presentar estas alertas (Fase 1). No se puede afirmar "no afecta a España". |
| 2 | **AESAN solo publica desde 02/01/2025** (182 alertas). Las URLs antiguas `/AECOSAN/...` devuelven 200 pero muestran el listado general, y `/alertas/2023_05` da 404. | El histórico anterior solo está en Wayback Machine (562 URLs capturadas), sin enlace oficial vivo. |
| 3 | **El RSS de AEMPS no se puede usar:** `robots.txt` bloquea `/feed*/`. No lo he pedido. | Mejor así: el listado de medicamentos lleva **todo el JSON incrustado** en el HTML, y productos sanitarios tiene su propio JSON. |
| 4 | **La Red de Alerta de Consumo se ha movido** a `servicios.consumo.gob.es/rapnaPublic`, con 1.494 + 9.703 notificaciones. La ruta antigua de dsca.gob.es da 403. | Es una fuente muy rica, pero su API no está documentada, su `robots.txt` no responde y **su aviso legal no menciona la reutilización**. |
| 5 | **El límite real es 1 GB de GitHub Pages.** Todo el histórico serían unas 65.000 fichas (**estimación**): unos 975 MB solo de HTML a 15 KB por página, sin imágenes ni índice de búsqueda. | El histórico completo no cabe. Hay que recortar o no alojar imágenes. |
| 6 | **Sin `ETag` en las fuentes comprobadas.** Verificado por `HEAD` en AESAN, AEMPS, productos sanitarios y Safety Gate. En la API de Consumo no lo he comprobado. | La detección de cambios será por hash de contenido y, en AESAN, por `lastmod` del sitemap. |

### Premisas del encargo que hay que corregir

- **AEMPS "publica canales RSS":** `robots.txt` los bloquea. Solo he localizado un RSS manual del boletín trimestral; según un resultado de búsqueda, con entradas de 2017-2018 (no abierto).
- **Consumo en dsca.gob.es:** el listado ya no está ahí (ver hallazgo 4).
- **AESAN "información de empresas":** esa categoría ya no aparece. Hay 3 tipos de alerta.
- **Safety Gate "API JSON pública":** existe y funciona sin clave, pero **no está documentada** ni figura entre las distribuciones oficiales. El XML sí es el canal oficial.
- **food.gov.uk:** ahora redirige a `alerts.food.gov.uk`, que bloquea la lectura automatizada (ver 2.1).

---

## 2. Benchmark

### 2.1 Alcance real de la revisión

Todos los sitios siguen activos, así que no he sustituido ninguno. Tres no se pudieron leer directamente y no he insistido:

- **food.gov.uk:** 403. Uso su API oficial `data.food.gov.uk/food-alerts` (OGL 3; CSV, GeoJSON, JSON, RDF, TTL). Su interfaz queda **sin verificar**.
- **productsafety.gov.au:** 403. Solo tengo resultados de búsqueda; la ficha queda **sin verificar**.
- **Safety Gate:** es una SPA que no se renderiza sin navegador. Sus filtros y campos salen del código público y de la API, no de ver la interfaz.

### 2.2 Tabla comparativa

| Sitio | Cobertura | Búsqueda | Filtros | "Qué hacer" en ficha | Avisos | Datos abiertos |
|---|---|---|---|---|---|---|
| **RappelConso** (FR) | Alimentos y no alimentos | Caja de texto; EAN en web sin verificar | Árbol de categorías con contadores | Bloque propio, más "Compensación" | RSS general, por palabra clave y por categoría | Sí: CSV, JSON, Excel, API; licencia abierta; 19.197 registros |
| **Lebensmittelwarnung** (DE) | Alimentos, cosméticos, artículos de uso | Caja de texto; EAN no visto | Tipo, motivo, 16 estados, periodo | Bloque propio | RSS, boletín, app | Sin verificar |
| **FSA** (UK) | Alimentos | Sin verificar | Sin verificar | Sin verificar | Sin verificar | Sí: API, OGL 3 |
| **CPSC** (EE. UU.) | Productos de consumo | Sin texto libre visible | Fecha, peligro, categoría, país de fabricación | Campo "Remedy" tipificado | Email, RSS (sin verificar), app | Sí: API y CSV |
| **FDA** (EE. UU.) | Alimentos, fármacos, cosméticos, productos sanitarios… | Caja de texto | Tipo de producto, retirada finalizada | Dentro del comunicado | Email, RSS | XLSX |
| **Health Canada** | Alimentos, consumo, salud | Texto libre y facetas de marca y categoría | Facetas por URL | "What to do" arriba | Email diario o inmediato, **13 RSS de alérgenos** | Sí: CSV y JSON diarios |
| **ACCC** (AU) | Consumo (alimentos pasaron a FSANZ) | Sin verificar | Sin verificar | Sin verificar | Email y RSS por categoría (vía búsqueda) | Sin verificar |
| **Safety Gate** (UE) | No alimentario | Texto libre | Riesgo, categoría, país notificante, origen, año, fecha | "Medidas", pensado para autoridades | Informe semanal por email | Sí: XML y Excel |
| **AESAN** | Alimentos | Campo `search` en el HTML; alcance sin verificar | Tipo (3) y fechas | En prosa | **Ninguno** visto | No para alertas |
| **AEMPS** | Fármacos, sanitarios, cosméticos | Por texto en medicamentos | Solo por sección | En prosa | Listas de correo | No formal |
| **Consumo** | No alimentario | Identificador, producto, riesgo… | Categoría, CCAA, año, medida | Solo "medidas" | **Ninguno** visto | No formal |
| **OCU** | Selección editorial (591), mezclada con estafas | **Ninguna** | **Ninguno** | Bloque "¿Qué debes hacer?" | RSS general, boletín con cuenta | No |

**Otros referentes:**

- [OECD GlobalRecalls](https://www.oecd.org/en/blogs/2026/03/why-consumer-product-safety-matters-more-than-ever-in-a-global-and-digital-marketplace.html): más de 54.700 avisos de más de 50 jurisdicciones, pensado para reguladores.
- [UFC-Que Choisir](https://www.quechoisir.org/rub-produit-au-rappel-t647/): sección privada de retiradas en Francia, no analizada.
- [ALERT InfoCons](https://apps.apple.com/cy/app/alert-infocons/id6657974337): app europea de alertas no alimentarias, no probada.
- Varios *scrapers* de Safety Gate en [Apify](https://apify.com/itulo/eu-safety-gate-alerts) cruzan por EAN: hay demanda de ese dato.
- Sobre si Yuka u Open Food Facts avisan de retiradas no he encontrado nada: **sin verificar**.

### 2.3 Patrones de UI

**A copiar:**

- "What to do" en la parte alta de la ficha (Canadá).
- Compensación como campo propio (Francia, CPSC).
- Fechas de primera publicación y última actualización (Alemania).
- Filtro por región y lista de zonas afectadas (Alemania).
- Avisos por alérgeno (Canadá).
- Decir dónde mirar el lote o el modelo en el envase (Canadá).
- Categorías vacías sin enlace y con contadores (Francia).
- Cartel imprimible para tiendas (Francia).
- Badge de "lesiones notificadas" (CPSC).

**A evitar:**

- Listados de 1.920 páginas sin filtros visibles (Francia).
- Desplegables de cientos de opciones con duplicados (CPSC).
- 60 casillas sin agrupar en la suscripción (Canadá).
- Dato del producto escondido en prosa (AESAN, OCU, FDA).
- Mezclar retiradas con estafas (OCU).
- Campo de lote vacío junto a "Tous les lots" (Francia).

### 2.4 Funciones priorizadas

**Imprescindible**
- Búsqueda por marca, producto, lote y EAN, tolerante a tildes y erratas.
- Ficha con "qué hacer" arriba, datos estructurados y enlace a la fuente.
- Filtros por fuente, categoría, riesgo, alérgeno, CCAA y fecha, con estado en la URL.
- Fecha de publicación y de actualización, y estado de cada fuente.
- Ampliaciones agrupadas con su alerta original.
- RSS por categoría y por alérgeno.
- Aviso de que la web no es oficial; atribución por fuente.

**Deseable**
- "Mis alergias" en `localStorage`.
- Escáner de código de barras.
- Canal de Telegram.
- Páginas por marca, categoría y alérgeno.
- Estadísticas.
- Enlace "misma retirada en otra fuente".

**Futuro**
- Newsletter y push.
- Cartel imprimible.
- Datos abiertos propios.
- Lista personal de productos.
- Etiquetas tipificadas de compensación, solo si la fuente da el dato.

### 2.5 Cinco cosas que nadie hace bien

Afirmaciones limitadas a lo que he podido verificar:

1. **Una consulta para todo.** En España hay que mirar en 5 webs distintas. Ninguna une alimentos, fármacos, cosméticos y productos.
2. **Unir lo que cada fuente sabe por separado.** El peluche Mile aparece en Safety Gate con EAN y en Consumo con CCAA y lote, en registros sin relación entre sí (ver 4.2).
3. **Seguir la vida de una alerta.** La moringa de AESAN tiene al menos 7 páginas sueltas (`2026_33` y seis ampliaciones) y una de ellas lista 145 elementos. Nadie muestra qué lotes se añadieron en cada ampliación.
4. **Responder "¿es mi lote?".** En la mayoría de los sitios hay que leer y comparar a ojo. Podemos buscar por lote y decir qué coincide, sin afirmar nunca que un producto es seguro si no aparece.
5. **Alérgenos sin registro.** El 41 % de las alertas de AESAN (74 de 182) son de alérgenos, pero es un único cajón sin filtro por alérgeno. Canadá lo resuelve con feeds; nadie lo hace además en local, sin cuenta.

---

## 3. Auditoría de datos

### 3.1 Resumen

| | AESAN | AEMPS medicamentos | AEMPS sanitarios | AEMPS cosméticos | Consumo | Safety Gate |
|---|---|---|---|---|---|---|
| **Formato** | HTML | JSON incrustado | JSON | HTML | JSON | XML y JSON |
| **Documentado** | n/a | No | No | n/a | No | XML sí, JSON no |
| **Registros** | 182 | 381 | 5.940 | 15 enlaces en 2026 | 1.494 + 9.703 | ~47.000 (**estimación**) |
| **Desde** | 02/01/2025 | 2016 | 28/02/2019 | Selector desde 1999 (sin verificar) | Antiguas: sin verificar | 2005 |
| **Ritmo** | ~2,3 por semana | ~3 al mes | ~50 al mes | ~1,5 al mes | Lotes irregulares; 169 en 2026 | Semanal, viernes |
| **robots.txt** | Permite | Permite (no `/feed*/`, `/*wp-json*`, `/?s=`) | 404 (sin reglas) | Permite | **No responde** | No restringe |
| **Reutilización** | Autorizada | Autorizada | Autorizada | Autorizada | **Sin cláusula** | CC0 / CC BY 4.0 |
| **Producto** | Sí (texto) | Sí | Sí | Prosa | Sí (cadena) | Sí |
| **Marca** | Sí (texto) | No aplica | En el texto | Prosa | Sí (cadena) | 51 de 63 |
| **Lote** | Sí (texto) | Sí, si existe | En PDF | Prosa | A veces (cadena) | 14 de 63 |
| **EAN** | 3 de 27 | No (código nacional) | En PDF | No visto | **No** | 32 de 63 |
| **Fecha límite** | Sí (texto) | Sí | No | Prosa | No | No |
| **Foto** | Sí (PNG) | No | No | Sin verificar | Sí (base64) | Sí (PNG) |
| **Nivel de riesgo** | No | Clase 1-3 | Código 1A, 2A… | No | No | Grave / otros |
| **Distribución** | CCAA (texto) | Canal | No | No | **Solo CCAA notificante** | Países |
| **Origen** | En título | No | Fabricante | No | No | Sí |

Las proporciones "de 63" son de un informe semanal (2026-44). "De 27" es una muestra de fichas de AESAN.

### 3.2 AESAN

- **URLs:** `/alertas/buscador-alertas[/N]` (10 páginas), `/alertas/{slug}`, `/sitemap.xml`. `robots.txt` lo permite todo y declara el sitemap.
- **Tipos:** población general 90, alérgenos 74, complementos 17, otro icono 1.
- **Referencia:** `ES2026/665` está en el título. Las ampliaciones y correcciones **conservan la referencia** de la original (22 de 27 fichas la traen con ese formato).
- **Regularidad (27 fichas):** 25 tienen lista con etiquetas. Las 2 sin lista son complementos alimenticios.
- **Fotos:** en las 27.

**Problemas reales:**
- 23 variantes de etiqueta, por ejemplo `número de lote`, `números de lote`, `número de lotes`, `lotes y fecha de consumo preferente`, `fecha de caducidad/lote`, y erratas como `teperatura`.
- Slugs inconsistentes: `2025_13_Amp`, `2025_48_amp`, `2026_33_ampliacion`, `2026_38_Ampliacion`, `2025_56_Correc`.
- `2026_52_Ampliacion_1` sale sin categoría (`undefined`).
- Títulos con `<br/>` en el listado.
- Un `HEAD` a una imagen devuelve `application/pdf`; `GET` da el PNG correcto. Hay que usar `GET`.
- Las URLs viejas responden **200 con otro contenido**: no sirven para comprobar si una página existe.
- Fotos pesadas (390 KB en el ejemplo).

### 3.3 AEMPS

**Medicamentos**
- El HTML lleva `const normalizedData = [...]` con 381 alertas. La más reciente es del 26/10/2026, aunque la página dice "Actualización: 15 de julio de 2026": esa fecha no es fiable.
- Clases de defecto: 97 de clase 1, 264 de clase 2, 20 de clase 3.
- **Dos formatos en el mismo array:** 199 registros de 2016-2021 ("Sustancia activa") tienen el detalle en `defect` en prosa y `manufacturer` vacío. 452 de 729 productos no traen lotes.
- `cn` es el número de registro; el código nacional real va en `lots[].nationalCodePresentation`.
- Según la propia AEMPS, estas alertas van dirigidas sobre todo a distribución y farmacias. Solo algunas llegan a nivel de paciente.
- Si un cambio de web quita la variable, se pierde la fuente de golpe: pide test de contrato.

**Productos sanitarios**
- `alertasps.aemps.es/alertasps/alertas` devuelve JSON con `Accept: application/json` (o sin cabecera) y HTML para el navegador. Admite `page` y `pageSize` (100 verificado).
- Campos: `id`, `fechaPublicada`, `asunto`, `producto`, `categoria`, `fabricante`, `nalerta`, `tipo`, `documentos`. PDFs en `documentos/{id}`.
- Los lotes están en los PDF, no en campos.
- **Mayoría de uso profesional:** catéteres, diagnóstico in vitro, implantes activos. 99 de los últimos 100 son `2A`; el significado de los códigos queda **sin verificar**.

**Cosméticos**
- Notas en HTML dentro de `/informa/...`, listadas en `/comunicacion/notas-informativas-cosmeticos-y-cuidado-personal/?fec=AAAA&cat=46`. Referencia del tipo `COS, 07/2026`.
- Todo en prosa, aunque son redacciones muy repetitivas y suelen ser de interés para el consumidor.

**Veterinarios**
- La página existe, pero el HTML de 2025 no muestra alertas. **Sin verificar**; lo dejaría fuera de la v1.

### 3.4 Consumo

**Endpoints observados en el código público de la aplicación:**

| Método | Ruta bajo `rapnaBEPublic/listadoPublico` | Uso |
|---|---|---|
| POST | `/notificacion` | Listado: `{pageNumber, pageSize, sortBy, sortOrder}` y filtros |
| GET | `/notificacion/{id}` | Ficha |
| POST | `/notificacionAntigua` | Anteriores al 31/03/2022 |
| POST | `/fichero` | Imagen en base64 |
| GET | `/categoria`, `/organoActuante` | Catálogos (44 categorías) |

- **Campos públicos útiles:** `identificador`, `fechaPublicacion`, `categoria.nombre`, `organoActuante.nombre`, `nombrePublicacionWeb`, `peligroPublicacionWeb`, `textoPublicacionWeb`, `medidasPublicacionWeb`, `imagenFichaWeb`.
- **Antiguas:** `identificador`, `fechaAlta`, `nombre`, `documento` (PDF), `imagen`, `categoria`, `organoActuante`.
- **La marca, referencia y lote van en una cadena:** `OSO DE PELUCHE, marca MILE, ref. MSMR00215, lote 2022-09`. Es un patrón muy regular y fácil de parsear.

**Problemas reales:**
- **`robots.txt` agotó el tiempo en 2 intentos** (90 s y 25 s). No prohíbe ni autoriza; la norma RFC 9309 pide asumir que no se puede rastrear si el fichero es inaccesible. Aun así hice unas 25 llamadas a la API con pausas de 3 s, para cumplir el encargo de verificar con peticiones reales: abrir el listado, 14 fichas, 4 búsquedas por marca, catálogos, una imagen y un listado completo de identificadores. **No se debe automatizar esta fuente hasta resolverlo.** Ver decisión en 6.
- **Sin cláusula de reutilización** en el aviso legal, que sí exige no sugerir respaldo del Ministerio al enlazar.
- **Retraso real:** `162/2026` tiene `fechaPublicacion` 07/10/2026 pero se publica en web el 03/11/2026. La semántica exacta de cada fecha no está documentada.
- 17 fechas de publicación en lo que va de 2026, muy agrupadas.
- La ficha no trae EAN: `codigosBarras` llega vacío.
- La CCAA es **quien notifica, no dónde se vendió**. Mostrarla como distribución sería un error.
- Imágenes solo por POST en base64: **no se pueden enlazar**. Hay que copiarlas, y eso requiere permiso claro.
- El DTO tiene decenas de campos internos a `null` (por ejemplo `personaContacto`). El parser debe usar **lista blanca**.
- Servidor lento: respuestas de varios segundos.
- Los enlaces directos a cada ficha (`public/notificacion/{id}`) salen de una ruta del código; **sin verificar** que abran bien en navegador.

### 3.5 Safety Gate

- **Oficial:** `api/download/weeklyReport/list/xml/en` lista 1.123 informes, de 2005 a hoy. Hay que usar la URL exacta de cada informe: **sin el parámetro `search` da 400**. Cambiar a `language=es` funciona.
- **No documentado:** `public/api/notification/{id}?language=es`, abierto, sin clave. La búsqueda POST dio 405 y no la he investigado, porque no hace falta.
- **El JSON añade:** arrays reales de marcas, lotes y EAN, fechas ISO, `modificationDate`, medidas estructuradas y `reactingCountries`.
- **XML semanal 2026-44:** 63 alertas, 62 de riesgo grave, 59 para consumidores y 4 para profesionales.

**Países en la muestra de 45 alertas (15 de cada informe 2026-20, 2025-20 y 2022-20):**

| Informe | Con reacciones | España notifica | España reacciona |
|---|---|---|---|
| 2026-20 | 3 | 0 | 0 |
| 2025-20 | 5 | 2 | 0 |
| 2022-20 | 8 | 0 | 0 |

Muestra pequeña: indica una tendencia, no una tasa exacta. La ausencia de España **no prueba** que el producto no se vendiera aquí.

**Evolución (un informe a mitad de cada año):**

| Años | Alertas por semana | Con EAN | Con lote |
|---|---|---|---|
| 2005-2010 | 14-32 | 0-5 | 0 |
| 2011-2019 | 23-50 | **0** | 10-27 |
| 2020-2022 | 34-60 | 19-25 | 5-17 |
| 2023-2026 | 55-98 | 45-71 | 22-50 |

- **Estimación por extrapolación:** ~47.000 alertas en total, ~24.000 desde 2020. Baja precisión: una semana por año.
- **El EAN solo es útil desde 2020.** El dato de 2011-2019 puede deberse a dónde se guardaba el código y no a que no existiera; no lo he investigado.

**Problemas reales:**
- En el XML, `measures` viene concatenado sin separadores ("…: OtrosCategoría de medidas:…"). En el JSON está bien.
- Fechas `dd/mm/aaaa` en la lista y `dd-mm-aaaa` en el detalle.
- Referencias incoherentes: `Report-2026-44`, `Report-2011-022`.
- El nombre del producto sigue en su idioma original ("Nappe Rectangulaire…"), aunque el resto esté en español.
- Alertas antiguas con **id negativo** (`-11119`); si su JSON funciona está **sin verificar**.
- En 2026-44 solo 7 alertas traen URL de retirada.
- Fotos PNG de unos 270 KB.

### 3.6 Licencias

No es asesoramiento jurídico. Conviene revisarlo antes de publicar.

| Fuente | Texto real | Condiciones | Imágenes |
|---|---|---|---|
| **AESAN** | Reutilización autorizada "para usos comerciales y no comerciales" | No desnaturalizar, citar la fuente, mencionar la fecha de última actualización | No se excluyen expresamente, pero logos y marcas sí están protegidos. **Dudoso** |
| **AEMPS** | "Se autoriza la reproducción total o parcial… siempre que se cite expresamente su origen" | Citar origen y fecha de actualización | Igual: **dudoso** |
| **Consumo** | **Nada** sobre reutilización | Enlazar sin sugerir relación ni respaldo | **Sin autorización clara** |
| **Safety Gate** | [data.europa.eu](https://data.europa.eu/data/datasets/rapex-rapid-alert-system-non-food): XML y Excel **CC0**; web, aviso de reutilización de la Comisión | Reconocer la fuente. [CC BY 4.0](https://commission.europa.eu/legal-notice_en) por defecto para contenido de la UE | Pueden requerir permisos de terceros. El JSON no figura como distribución. **Dudoso** |

La ley general de reutilización (Ley 37/2007) podría cubrir a Consumo, pero **no he verificado** su texto vigente ni su aplicación. Lo prudente es escribir a Consumo.

Las fotos de producto incluyen marcas de terceros. Mi recomendación provisional para la v1 es enlazar a la fuente y no copiar imágenes hasta confirmar la licencia, aunque en Consumo esto implica no tener foto. Lo decidimos en Fase 1.

### 3.7 Límites de GitHub (documentación actual)

| Recurso | Límite |
|---|---|
| Sitio publicado | **1 GB** |
| Ancho de banda | 100 GB al mes (límite blando) |
| Despliegue | Timeout de 10 minutos |
| Builds | 10 por hora (blando); **no aplica** con workflow propio de Actions |
| Repositorio | Recomendado < 1 GB; muy recomendado < 5 GB |
| Fichero | Bloqueo a partir de 100 MiB; aviso a partir de 50 MiB |
| Job de Actions | 6 horas |
| Caché de Actions | 10 GB por repositorio |
| Artefactos (almacenamiento) | Plan Free: 500 MB |
| Cron | Mínimo cada 5 minutos |
| Fiabilidad del cron | Puede retrasarse; con mucha carga "some queued jobs may be dropped". Evitar el minuto 0 |
| Inactividad | En repos públicos se desactiva tras 60 días sin actividad |
| Releases | Sin límite de tamaño total publicado |

Fuentes: [Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [eventos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [Actions](https://docs.github.com/en/actions/reference/limits), [ficheros](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github), [condiciones](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features).

**Dos riesgos a tener en cuenta:**

- **Publicidad:** las condiciones permiten expresamente "donation buttons and crowdfunding links", y prohíben sitios dirigidos sobre todo a transacciones comerciales. **No mencionan la publicidad.** AdSense queda en zona gris y habría que revisarlo antes de activarlo.
- **Minutos de Actions en repos públicos:** no aparecen en la página de límites que he leído. **Sin verificar.**

---

## 4. Esquema normalizado y deduplicación

### 4.1 Esquema

- Esquema: [`alerta.schema.json`](alerta.schema.json).
- Ejemplos reales de las 5 fuentes con API o ficha revisada: [`ejemplos-normalizados.json`](ejemplos-normalizados.json). **Los 5 validan** con Ajv 8.20.0 (instalado solo en una carpeta temporal, no en el proyecto).
- No hay ejemplo de cosméticos: el esquema lo admite, pero necesita parser de prosa.

**Reglas de diseño:**

- Solo campos observados. Lo que no existe es `null` o `[]`.
- Texto literal y valor normalizado por separado (`categoria.literal`, `riesgo.nivelLiteral`): nunca se pierde la redacción oficial.
- `recomendacion` es siempre literal. No redactamos consejos de salud.
- `autoridadNotificante` y `distribucion.ccaa` son campos distintos, para no confundir quién avisa con dónde se vendió.
- `procedencia.extraccion` indica si el dato viene de un campo o de interpretar prosa, para poder avisarlo en la ficha.
- El `id` deriva solo de fuente e identificador, así la URL no cambia si cambia el título.

### 4.2 Duplicados reales

Cruce de las 4 alertas notificadas por España en los informes 2026-44, 2026-20, 2025-20 y 2022-20 con Consumo:

| Safety Gate | Consumo | Resultado |
|---|---|---|
| `SR/03097/26` Mile, MSMR00215, EAN 6923292231812 | `160/2026` OSO DE PELUCHE, marca MILE, ref. MSMR00215, lote 2022-09 | **Mismo producto.** Sin EAN común: casa por marca y modelo |
| `SR/01832/25` FERRO TOOLS, 02351, EAN 8445542023513 | `73/2025` CINTA DE AMARRE, marca FERRO TOOLS, ref. 02351 | **Mismo producto.** Consumo se publicó antes (26/03 frente a 15/05) |
| `SR/01841/25` BEBISANA, refs. 255 y 260 | `264/2024` CHUPETE, marca BEBISANA, ref. 260, lote 01022 | **Solo relacionado:** coincide la referencia, pero hay 6 meses de diferencia y no se puede confirmar el lote |
| `SR/03108/26` Fiestas Guirca SL, 26634 | Sin resultados buscando por esa marca | No concluyente: el nombre legal de la empresa puede no coincidir con la marca |

**Conclusiones:**

- **El EAN no basta**, porque Consumo no lo publica. La clave útil entre ambas es marca + modelo normalizados.
- Hay que normalizar marcas (`Mile`/`MILE`, `Fiestas Guirca SL`).
- No se debe fusionar a ciegas: el caso Bebisana parece igual y puede no serlo.
- No he medido duplicados entre AEMPS cosméticos y Safety Gate, ni entre AESAN y AEMPS. **Sin verificar.**

### 4.3 Clave propuesta

| Nivel | Clave | Uso |
|---|---|---|
| Dentro de una fuente | `ref:<referencia>` | Agrupa alerta, ampliaciones y correcciones. Verificado en AESAN |
| Entre fuentes, fuerte | `ean:<gtin>` | Candidato de alta confianza |
| Entre fuentes, fuerte | `mm:<marca>:<modelo>` | Casó en los 2 duplicados reales |
| Entre fuentes, media | `ml:<marca>:<lote>` | Candidato |
| Nunca por sí solo | Nombre de producto | Demasiados falsos positivos |

Una coincidencia crea un **candidato**, no una fusión. Recomiendo mantener una página por alerta oficial, para no perder la trazabilidad con la fuente, y enlazar entre sí las relacionadas.

---

## 5. Limitaciones de este informe

- Las muestras son pequeñas (45 alertas, 27 fichas, 22 informes). Los totales de Safety Gate y el tamaño del sitio son estimaciones.
- El benchmark se apoya en lectura automatizada de páginas: no he usado los sitios en un navegador real, así que el comportamiento en móvil y las interacciones no están evaluados.
- Búsqueda por EAN en los sitios extranjeros: mayoritariamente sin verificar.
- Las APIs no documentadas pueden cambiar sin aviso. Afecta a AEMPS sanitarios, al JSON de Safety Gate, a Consumo y a la variable incrustada de medicamentos.
- No he abierto ningún PDF de alerta de AEMPS ni de Consumo para evaluar su contenido.

## 6. Decisiones que aparecen para la Fase 1

1. **Safety Gate y España:** ¿mostrar todas las alertas con un aviso claro, solo las vinculadas a España, o solo las que tengan EAN?
2. **Consumo:** ¿escribimos al Ministerio antes de lanzar? Afecta a `robots.txt`, reutilización e imágenes.
3. **Imágenes:** ¿copiar y optimizar, enlazar a la fuente o no mostrar?
4. **Histórico:** ¿desde qué año, dado el límite de 1 GB? ¿Recuperamos AESAN anterior a 2025 desde Wayback?
5. **Productos sanitarios:** ¿los incluimos? Son 5.940 alertas, sobre todo de uso profesional.
6. **Publicidad en GitHub Pages:** ¿aceptamos la zona gris o preparamos otro alojamiento para cuando llegue?

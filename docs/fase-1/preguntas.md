# Fase 1: decisiones

Comprobado el 06/11/2026. Responde por bloques, por ejemplo `1A, 2A, 3.1 sí…`. Mi recomendación va marcada con **(rec.)**.

Bocetos: abre [`direcciones/index.html`](direcciones/index.html) en un navegador. Las capturas están en [`direcciones/capturas/`](direcciones/capturas/).

---

## 1. Stack

Prueba real: la misma ficha con el mismo JSON, sin caché. AMD Ryzen 7 5800X, Node 24, una ejecución por caso. Scripts y resultados en [`benchmark/`](benchmark/).

| 20.000 fichas | Astro 7.4.7 | Angular 22.2 (`outputMode: static`) | Next 16.4.5 (`output: export`) |
|---|---|---|---|
| Build | **19,5 s** | 43,5 s | 85,2 s |
| Tamaño de salida | **33 MB** | 53 MB | 494 MB |
| Ficheros | **20.000** | 20.004 | 100.021 |
| Ficha | **2,0 KB** | 2,9 KB | 9,5 KB |
| Scripts en la ficha | **0** | 1 | 6 |
| JS total generado | **0 KB** | 239 KB | 557 KB |
| 5.000 fichas | 7,1 s | 14,9 s | 26,8 s |

**Límites de la prueba:** la ficha es mínima (unos 2 KB, sin diseño), así que las páginas reales pesarán más y tardarán más en todos los casos. Los runners de GitHub son más lentos que esta máquina: no lo he medido. La comparación entre stacks sí es válida. Lo que no medí es Lighthouse ni el tiempo de un build incremental.

| Opción | A favor | En contra |
|---|---|---|
| **A. Astro (rec.)** | 0 JS por defecto: la vía más fácil al ≥95 en Lighthouse. Build más rápido. Componentes de React si hacen falta para filtros | Otro framework que aprender, aunque se aprende rápido |
| **B. Angular** | Tu stack. Salida ligera | Hidrata toda la app: 239 KB generados solo para mostrar texto, y los datos se duplicarían en el cliente para hidratar |
| **C. Next** | Tu stack, ecosistema enorme | Unos 25 KB por ficha y 5 ficheros por ruta. Con todo el histórico (65.000) serían unos 1,6 GB: **no cabe en Pages** |

Node: LTS vigente **v26.13.0** ("Lithium"). Astro 7 exige ≥22.23.4, así que encaja.

## 2. Búsqueda

Prueba real de Pagefind 1.6.0 con las 20.000 fichas: índice de 87 MB y 20.169 ficheros, 25 s de indexado, 16-28 ms por consulta en caliente y 159 KB transferidos en una sesión de 13 consultas.

| Consulta | Resultado |
|---|---|
| `jamon cocido` (sin tilde) | Encuentra |
| `61027` (lote) y `3418178586009` (EAN) | Encuentra |
| `msmr` (prefijo de `MSMR00215`) | Encuentra |
| `lysteria`, `urkave` (erratas) | **0 resultados** |

**Pagefind no tolera erratas**, y lo pediste expresamente. Los datos de prueba repiten texto, así que el índice real será mayor.

- **A. Pagefind y un corrector propio (rec.):** un vocabulario de marcas y productos en un JSON pequeño propone "¿Querías decir…?". Sin dependencias nuevas.
- **B. MiniSearch 7.2.0:** búsqueda difusa nativa, pero hay que descargar el índice entero en el móvil. Tamaño sin medir.

## 3. Alcance de la v1

**3.1 Fuentes**

| Fuente | Alertas | Propuesta |
|---|---|---|
| AESAN | 182 | Sí |
| AEMPS medicamentos | 381 | Sí |
| AEMPS cosméticos | ~15 al año | Sí |
| Safety Gate | ~47.000 (estimación) | Sí, ver 3.2 y 3.3 |
| Consumo | 1.494 + 9.703 | Según 3.4 |
| AEMPS productos sanitarios | 5.940 | **No** en v1: mayoría de uso profesional, lotes en PDF |
| AEMPS veterinarios | Sin verificar | **No** en v1 |

**3.2 Histórico de Safety Gate.** Cálculo con 15 KB por ficha e índice proporcional a la prueba; son estimaciones.

| Opción | Fichas totales | Tamaño aproximado |
|---|---|---|
| **A. Desde 2023 (rec.)** | ~18.000 | ~350 MB |
| B. Desde 2020 | ~26.000 | ~500 MB |
| C. Todo, desde 2005 | ~65.000 | ~1,25 GB: **supera el límite** |

Recomiendo 2023 porque es cuando el EAN pasa a ser habitual, y deja sitio para crecer unos años.

**3.3 Safety Gate y España.** No se puede saber si un producto llegó a España: en 45 alertas, España notifica 2 y nunca reacciona.

- **A. Todas, con aviso (rec.):** "Alerta europea. No consta si se ha vendido en España". Si alguien tiene el producto, lo encuentra. Muchas se compran online.
- **B. Solo las vinculadas a España:** coherente, pero se pierde casi todo.
- **C. Solo las que tengan EAN o lote:** reduce ruido, pero pierde alertas válidas.

**3.4 Consumo.** Su `robots.txt` no responde y su aviso legal no menciona la reutilización.

- **A. Escribir al Ministerio y lanzar sin esta fuente hasta tener respuesta (rec.):** sin riesgo. Te redacto el correo; lo enviarías tú.
- **B. Incluirla ya con ritmo muy bajo:** más completo, pero va contra tu regla de respetar `robots.txt`.
- **C. Solo enlazar a su buscador:** sin datos propios.

**3.5 Imágenes.** Licencia dudosa y unos 270-390 KB cada una.

- **A. No mostrarlas en v1, solo enlace a la fuente (rec.):** sin riesgo legal y mucho más ligero. Pierde reconocimiento visual del producto.
- **B. Copiar y optimizar las de AESAN y AEMPS:** su aviso legal lo permite en general, aunque las marcas de terceros siguen siendo dudosas.
- **C. Enlazar directamente a las imágenes de la fuente:** frágil y expone a tus visitantes a terceros.

**3.6 AESAN anterior a 2025.** ¿Recuperamos unas 330 páginas de 2018-2024 desde Wayback Machine? El enlace oficial ya no existe. **No en v1 (rec.)**: sin fuente viva no podemos cumplir "enlace siempre a la fuente".

**3.7 Frecuencia de actualización**

- **A. Cada 3 horas, en un minuto impar (rec.):** suficiente para un ritmo de ~2,3 alertas por semana en AESAN y respetuoso con los servidores. El cron de GitHub puede retrasarse.
- **B. Cada hora:** más inmediato, más carga.
- **C. Dos veces al día:** mínimo.

## 4. Contenido

**4.1 "Destacar las graves".** AESAN y Consumo **no publican nivel de riesgo**. Solo lo hacen Safety Gate y AEMPS.

- **A. Mostrar solo la etiqueta oficial de cada fuente y destacar por recencia y tipo (rec.):** es lo que ves en los bocetos. No inventamos gravedad.
- **B. Crear una escala propia** (por ejemplo, Listeria = alto): mejor jerarquía, pero sería una valoración sanitaria nuestra, con responsabilidad.

**4.2 "Qué hacer"**

- **A. Resumen claro con enlace y aviso "resumen del texto oficial" (rec.):** es lo que ves en los bocetos. Se entiende mejor, pero requiere extracción cuidadosa y revisar plantillas.
- **B. Solo texto literal:** cero riesgo de distorsión, peor lectura. AESAN prohíbe desnaturalizar el contenido, y eso obliga a que A sea muy fiel.

## 5. Nombre

`.com` comprobado por RDAP (fiable). `.es` **sin verificar**: no hay RDAP público y el WHOIS no respondió; "sin NS" solo es un indicio, confírmalo en un registrador. Riesgo de marcas en OEPM y EUIPO: **pendiente de verificar en todos**.

| Nombre | Por qué | .es (indicio) | .com |
|---|---|---|---|
| **Retirado (rec.)** | Una palabra, lo que busca la gente. Ojo: también significa "jubilado" | Sin NS | Ocupado (2004) |
| **Está Retirado** | La pregunta exacta. Sirve como redirección de la anterior | Sin NS | Libre |
| **Mismo Lote** | Memorable, va al grano de la comprobación | Sin NS | Libre |
| **Hay Alerta** | Corto, se entiende y se dice bien | Sin NS | Libre |
| **Fuera de Venta** | Describe el estado del producto | Sin NS | Libre |
| **Compruebalote** | Imperativo, dice lo que hace la web | Sin NS | Libre |
| **Mirolote** | Oral y breve, suena a gesto cotidiano | Sin NS | Libre |
| **Lote Fuera** | Rotundo, con ritmo | Sin NS | Libre |
| **Ojo Cesta** | Cercano, muy español. Suena solo a alimentación | Sin NS | Libre |
| **Fuera del Estante** | Editorial, encaja con la dirección A. Largo | Sin NS | Libre |
| **Cazalote** | Simpático, transmite menos seriedad | Sin NS | Libre |

Descartados: *Alertas Consumo* (parece oficial) y *Cesta Segura* (promete seguridad que no podemos garantizar).

## 6. Dirección visual

- **A. Boletín:** periódico de referencia. Newsreader + Public Sans. Sobria y densa.
- **B. Etiqueta (rec.):** sale del envase, con el lote en monoespaciada y un panel tipo información nutricional. Sofia Sans Extra Condensed + IBM Plex. Es la más propia y encaja con "el dato primero".
- **C. Señal:** señalética con pictogramas y buscador fijo abajo en móvil, útil con una mano. Bricolage Grotesque + Atkinson Hyperlegible Next. La más cercana.

Las tres pasan axe sin incidencias, sin scroll horizontal a 360, 390, 768, 1024, 1280 y 1440 px, y con ilustraciones de 2,9 a 10,9 KB. Se pueden mezclar, por ejemplo B con el buscador fijo de C.

**Modo oscuro:** no en v1 (rec.). Duplica el trabajo de ilustración y no es clave para una consulta puntual. Los tokens quedarían listos.

## 7. Avisos

| Canal | Datos verificados | Propuesta |
|---|---|---|
| RSS/Atom | Sin coste, estático | **Sí** |
| Telegram | Hasta 4.096 caracteres por mensaje; requiere token como secret | **Sí** (rec.) |
| Newsletter | MailerLite gratis: 250 suscriptores, 2.500 correos al mes, datos en la UE; RSS a correo sin verificar. Buttondown: 100 gratis, RSS +9 $/mes | Después |
| Push | OneSignal gratis, máx. 10.000 por envío. En iOS exige instalar la web en la pantalla de inicio (16.4+) | Después |

Si quieres Telegram, necesito que crees el bot con @BotFather y el canal. El token nunca me lo pases por chat: va en los secrets del repositorio.

## 8. Escáner de código de barras

**Compatibilidad real (caniuse):** `BarcodeDetector` funciona en Chrome Android y Samsung Internet. En **Safari iOS está desactivado por defecto** (hasta 27.2) y en Firefox no existe. En iOS hace falta WebAssembly.

**Librería:** `barcode-detector` 3.2.3 (MIT, ZXing en WebAssembly, activa). Motor: 925 KB, 401 KB con gzip, cargado solo al pulsar el botón. Hay que alojarlo nosotros: por defecto lo descarga de jsDelivr. Descarto `html5-qrcode` (sin versiones desde 2023).

**El problema real es la cobertura de datos:** solo 3 de 27 fichas de AESAN citan EAN y Consumo no lo publica. Escanear un alimento casi nunca encontraría su alerta, y un "no consta" daría una falsa tranquilidad.

- **A. Dejarlo para después de la v1 (rec.):** primero búsqueda por marca y lote.
- **B. Incluirlo con aviso muy visible:** es llamativo, pero con riesgo de falsa seguridad.

## 9. Analítica

- **A. GoatCounter (rec.):** gratis para "uso público razonable", sin cookies. Su propia web dice que *probablemente* no requiere consentimiento (es su opinión, no asesoramiento legal).
- **B. Cloudflare Web Analytics:** gratis, sin cookies, muy básica.
- **C. Umami Hobby:** 100.000 eventos al mes, 6 meses de retención, sin cookies.
- **D. Ninguna:** cero riesgo y cero datos.
- **E. Google Analytics:** exige banner de consentimiento y perjudica el rendimiento. Lo desaconsejo.

## 10. Monetización

**10.1 Donaciones**

| Plataforma | Comisión | Pros y contras |
|---|---|---|
| **Buy Me a Coffee (rec.)** | 5 % | Tarjeta, Apple Pay y Google Pay: fácil para cualquiera. España sin verificar (44 países) |
| GitHub Sponsors | 0 % en cuentas personales | España confirmada. Exige cuenta de GitHub: poco apta para el público general |
| Liberapay | Sin comisión propia; procesador ~3 % (Stripe) o ~5,1 % (PayPal) | Abierta y sin ánimo de lucro. España sin verificar |
| Ko-fi | Sin verificar (su web bloqueó la lectura) | |

**10.2 Publicidad.** Las condiciones de GitHub Pages permiten donaciones, pero no mencionan la publicidad.

- **A. Reservar ahora solo el espacio en la retícula, sin CMP ni script (rec.):** evita el CLS futuro y no añade peso. La revisión legal de AdSense y el consentimiento se hacen cuando llegue.
- **B. No reservar nada:** rediseño posterior.
- **C. Preparar también la CMP:** peso y complejidad sin ingresos todavía.

## 11. Legal y dominio

Necesito para el aviso legal: **titular** (nombre o razón social), **NIF**, **dirección** y **correo de contacto**. Con donaciones o publicidad puede considerarse actividad económica y la LSSI pide más datos. Si no quieres publicar tu domicilio, conviene consultarlo con un profesional. Recomiendo un correo específico del proyecto.

**Dominio:** ¿lo compras tú y usamos CNAME (rec.), o publicamos en `usuario.github.io` de momento? Para SEO conviene el dominio propio desde el primer día.

## 12. Repositorio

- ¿Repo **público** (rec.; da transparencia)? En públicos el cron se desactiva tras 60 días sin actividad, lo que tendremos en cuenta al diseñar el pipeline. Los minutos de Actions en repos públicos siguen sin verificar.
- ¿En qué cuenta de GitHub?
- ¿Licencia del código? **MIT (rec.)** para el código, y datos con la licencia de cada fuente.

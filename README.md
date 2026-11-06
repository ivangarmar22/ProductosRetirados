<p align="center">
  <a href="https://ivangarmar22.github.io/ProductosRetirados/">
    <img src="public/marca/logo@2x.png" alt="Productos Retirados" width="380">
  </a>
</p>

<h3 align="center">¿Está retirado? Compruébalo en segundos.</h3>

<p align="center">
  Todas las alertas oficiales de productos en España, en un solo buscador.<br>
  Alimentos, medicamentos, cosméticos, juguetes y más. Gratis, sin cuentas y sin publicidad.
</p>

<p align="center">
  <a href="https://github.com/ivangarmar22/ProductosRetirados/actions/workflows/actualizar.yml"><img src="https://img.shields.io/github/actions/workflow/status/ivangarmar22/ProductosRetirados/actualizar.yml?style=flat-square&label=datos" alt="Estado de la actualización"></a>
  <img src="https://img.shields.io/badge/Astro-7-ff5a3c?style=flat-square&logo=astro&logoColor=white" alt="Astro 7">
  <img src="https://img.shields.io/badge/TypeScript-7-2c5bd0?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 7">
  <img src="https://img.shields.io/badge/búsqueda-Pagefind-19c3a6?style=flat-square" alt="Pagefind">
  <img src="https://img.shields.io/badge/sitio-100%25%20estático-ffbe2e?style=flat-square" alt="Sitio 100 % estático">
  <img src="https://img.shields.io/badge/WCAG-2.2%20AA-16213a?style=flat-square" alt="Objetivo WCAG 2.2 AA">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-MIT-16213a?style=flat-square" alt="Licencia MIT"></a>
</p>

<p align="center">
  <a href="https://ivangarmar22.github.io/ProductosRetirados/"><b>Abrir la web</b></a> ·
  <a href="https://ivangarmar22.github.io/ProductosRetirados/comprobar/">Comprobar un producto</a> ·
  <a href="https://ivangarmar22.github.io/ProductosRetirados/avisos/">Recibir avisos</a> ·
  <a href="#colabora">Colabora</a>
</p>

<p align="center">
  <img src="docs/assets/portada.webp" alt="Portada de Productos Retirados: titular ¿Está retirado?, el buscador y una cinta de supermercado animada" width="900">
</p>

## Qué es

En España, las alertas de productos están repartidas entre varios organismos. Para saber si algo que tienes en casa está retirado hay que saber a quién preguntar y buscar en cada web.

**Productos Retirados** las reúne en un solo sitio: escribes la marca, el producto, el lote o el código de barras y ves si hay alguna alerta, qué hacer y el enlace a la fuente oficial.

> [!IMPORTANT]
> No es un servicio oficial y no evalúa productos: reúne lo que publican las autoridades. **Que un producto no aparezca no significa que sea seguro.** La información con validez es siempre la de la fuente oficial, enlazada en cada ficha.

## Qué ofrece

| | Función | Para qué sirve |
|---|---|---|
| 🔎 | **Buscador con sugerencias** | Marca, producto, lote o EAN, con resultados mientras escribes y corrección de erratas |
| ✅ | **Comprobador en tres pasos** | Tipo de producto, marca o lote, y resultado. Sin registros |
| 📷 | **Fotos del producto** | Las que publican AESAN y Safety Gate, en un visor dentro de la ficha |
| 🏷️ | **¿Es tu lote?** | Escribe tu lote en la ficha y comprueba al momento si coincide |
| 🥜 | **Por alérgeno** | Los 14 alérgenos de declaración obligatoria, con su RSS |
| 🗺️ | **Mapa por comunidad** | Alertas alimentarias por comunidad autónoma y distribución de cada alerta |
| 🔔 | **Avisos** | Telegram, newsletter y RSS general, por categoría y por alérgeno |
| 📊 | **Estadísticas** | Evolución mensual, categorías, riesgos y países de origen |
| 📤 | **Compartir** | Por WhatsApp o copiando el enlace, para avisar a la familia |
| ♿ | **Accesible** | Teclado completo, foco visible, animaciones que se pueden pausar y sin depender del color |

## En cifras

| | |
|---|---|
| **22.335** | alertas publicadas en el buscador |
| **21.720** | de Safety Gate, desde 2020 |
| **381** | de medicamentos de la AEMPS, desde 2016 |
| **182** | de AESAN, desde 2025 |
| **52** | de cosméticos de la AEMPS, desde 2020 |
| **24.798** | páginas estáticas generadas |
| **8** | comprobaciones de las fuentes al día |
| **0** | cookies propias, cuentas, anuncios y servidores propios |

<sub>Datos del 06/11/2026. Las cifras actualizadas están en la página de <a href="https://ivangarmar22.github.io/ProductosRetirados/estado/">estado de las fuentes</a>.</sub>

## Capturas

<table>
  <tr>
    <td width="50%"><img src="docs/assets/ficha.webp" alt="Ficha de una alerta con el comprobador de lote y los datos del producto"><br><sub>Ficha con «¿Es tu lote?» y qué hacer</sub></td>
    <td width="50%"><img src="docs/assets/listado.webp" alt="Listado de alertas con buscador y filtros"><br><sub>Listado con filtros combinables</sub></td>
  </tr>
  <tr>
    <td><img src="docs/assets/comprobador.webp" alt="Comprobador guiado en tres pasos"><br><sub>Comprobador guiado</sub></td>
    <td><img src="docs/assets/mapa.webp" alt="Mapa de alertas por comunidad autónoma"><br><sub>Mapa por comunidad</sub></td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/movil.webp" alt="Portada en móvil" width="260">
  &nbsp;&nbsp;
  <img src="docs/assets/movil-ficha.webp" alt="Ficha en móvil con un lote que coincide" width="260">
</p>

## Cómo funciona

No hay backend ni base de datos. GitHub Actions descarga las fuentes cada 3 horas, guarda los datos en la rama `datos` y publica una web estática.

```mermaid
flowchart LR
  A[AESAN] --> P
  B[AEMPS medicamentos] --> P
  C[AEMPS cosméticos] --> P
  D[Safety Gate] --> P
  P[Pipeline<br/>Node + TypeScript] --> R[(Rama datos<br/>JSON por alerta)]
  R --> W[Astro<br/>páginas estáticas]
  W --> F[Pagefind<br/>índice de búsqueda]
  F --> G[GitHub Pages]
  P --> T[Canal de Telegram]
  W --> S[RSS]
```

- **Cada fuente va aislada.** Si una falla, conserva su último dato bueno y el fallo se ve en `/estado/`.
- **Scraping respetuoso.** Cumple `robots.txt`, se identifica, espacia las peticiones y guarda caché.
- **Sin inventar nada.** Se muestra solo la gravedad que publica cada fuente y se avisa cuando un dato se ha extraído de texto libre.
- **La búsqueda no engaña.** Pagefind recorta las palabras que no encuentra, así que cada resultado se verifica: un lote casi igual nunca devuelve otro producto.

## Tecnología

| Parte | Elección |
|---|---|
| Web | [Astro](https://astro.build) 7, salida estática |
| Búsqueda | [Pagefind](https://pagefind.app), en el navegador |
| Datos | Node 24+ con TypeScript nativo, [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser), [node-html-parser](https://github.com/taoqf/node-html-parser) y [Ajv](https://ajv.js.org) |
| Pruebas | [Vitest](https://vitest.dev), [Playwright](https://playwright.dev) y [axe](https://github.com/dequelabs/axe-core) |
| Publicación | GitHub Actions y GitHub Pages |
| Diseño | CSS propio, [Figtree](https://github.com/erikdkennedy/figtree), iconos de [Phosphor](https://phosphoricons.com) y mapa de [Natural Earth](https://www.naturalearthdata.com) |

Calidad medida en local el 06/11/2026: Lighthouse móvil 100 en las cuatro categorías en inicio, listado, categoría, apoyo y tres tipos de ficha; 44 tests de parsers; 41 flujos e2e en móvil, tablet y escritorio; axe sin incidencias, y sin desbordes a 360, 390, 768, 1024, 1280 y 1440 px.

## Desarrollo

Requiere Node 24 o superior.

```bash
npm ci
npm run pipeline     # descarga los datos en data/
npm run build        # compila dist/ y genera el índice de búsqueda
npm run dev          # http://localhost:4321
```

La búsqueda necesita el índice de Pagefind, así que solo funciona después de `npm run build`.

<details>
<summary><b>Comandos</b></summary>

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila la web y el índice de Pagefind |
| `npm run preview` | Sirve la compilación |
| `npm run pipeline` | Descarga y normaliza las fuentes |
| `npm run avisos` | Publica las alertas nuevas en Telegram |
| `npm run tipos` | Comprueba los tipos |
| `npm test` | Tests de parsers con fixtures reales |
| `npm run e2e` | Flujos clave y accesibilidad sobre `dist/` |
| `npm run verificar` | Tipos y tests de parsers |

</details>

<details>
<summary><b>Variables de entorno</b></summary>

Copia `.env.example` a `.env`. Es un sitio estático: aquí no hay secretos.

| Variable | Para qué sirve |
|---|---|
| `PUBLIC_SITE_URL` | URL pública, con subcarpeta si la hay |
| `PUBLIC_TELEGRAM_URL` | Enlace al canal. Si falta, la web dice «muy pronto» |
| `PUBLIC_NEWSLETTER_URL` | Formulario alojado de MailerLite. Si falta, la web dice «muy pronto» |

En GitHub, `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHANNEL_ID` van como secrets del repositorio.

</details>

<details>
<summary><b>Estructura</b></summary>

```text
pipeline/        Descarga, normalización y avisos
  fuentes/       Un parser por fuente
schema/          Esquema JSON de una alerta
src/
  componentes/   Piezas de Astro
  layouts/       Cabecera, pie y navegación
  lib/           Datos, formato y configuración del sitio
  pages/         Rutas, RSS y sitemap
  scripts/       Buscador, comprobador, desplegables, mapa y efectos
  estilos/       Un único CSS con los tokens de diseño
public/          Marca e iconos
tests/           Parsers y flujos e2e
fixtures/        Páginas reales para los tests
docs/            Investigación, decisiones y lanzamiento
```

</details>

## Despliegue

1. En **Settings → Pages**, elige **GitHub Actions** como origen.
2. Lanza **Actualizar y publicar** desde la pestaña Actions. Después se ejecuta solo cada 3 horas.
3. La web queda en `https://ivangarmar22.github.io/ProductosRetirados/`.

Para pasar a un dominio propio, apunta el DNS a GitHub Pages y define la variable de repositorio `PUBLIC_SITE_URL` con la nueva URL: el `CNAME` se genera solo. La lista completa está en la [guía de lanzamiento](docs/fase-4/lanzamiento.md).

## Limitaciones conocidas

- **Consumo no está incluido.** Sus alertas nacionales esperan a que el Ministerio confirme las condiciones de reutilización.
- **AESAN empieza en 2025**, porque la agencia no mantiene publicadas las anteriores.
- **Safety Gate no siempre indica dónde se vendió un producto.** Se muestran todas las alertas y se avisa cuando no consta su relación con España.
- **Parte de los datos se extrae de texto libre** y puede contener errores. La ficha lo indica.
- **Muchas alertas no publican el código de barras:** si no aparece, hay que buscar por marca o lote.
- **El buscador y el comprobador necesitan JavaScript.** Sin él sigue disponible el listado completo.

## Colaborar

- ¿Has visto un error en una alerta? [Abre una incidencia](https://github.com/ivangarmar22/ProductosRetirados/issues) o escribe a estaretirado@gmail.com.
- ¿Conoces otra fuente oficial con condiciones de reutilización claras? Cuéntalo en una incidencia.
- Para cambiar código, abre una pull request. `npm run verificar` y `npm run e2e` deben pasar.

## Colabora

Productos Retirados es gratuito y lo seguirá siendo. Con tu ayuda iremos mejorando la web e investigando mejores formas de encontrar avisos.

<table>
  <tr>
    <td align="center" width="50%">
      <b>Bizum</b><br><br>
      <code>652 308 536</code><br><br>
      <sub>Con el concepto «Productos Retirados»</sub>
    </td>
    <td align="center" width="50%">
      <a href="https://www.paypal.me/ivangarmar22"><img src="https://img.shields.io/badge/Donar%20con-PayPal-1d2533?style=for-the-badge&logo=paypal&logoColor=white" alt="Donar con PayPal"></a><br><br>
      <a href="https://www.paypal.me/ivangarmar22">paypal.me/ivangarmar22</a>
    </td>
  </tr>
</table>

Compartir la web con tu familia y avisar de errores ayuda tanto como un donativo.

## Licencias

| Contenido | Licencia |
|---|---|
| Código | [MIT](LICENSE) |
| Datos de AESAN | Reutilización autorizada citando la fuente y la fecha de actualización |
| Datos de la AEMPS | Reproducción autorizada citando su origen y la fecha de actualización |
| Datos de Safety Gate | © Unión Europea. Informes semanales CC0; el resto, CC BY 4.0 |
| Figtree | [SIL Open Font License](docs/licencias/) |
| Iconos de Phosphor | [MIT](docs/licencias/phosphor-MIT.txt) |
| Cartografía de Natural Earth | Dominio público |
| Logotipo | Propio del proyecto |

Las marcas citadas pertenecen a sus titulares. Las fotos de producto no se copian: se cargan desde la web oficial de cada fuente.

---

<p align="center">
  <sub>Hecho con cariño por <a href="https://github.com/ivangarmar22">ivangarmar22</a> para que nadie se entere tarde.</sub>
</p>

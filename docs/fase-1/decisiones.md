# Decisiones de la Fase 1

Aprobadas el 06/11/2026.

| Bloque | Decisión |
|---|---|
| Stack | Astro |
| Búsqueda | Pagefind y corrector propio de erratas |
| Fuentes v1 | AESAN, AEMPS medicamentos y cosméticos, Safety Gate |
| Fuera de v1 | AEMPS productos sanitarios y veterinarios |
| Histórico de Safety Gate | Desde 2020 (ver nota 1) |
| Safety Gate y España | Todas las alertas, con aviso "no consta si se ha vendido en España" |
| Consumo | Escribir al Ministerio; se lanza sin esta fuente hasta tener respuesta |
| Imágenes de producto | No en v1, solo enlace a la fuente |
| AESAN anterior a 2025 | No en v1 |
| Actualización | Cada 3 horas |
| Gravedad | Solo la etiqueta oficial de cada fuente |
| "Qué hacer" | Resumen claro con aviso y enlace |
| Nombre y dominio | **Nombre definitivo: ProductosRetirados** (sustituye a Está Retirado). Primero en GitHub Pages; dominio previsto, sin comprar: `productosretirados.es`, pendiente de confirmar |
| Dirección visual | **A Vitrina** (sustituye a B Etiqueta). Ver [prototipos](../fase-5/index.html) |
| Modo oscuro | Más adelante; tokens preparados |
| Avisos | RSS, Telegram y newsletter desde el lanzamiento |
| Newsletter | MailerLite |
| Logo | **Cesta con alerta**, con volumen y versiones de píxel para 16, 32 y 48 px |
| Escáner | Aplazado: su primer criterio exige probarlo en dispositivos reales (ver [arquitectura](../fase-2/arquitectura.md)) |
| Analítica | Google Analytics más adelante. **De momento, nada en la web** |
| Donaciones | Bizum y PayPal, como en LeyAnimal |
| Publicidad | Sin implementar. Hueco previsto en la retícula |
| Legal | Textos estándar sin nombre, NIF ni dirección |
| Contacto | `estaretirado@gmail.com` |
| Repositorio | `ivangarmar22/ProductosRetirados`, público |
| Licencia del código | MIT |

## Notas

1. **Histórico de Safety Gate:** recomendé 2023, pero pediste lo más completo posible. Desde 2020 cabe (unos 500 MB estimados) y es un parámetro de configuración, así que se puede ajustar.
2. **Aviso legal sin nombre:** la LSSI pide identificar al titular si hay actividad económica, y los donativos podrían contar. Es una decisión del titular y conviene consultarla antes de lanzar.

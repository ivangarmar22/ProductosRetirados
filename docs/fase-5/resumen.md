# Rediseño final: A Vitrina

Sustituye al diseño B Etiqueta. El prototipo elegido sigue en esta carpeta (`index.html`); los otros dos, B Radar y C Mercado, se descartaron y se borraron.

## Qué cambia

- **Marca:** cesta con alerta, con volumen y trenzado en tamaños grandes y versiones de píxel para 16, 32 y 48 px.
- **Diseño:** panel amarillo, titular gigante, cinta de supermercado animada, arcos de categorías y bloques de color. Unbounded y Figtree.
- **Navegación:** menú mínimo con píldora «Comprobar» y barra inferior en móvil y tablet.
- **Funciones nuevas:** sugerencias, comprobador (`/comprobar/`), «¿Es tu lote?», mapa por comunidad, cinta de alertas, compartir, Mi despensa (`/mi-despensa/`) y transiciones entre páginas.
- **Donativos:** bloque en la portada, además de `/apoya/` y el README.

## Decisiones de esta fase

- El titular alterna «retirado», «en alerta» y «afectado». Se quitó «caducado» del prototipo: la web no comprueba caducidades.
- El comprobador repite la búsqueda sin categoría si no encuentra nada, para que una categoría mal elegida no parezca un «no consta».
- «¿Es tu lote?» solo aparece si los lotes publicados están separados, y nunca dice que el producto sea seguro.
- La portada incluye un botón para pausar las animaciones (WCAG 2.2.2).
- Sin dominio comprado, el sitio se publica en `ivangarmar22.github.io/ProductosRetirados`.

# Fase 6: rediseño tras publicar

- **Color y tipografía:** fondo claro y neutro, un único acento coral y Figtree en toda la web, con tamaños más contenidos. Unbounded se retira.
- **Iconos:** Phosphor Duotone (licencia MIT) en toda la web, en lugar de Lucide y de las ilustraciones. Se probaron Fluent Emoji 3D (demasiado infantil) y una textura de grano. Se descartaron 3dicons (temática genérica), unDraw (escenas planas con personas), Storyset (exige atribución) y Solar (el repositorio no declara licencia).
- **Logotipo:** misma cesta con alerta, redibujada con volumen. El favicon no lleva fondo.
- **Mapa:** polígonos reales de Natural Earth (dominio público) con Canarias en recuadro, y lista de comunidades enlazada.
- **Desplegables:** propios, sobre los select nativos, que siguen guardando el valor del formulario.
- **Navegación:** menú completo desde 768 px, con Comprobar como enlace y Colaborar como botón. La barra inferior queda solo para móvil.
- **Fotos:** miniaturas en la ficha que se amplían en un visor, con crédito y sin copiarlas (son unas 58.000 y superarían el límite de 1 GB de GitHub Pages). Se cargan al entrar en pantalla: en la parte alta de la ficha bajaban Lighthouse a 76. Las webs oficiales pueden intentar poner cookies y Safety Gate no admite CORS para evitarlo, así que los textos legales lo avisan.
- **Retirado:** Mi despensa, Mis alergias, migas de pan, botón de pausa, aviso superior y enlaces al repositorio.

Generadores en `generadores/`: `mapa.mjs`, `marca.mjs` y `cinta.mjs`.

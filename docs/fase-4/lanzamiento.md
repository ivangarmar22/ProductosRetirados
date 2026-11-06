# Checklist de lanzamiento

## Publicar en GitHub Pages

- [ ] Apuntar el repositorio local al nuevo: `git remote set-url origin https://github.com/ivangarmar22/ProductosRetirados.git`.
- [ ] Subir `main` y, en **Settings → Pages**, elegir **GitHub Actions** como origen.
- [ ] Subir los datos ya descargados, para no repetir la carga inicial:

  ```bash
  cd data
  git init -b datos
  git remote add origin https://github.com/ivangarmar22/ProductosRetirados.git
  git add -A && git commit -m "datos: carga inicial" && git push -u origin datos
  ```

- [ ] Lanzar a mano **Actualizar y publicar** en la pestaña Actions.
- [ ] Enviar el correo a Consumo (`docs/fase-2/correo-consumo.md`).
- [ ] Crear el buzón `estaretirado@gmail.com` si no existe.
- [ ] Consultar si el aviso legal sin nombre es suficiente, dado que hay donativos.

## Cuando compres el dominio

- [ ] Comprar `productosretirados.es` (la disponibilidad no se pudo confirmar).
- [ ] Comprobar la marca en OEPM y EUIPO.
- [ ] Configurar el DNS y la variable `PUBLIC_SITE_URL` (ver README). El CNAME se genera solo.
- [ ] Activar **Enforce HTTPS**.

## Canales

- [ ] Telegram: crear el bot con @BotFather y el canal, y añadir el bot como administrador.
- [ ] Guardar `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` y `PUBLIC_TELEGRAM_URL`.
- [ ] MailerLite: crear la cuenta, verificar el remitente y crear el formulario alojado.
- [ ] Guardar `PUBLIC_NEWSLETTER_URL`.
- [ ] Comprobar si el plan gratuito incluye campañas RSS. Si no, enviar el resumen a mano.

## Buscadores

- [ ] Search Console: añadir la propiedad y verificarla.
- [ ] Enviar `sitemap.xml`, y volver a enviarlo al cambiar al dominio propio.
- [ ] Bing Webmaster Tools: importar desde Search Console.
- [ ] Revisar en una semana las páginas indexadas y los errores de cobertura.

## Comprobaciones tras publicar

- [ ] Abrir la web en un móvil real, Android e iPhone.
- [ ] Probar la búsqueda por marca, lote y EAN.
- [ ] Revisar `/estado/` tras dos o tres ejecuciones del cron.
- [ ] Probar un lector de pantalla (VoiceOver o TalkBack).
- [ ] Vigilar el tamaño del sitio y los minutos de Actions el primer mes.
- [ ] Comprobar que el cron sigue activo: en repos públicos GitHub lo desactiva tras 60 días sin actividad, y falta confirmar si cuentan los commits de la rama `datos`.

## Redes

- [ ] Reservar el nombre en las redes que quieras usar.
- [ ] Preparar la imagen de perfil con `public/icon-512.png`.

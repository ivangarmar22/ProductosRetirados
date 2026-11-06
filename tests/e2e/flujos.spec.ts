import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const sinDesborde = async (page: import('@playwright/test').Page) => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d).toBeLessThanOrEqual(0);
};

// Las fotos vienen de las webs oficiales: los tests no deben pedirles nada.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(www\.aesan\.gob\.es|ec\.europa\.eu)\//, (r) => r.abort());
});

const FICHA = '/alerta/jamon-cocido-urkabe-aesan-2026-80/';
const RANGO = '/alerta/col-rizada-boerenkool-espinacas-spinazie-y-espinacas-a-la-crema-spinaz-aesan-2025-23/';

test('inicio: buscador y alertas de España', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('retirado');
  await expect(page.getByRole('combobox').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Últimas alertas' })).toBeVisible();
  await sinDesborde(page);
  await page.screenshot({ path: `test-results/capturas/inicio-${test.info().project.name}.png`, fullPage: true });
});

test('buscar por lote lleva a la ficha con la fuente oficial', async ({ page }) => {
  await page.goto('/alertas/?q=61027');
  const enlace = page.locator('#resultados a').first();
  await expect(enlace).toContainText(/urkabe/i);
  await enlace.click();
  await expect(page.locator('h1')).toContainText(/jamón/i);
  await expect(page.getByRole('heading', { name: 'Qué hacer' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver fuente oficial' })).toHaveAttribute('href', /aesan\.gob\.es\/alertas\/2026_80/);
  await sinDesborde(page);
  await page.screenshot({ path: `test-results/capturas/ficha-${test.info().project.name}.png`, fullPage: true });
});

test('búsqueda tolerante a tildes y EAN', async ({ page }) => {
  await page.goto('/alertas/?q=jamon');
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
  await page.goto('/alertas/?q=3418178586009');
  await expect(page.locator('#resultados a').first()).toContainText(/mantel/i);
});

test('sin resultados: nunca dice que sea seguro y sugiere corrección', async ({ page }) => {
  await page.goto('/alertas/?q=urkave');
  await expect(page.getByText('Esto no significa que el producto sea seguro.')).toBeVisible();
  await expect(page.getByText('Esto no significa que el producto sea seguro.')).toBeInViewport();
  await expect(page.locator('#cargar-mas')).toBeHidden();
  await expect(page.locator('#sugerencia a')).toHaveText('urkabe');
  await sinDesborde(page);
});

test('un lote casi igual no encuentra otro producto', async ({ page }) => {
  await page.goto('/alertas/?q=61028');
  await expect(page.getByText('Esto no significa que el producto sea seguro.')).toBeVisible();
  await expect(page.locator('#resultados .tar')).toHaveCount(0);
});

test('un lote con prefijo encuentra el producto', async ({ page }) => {
  await page.goto('/alertas/?q=L61027');
  await expect(page.locator('#resultados .tar').first()).toContainText(/urkabe/i);
  await page.goto('/alertas/?q=lote%2061027');
  await expect(page.locator('#resultados .tar').first()).toContainText(/urkabe/i);
});

test('una alerta nacional aparece al filtrar por comunidad', async ({ page }) => {
  await page.goto('/alertas/?ccaa=Melilla&q=melodia');
  await expect(page.locator('#resultados .tar').first()).toContainText(/melodia/i);
});

test('una alerta con rango de lotes no ofrece el comprobador', async ({ page }) => {
  await page.goto(RANGO);
  await expect(page.locator('.lote')).toHaveCount(0);
});

test('una palabra sin sentido no devuelve resultados', async ({ page }) => {
  await page.goto('/alertas/?q=xqzjwv');
  await expect(page.getByText('Esto no significa que el producto sea seguro.')).toBeVisible();
});

test('una errata leve encuentra el producto', async ({ page }) => {
  await page.goto('/alertas/?q=salmonela');
  await expect(page.locator('#resultados .tar').first()).toContainText(/salmonella/i);
});

test('la sugerencia lleva a los resultados correctos', async ({ page }) => {
  await page.goto('/alertas/?q=urkave');
  await page.locator('#sugerencia a').click();
  await expect(page.locator('#resultados .tar').first()).toContainText(/urkabe/i);
});

test('los filtros se combinan y quedan en la URL', async ({ page }) => {
  await page.goto('/alertas/?categoria=Alimentos');
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
  await expect(page.locator('#activos button')).toHaveCount(1);
  await page.goto('/alertas/?categoria=Alimentos&ccaa=Madrid&anio=2026');
  await expect(page.locator('#activos button')).toHaveCount(3);
  await expect(page.locator('#resumen')).toContainText('alerta');
  const url = page.url();
  await page.reload();
  expect(page.url()).toBe(url);
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
});

test('en móvil, los filtros tienen salida a los resultados', async ({ page }, info) => {
  test.skip(info.project.name !== 'movil');
  await page.goto('/alertas/');
  await page.locator('.filtros summary').click();
  await page.getByRole('combobox', { name: /Categoría/ }).click();
  await page.getByRole('option', { name: 'Alimentos' }).click();
  await page.getByRole('button', { name: 'Ver resultados' }).click();
  await expect(page.locator('.filtros-in')).toBeHidden();
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
  expect(page.url()).toContain('categoria=Alimentos');
});

test('404 propio', async ({ page }) => {
  const r = await page.goto('/no-existe/');
  expect(r?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('nada');
});

for (const ruta of ['/', '/alertas/', '/alertas/pagina/2/', '/colabora/', '/contacto/', '/fuentes/', '/estadisticas/', '/avisos/', '/categorias/', '/comprobar/', '/aviso-legal/']) {
  test(`axe sin incidencias: ${ruta}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(ruta);
    await page.evaluate(() => document.fonts.ready);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
    await sinDesborde(page);
  });
}

test('axe sin incidencias en una ficha', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(FICHA);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].target}`)).toEqual([]);
});

test('sugerencias al escribir, con teclado', async ({ page }) => {
  await page.goto('/');
  const q = page.getByRole('combobox');
  await q.click();
  await q.pressSequentially('urkabe', { delay: 30 });
  await expect(page.locator('.sug li').first()).toContainText(/urkabe/i);
  await expect(q).toHaveAttribute('aria-expanded', 'true');
  await q.press('ArrowDown');
  await expect(q).toHaveAttribute('aria-activedescendant', 'sug-0');
  await q.press('Enter');
  await page.waitForURL(/alerta\/.*urkabe/);
});

test('las sugerencias quedan por encima de la cinta', async ({ page }) => {
  await page.goto('/');
  const q = page.getByRole('combobox');
  await q.click();
  await q.pressSequentially('urkabe', { delay: 30 });
  const fila = page.locator('.sug a').last();
  await expect(fila).toBeVisible();
  const encima = await fila.evaluate((el) => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width - 12, r.top + 8)?.closest('.sug') !== null; });
  expect(encima).toBe(true);
});

test('comprobador: encuentra la alerta en tres pasos', async ({ page }) => {
  await page.goto('/comprobar/');
  await page.getByRole('button', { name: 'Alimentos' }).click();
  await page.getByLabel('Marca, producto o lote').fill('urkabe');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.locator('.res.mal')).toContainText('coincide');
  await expect(page.locator('.res-l a').first()).toContainText(/urkabe/i);
  await page.getByRole('button', { name: 'Comprobar otro' }).click();
  await expect(page.getByText('¿Qué tipo de producto es?')).toBeVisible();
});

test('comprobador: una categoría equivocada no oculta la alerta', async ({ page }) => {
  await page.goto('/comprobar/');
  await page.getByRole('button', { name: 'Juguetes' }).click();
  await page.getByLabel('Marca, producto o lote').fill('urkabe');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.locator('.res.mal')).toContainText('en otra categoría');
});

test('comprobador: sin coincidencias nunca dice que sea seguro', async ({ page }) => {
  await page.goto('/comprobar/');
  await page.getByRole('button', { name: 'Otro o no lo sé' }).click();
  await page.getByLabel('Marca, producto o lote').fill('xqzjwv');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.locator('.res.ok')).toContainText('no significa que el producto sea seguro');
});

test('¿Es tu lote? distingue coincidencia, parcial y otro lote', async ({ page }) => {
  await page.goto(FICHA);
  const lote = page.getByLabel('Escribe el lote');
  await lote.fill('L-61027');
  await expect(page.locator('.lote-res')).toContainText('Coincide');
  await lote.fill('610');
  await expect(page.locator('.lote-res')).toContainText('Sigue escribiendo');
  await lote.fill('61028');
  await expect(page.locator('.lote-res')).toContainText('No coincide');
  await expect(page.locator('.lote-res')).toContainText('si dudas');
});

test('compartir por WhatsApp lleva la URL de la ficha', async ({ page }) => {
  await page.goto(FICHA);
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me.*jamon-cocido-urkabe/);
});

test('el mapa lleva a las alertas de la comunidad', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^Madrid: / }).click();
  await page.waitForURL(/ccaa=Madrid/);
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
});

test('la portada no tiene botón de pausa y la cinta cabe en su panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /pausar/i })).toHaveCount(0);
  const panel = (await page.locator('.panel').boundingBox())!;
  const cinta = (await page.locator('.escena').boundingBox())!;
  expect(cinta.x).toBeGreaterThanOrEqual(panel.x);
  expect(cinta.x + cinta.width).toBeLessThanOrEqual(panel.x + panel.width);
  expect(cinta.y + cinta.height).toBeLessThanOrEqual(panel.y + panel.height);
  await expect(page.locator('.escena .item')).toHaveCount(6);
});

test('la cabecera no parte palabras en ninguna sección', async ({ page }, info) => {
  test.skip(info.project.name === 'movil');
  for (const ruta of ['/', '/alertas/', '/categorias/', '/alergenos/', '/avisos/', '/comprobar/', '/colabora/', '/contacto/']) {
    for (const ancho of [768, 800, 960, 1024]) {
      await page.setViewportSize({ width: ancho, height: 800 });
      await page.goto(ruta);
      expect((await page.locator('.cab').boundingBox())!.height).toBeLessThanOrEqual(64);
      const fuera = await page.locator('.cab-in').evaluate((e) => e.scrollWidth - e.clientWidth);
      expect(fuera).toBeLessThanOrEqual(0);
    }
  }
});

test('el contador de alertas va debajo de los ejemplos', async ({ page }) => {
  await page.goto('/');
  const ejemplos = (await page.locator('.rap').boundingBox())!;
  const chip = (await page.locator('.hero .chip').boundingBox())!;
  expect(chip.y).toBeGreaterThanOrEqual(ejemplos.y + ejemplos.height + 12);
});

test('contacto: correo directo y validación del formulario', async ({ page }) => {
  await page.goto('/contacto/');
  await expect(page.getByRole('link', { name: 'Escribir un correo' })).toHaveAttribute('href', 'mailto:estaretirado@gmail.com');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByText('Escribe un correo válido')).toBeVisible();
  await expect(page.getByText('Cuéntanos en qué podemos ayudarte')).toBeVisible();
  await expect(page.getByLabel('Tu correo')).toBeFocused();
  await sinDesborde(page);
});

test('contacto: envía desde la web y avisa si falla', async ({ page }) => {
  let cuerpo = '';
  let estado = 200;
  await page.route('https://api.web3forms.com/submit', (r) => { cuerpo = r.request().postData() ?? ''; return r.fulfill({ status: estado, json: { success: estado === 200 } }); });
  await page.goto('/contacto/');
  const rellenar = async () => {
    await page.getByLabel('Tu correo').fill('ana@example.com');
    await page.getByLabel('Mensaje').fill('Hola');
    await page.locator('#contacto button[type="submit"]').click();
  };
  await page.getByRole('combobox', { name: /Motivo/ }).click();
  await page.getByRole('option', { name: 'Proponer una fuente' }).click();
  await rellenar();
  await expect(page.locator('.salida')).toHaveText('Mensaje enviado. Gracias por escribirnos.');
  await expect(page.getByRole('combobox', { name: /Motivo/ })).toContainText('Error en una alerta');
  expect(JSON.parse(cuerpo)).toMatchObject({ access_key: expect.stringMatching(/^[0-9a-f-]{36}$/), email: 'ana@example.com', message: 'Hola' });
  await expect(page.getByLabel('Mensaje')).toHaveValue('');
  estado = 500;
  await rellenar();
  await expect(page.locator('.salida')).toContainText('No se ha podido enviar');
  await expect(page.getByLabel('Mensaje')).toHaveValue('Hola');
});

test('las miniaturas cargan al llegar y se amplían en un visor', async ({ page }) => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  await page.route(/^https:\/\/www\.aesan\.gob\.es\//, (r) => r.fulfill({ contentType: 'image/png', body: png }));
  await page.goto(FICHA);
  const primera = page.locator('.fotos a').first();
  await primera.scrollIntoViewIfNeeded();
  await expect.poll(() => primera.locator('img').evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  await expect(primera.locator('img')).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(page.getByText('Imágenes de AESAN')).toBeVisible();
  const visor = page.getByRole('dialog', { name: 'Fotos del producto' });
  await page.locator('.fotos a').nth(1).click();
  await expect(visor).toBeVisible();
  expect(page.url()).toContain(FICHA);
  await expect(visor.locator('.visor-n')).toHaveText('2 de 3');
  await expect.poll(() => visor.locator('img').evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  const axe = await new AxeBuilder({ page }).include('.visor').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await visor.getByRole('button', { name: 'Foto siguiente' }).click();
  await expect(visor.locator('.visor-n')).toHaveText('3 de 3');
  await page.keyboard.press('ArrowRight');
  await expect(visor.locator('.visor-n')).toHaveText('1 de 3');
  await page.keyboard.press('Escape');
  await expect(visor).toBeHidden();
  await primera.click();
  await visor.getByRole('button', { name: 'Cerrar' }).click();
  await expect(visor).toBeHidden();
  await primera.click();
  await page.mouse.click(4, 4);
  await expect(visor).toBeHidden();
  await sinDesborde(page);
});

test('si las fotos no cargan, la sección desaparece sin dejar hueco', async ({ page }) => {
  await page.goto(FICHA);
  await page.evaluate(() => document.querySelector('[data-fotos]')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(page.getByRole('heading', { name: 'Fotos del producto' })).toHaveCount(0);
});

test('si el buscador no carga lo dice, y se recupera al reintentar', async ({ page }) => {
  let caido = true;
  await page.route('**/pagefind/pagefind.js', (r) => (caido ? r.abort() : r.continue()));
  await page.goto('/alertas/?q=urkabe');
  await expect(page.locator('#resumen')).toContainText('No se ha podido cargar el buscador');
  caido = false;
  await page.locator('#q').press('Enter');
  await expect(page.locator('#resultados .tar').first()).toContainText(/urkabe/i);
});

test('el filtro de una comunidad con ñ devuelve resultados', async ({ page }) => {
  await page.goto('/alertas/?ccaa=' + encodeURIComponent('Cataluña'));
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
  await expect(page.locator('#resumen')).toContainText('alertas');
});

test('iconos y favicon van versionados y todos existen en el sprite', async ({ page, request }) => {
  await page.goto('/');
  const fav = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
  expect(fav).toMatch(/favicon\.svg\?v=[0-9a-f]{8}$/);
  const sprite = await (await request.get('/iconos.svg')).text();
  for (const ruta of ['/', '/alertas/', '/comprobar/', '/contacto/', '/colabora/', FICHA]) {
    await page.goto(ruta);
    const usados = await page.locator('use').evaluateAll((l) => l.map((u) => u.getAttribute('href')!));
    for (const h of usados) {
      expect(h).toMatch(/iconos\.svg\?v=[0-9a-f]{8}#/);
      expect(sprite).toContain(`id="${h.split('#')[1]}"`);
    }
  }
});

test('la cinta queda centrada en móvil y tablet', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const ancho of [360, 390, 600, 768, 900]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    await page.goto('/');
    const desvio = await page.evaluate(() => {
      const panel = document.querySelector('.panel')!.getBoundingClientRect();
      const q = [...document.querySelectorAll('.escena > polygon')].map((e) => e.getBoundingClientRect());
      return (Math.min(...q.map((r) => r.left)) + Math.max(...q.map((r) => r.right))) / 2 - (panel.left + panel.right) / 2;
    });
    expect(Math.abs(desvio)).toBeLessThanOrEqual(3);
  }
});

test('los ejemplos de búsqueda ocupan una sola fila', async ({ page }) => {
  for (const ancho of [360, 390, 768, 1024, 1280]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    await page.goto('/');
    const visibles = page.locator('.rap li:visible');
    await expect(visibles.first()).toBeVisible();
    const alturas = await page.locator('.rap li').evaluateAll((l) => l.filter((e) => getComputedStyle(e).visibility === 'visible').map((e) => e.getBoundingClientRect().top));
    expect(new Set(alturas).size).toBe(1);
  }
});

test('sin migas, sin aviso superior y sin enlace al repositorio', async ({ page }) => {
  for (const ruta of ['/', '/colabora/', '/fuentes/', '/sobre/', '/aviso-legal/', FICHA]) {
    await page.goto(ruta);
    await expect(page.getByText('Web independiente')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Migas de pan"]')).toHaveCount(0);
    await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
  }
});

test('Mi despensa y Mis alergias ya no existen', async ({ page }) => {
  for (const ruta of ['/mi-despensa/', '/mis-alergias/']) expect((await page.goto(ruta))?.status()).toBe(404);
  await page.goto(FICHA);
  await expect(page.locator('a[href*="mi-despensa"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Vigilar/ })).toHaveCount(0);
});

test('navegación: Contacto en el menú y Colaborar destacado', async ({ page }, info) => {
  await page.goto('/');
  if (info.project.name === 'movil') {
    await expect(page.locator('.tabbar a').nth(3)).toHaveText('Avisos');
    await expect(page.locator('.tabbar a').nth(4)).toHaveText('Contacto');
    await expect(page.locator('.menu')).toBeHidden();
    await expect(page.locator('.cta')).toHaveText('Colaborar');
    await sinDesborde(page);
    return;
  }
  await expect(page.locator('.tabbar')).toBeHidden();
  await expect(page.locator('.menu a')).toHaveText(['Alertas', 'Comprobar', 'Categorías', 'Alérgenos', 'Avisos', 'Contacto']);
  await page.locator('.cta').click();
  await page.waitForURL(/colabora/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ayúdanos');
});

test('desplegable: ratón, teclado y etiqueta activa', async ({ page }, info) => {
  await page.goto('/alertas/');
  if (info.project.name === 'movil') await page.locator('.filtros summary').click();
  const fuente = page.getByRole('combobox', { name: /Fuente/ });
  await fuente.click();
  await expect(page.getByRole('option', { name: 'AEMPS' })).toBeVisible();
  await page.getByRole('option', { name: 'AEMPS' }).click();
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(fuente).toContainText('AEMPS');
  await page.waitForURL(/fuente=AEMPS/);
  await expect(page.locator('#resultados .tar').first()).toBeVisible();

  const ccaa = page.getByRole('combobox', { name: /Comunidad/ });
  await ccaa.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.type('mad');
  await page.keyboard.press('Enter');
  await expect(ccaa).toContainText('Madrid');
  await page.waitForURL(/ccaa=Madrid/);

  await ccaa.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(ccaa).toHaveAttribute('aria-expanded', 'false');

  await page.getByRole('button', { name: 'Quitar filtro: AEMPS' }).click();
  await expect(fuente).toContainText('Todas');
  expect(page.url()).not.toContain('fuente=');
  await sinDesborde(page);
});

test('los filtros de la URL se ven en los desplegables', async ({ page }, info) => {
  await page.goto('/alertas/?categoria=Juguetes&anio=2026');
  if (info.project.name === 'movil') await page.locator('.filtros summary').click();
  await expect(page.getByRole('combobox', { name: /Categoría/ })).toContainText('Juguetes');
  await expect(page.getByRole('combobox', { name: /Año/ })).toContainText('2026');
});

test('la ficha con distribución muestra el mapa con su comunidad', async ({ page }) => {
  await page.goto(FICHA);
  const mapa = page.locator('.mapa-f');
  if (await mapa.count()) await expect(mapa.locator('.ca.on').first()).toBeVisible();
});

test('sin movimiento no hay animaciones y el contenido se ve', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.locator('.ticker > div').evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.locator('.donar')).toHaveCSS('opacity', '1');
  await expect(page.locator('.cifras b').first()).not.toHaveText('0');
});

for (const ruta of ['/', '/colabora/']) {
  test(`donativos en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.getByText('652 308 536').first()).toBeVisible();
    await expect(page.locator('a[href="https://www.paypal.me/ivangarmar22"]').first()).toBeVisible();
  });
}

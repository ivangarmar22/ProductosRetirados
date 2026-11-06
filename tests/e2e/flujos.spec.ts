import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const sinDesborde = async (page: import('@playwright/test').Page) => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d).toBeLessThanOrEqual(0);
};

const FICHA = '/alerta/jamon-cocido-urkabe-aesan-2026-80/';
const RANGO = '/alerta/col-rizada-boerenkool-espinacas-spinazie-y-espinacas-a-la-crema-spinaz-aesan-2025-23/';

test('inicio: buscador, alertas de España y aviso de no oficial', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('retirado');
  await expect(page.getByRole('combobox').first()).toBeVisible();
  await expect(page.getByText('No es un organismo oficial')).toBeVisible();
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
  await page.locator('#f-categoria').selectOption('Alimentos');
  await page.getByRole('button', { name: 'Ver resultados' }).click();
  await expect(page.locator('.filtros-in')).toBeHidden();
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
  expect(page.url()).toContain('categoria=Alimentos');
});

test('Mis alergias se guarda en el dispositivo', async ({ page }) => {
  await page.goto('/mis-alergias/');
  await page.getByLabel('Huevo').check();
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Huevo')).toBeChecked();
});

test('404 propio', async ({ page }) => {
  const r = await page.goto('/no-existe/');
  expect(r?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('nada');
});

for (const ruta of ['/', '/alertas/', '/alertas/pagina/2/', '/apoya/', '/fuentes/', '/estadisticas/', '/avisos/', '/categorias/', '/comprobar/', '/mi-despensa/', '/mis-alergias/', '/aviso-legal/']) {
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

test('Mi despensa: vigilar desde la ficha, ver y quitar', async ({ page }) => {
  await page.goto(FICHA);
  await page.getByRole('button', { name: 'Vigilar URKABE' }).click();
  await expect(page.getByRole('button', { name: 'Vigilando URKABE' })).toBeVisible();
  await page.goto('/mi-despensa/');
  await expect(page.locator('#resultados .tar').first()).toContainText(/urkabe/i);
  await page.getByLabel('Marca o producto').fill('xqzjwv');
  await page.getByRole('button', { name: 'Añadir' }).click();
  await expect(page.getByRole('button', { name: 'Dejar de vigilar xqzjwv' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Dejar de vigilar URKABE' }).click();
  await expect(page.locator('#resumen')).toContainText('no significa que tus productos sean seguros');
});

test('el mapa lleva a las alertas de la comunidad', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^Madrid: / }).click();
  await page.waitForURL(/ccaa=Madrid/);
  await expect(page.locator('#resultados .tar').first()).toBeVisible();
});

test('la animación de portada se puede pausar', async ({ page }) => {
  await page.goto('/');
  const b = page.getByRole('button', { name: 'Pausar animación' });
  await b.click();
  await expect(b).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.ticker > div').evaluate((e) => getComputedStyle(e).animationPlayState)).toBe('paused');
});

test('sin movimiento no hay animaciones y el contenido se ve', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.locator('.ticker > div').evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.locator('.donar')).toHaveCSS('opacity', '1');
  await expect(page.locator('.cifras b').first()).not.toHaveText('0');
});

for (const ruta of ['/', '/apoya/']) {
  test(`donativos en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.getByText('652 308 536').first()).toBeVisible();
    await expect(page.locator('a[href="https://www.paypal.me/ivangarmar22"]').first()).toBeVisible();
  });
}

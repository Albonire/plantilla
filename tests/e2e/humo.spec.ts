import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import act2 from '../../src/data/actividades/unidad_2.json' with { type: 'json' };

// islands below the fold hydrate when they are close to the viewport: wait until that happened
async function hidratada(zona: Locator) {
  await zona.scrollIntoViewIfNeeded();
  const isla = zona.locator('xpath=ancestor-or-self::astro-island[1]');
  if ((await isla.count()) > 0) await expect(isla).not.toHaveAttribute('ssr', /.*/);
}

// the four pages of a case: /unidad/N, /pistas, /lupa and /cerrar
const PAGINAS = ['', '/pistas', '/lupa', '/cerrar'];
const CASOS = [1, 2, 3, 4, 5];
const RUTAS_CASOS = CASOS.flatMap((n) => PAGINAS.map((p) => `/unidad/${n}${p}`));

const RUTAS = ['/', '/programa', ...RUTAS_CASOS, '/cierre', '/ficha', '/docentes', '/referencias'];

const boton_menu = (page: Page) => page.locator('summary').filter({ hasText: 'Menú' });

for (const ruta of RUTAS) {
  test.describe(`ruta ${ruta}`, () => {
    test('carga sin errores de consola y con un solo h1', async ({ page }) => {
      const errores: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errores.push(m.text());
      });
      page.on('pageerror', (e) => errores.push(e.message));
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toHaveCount(1);
      expect(errores).toEqual([]);
    });

    test('sin violaciones serias de accesibilidad (axe)', async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState('load');
      await page.waitForTimeout(600);
      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const graves = resultado.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        graves.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(' '))
              .slice(0, 3)
              .join(' | ')}`,
        ),
      ).toEqual([]);
    });

    test('no hay desbordamiento horizontal a 360px', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(desborde).toBeLessThanOrEqual(1);
    });
  });
}

test('el texto del proyecto no usa raya larga ni emojis en la interfaz', async ({ page }) => {
  for (const ruta of RUTAS) {
    await page.goto(ruta);
    const texto = await page.evaluate(() => document.body.innerText);
    // en dash and em dash, built from char codes so this file has none of them
    const rayas = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
    expect(texto, ruta).not.toMatch(rayas);
    expect(texto, ruta).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    expect(texto.toLowerCase(), ruta).not.toMatch(/\b(imprime|imprimir|recorta tu|colorea)\b/);
  }
});

test.describe('interruptores y menu', () => {
  test('el interruptor Movimiento cambia el atributo del html y se recuerda', async ({ page }) => {
    await page.goto('/');
    await boton_menu(page).click();
    const boton = page.getByRole('switch', { name: /Movimiento/ });
    await expect(boton).toHaveAttribute('aria-checked', 'true');
    await boton.click();
    await expect(page.locator('html')).toHaveAttribute('data-movimiento', 'no');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-movimiento', 'no');
  });

  test('la letra grande sube la escala base', async ({ page }) => {
    await page.goto('/');
    await boton_menu(page).click();
    await page.getByRole('switch', { name: /Letra grande/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-letra', 'grande');
    const tamano = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(tamano).toBe('18px');
  });
});

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no hay pines ni patrones activos y el contenido esta completo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.apertura-activa')).toHaveCount(0);
    await expect(page.locator('#portadilla')).toBeVisible();
    await page.goto('/unidad/2/pistas');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.camara-activa')).toHaveCount(0);
    await expect(page.locator('.sendero-activo')).toHaveCount(0);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.getByText('Hoja 1').first()).toBeAttached();
    await page.goto('/unidad/3/pistas');
    await expect(page.locator('.lupas-activo')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Lupa 3: lo que pienso/ })).toBeVisible();
  });
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('la lectura y las pistas se leen completas', async ({ page }) => {
    await page.goto('/unidad/1/pistas');
    await expect(page.getByText('En un valle lleno de pasto y flores')).toBeVisible();
    await expect(page.getByText('¿Por qué crees que la tortuga propone una carrera')).toBeVisible();
    await page.goto('/unidad/1');
    await expect(page.getByText('Leer no se limita a pronunciar')).toBeVisible();
    await page.goto('/unidad/2/pistas');
    await expect(page.getByText('Este dice cómo hacer algo en orden').first()).toBeAttached();
    await page.goto('/');
    await expect(page.getByText('Universidad Santo Tomás').first()).toBeVisible();
  });
});

test.describe('actividades', () => {
  test('el cuestionario del caso 1 se resuelve, marca el caso y se recuerda', async ({ page }) => {
    await page.goto('/unidad/1/lupa');
    const tarjeta = page.getByRole('region', { name: 'Cuestionario sobre la lectura' });
    await hidratada(tarjeta);
    await expect(tarjeta).toBeVisible();
    for (let i = 0; i < 6; i++) {
      // wrong first, then the right one
      const opciones = tarjeta.getByRole('list', { name: 'Opciones' }).getByRole('button');
      const total = await opciones.count();
      let acierto = false;
      for (let k = 0; k < total && !acierto; k++) {
        await opciones.nth(k).click();
        acierto = (await tarjeta.getByText('Correcta').count()) > 0;
      }
      expect(acierto).toBe(true);
      await tarjeta.getByRole('button', { name: /Siguiente pregunta|Ver mi resultado/ }).click();
    }
    await expect(tarjeta.getByText('Resolviste las 6 preguntas')).toBeVisible();
    const progreso = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('aventura_lectora:progreso') ?? '{}'),
    );
    expect(progreso.resueltos).toContain(1);
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: 'Cuestionario sobre la lectura' })
        .getByText('Resolviste las 6 preguntas'),
    ).toBeVisible();
  });

  test('el clasificador de textos se completa con los botones Mover a', async ({ page }) => {
    await page.goto('/unidad/2/lupa');
    const zona = page.getByRole('region', { name: 'Clasificador de textos' });
    await hidratada(zona);
    const items = act2.clasificador.items;
    const cajas = Object.fromEntries(act2.clasificador.cajas.map((c) => [c.id, c.titulo]));
    for (const item of items) {
      const tarjeta = zona.locator('li', { hasText: item.texto }).first();
      await tarjeta
        .getByRole('group', { name: /Mover a una caja/ })
        .getByRole('button', { name: cajas[item.caja], exact: true })
        .click();
    }
    await zona.getByRole('button', { name: 'Revisar', exact: true }).click();
    await expect(
      zona.getByText(`Muy bien: las ${items.length} tarjetas están en su caja.`),
    ).toBeVisible();
  });

  test('la sopa de letras responde al teclado', async ({ page }) => {
    await page.goto('/unidad/1/pistas');
    const rejilla = page.getByRole('grid', { name: 'Sopa de letras' });
    await hidratada(rejilla);
    await rejilla.locator('[data-fila="0"][data-col="0"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Inicio en fila 1, columna 1/)).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('status').filter({ hasText: /Esa línea|Encontraste|Ya habías/ }),
    ).toBeVisible();
  });

  test('el reto del caso 1 se descarga como PDF', async ({ page }) => {
    await page.goto('/unidad/1/cerrar');
    const reto = page.getByRole('article').filter({ hasText: 'Mi bitácora de detective lector' });
    await hidratada(reto);
    await reto.getByLabel('Tu nombre').fill('Ana Prueba');
    await reto.getByLabel('Predicción 1').fill('Creo que la cigarra canta.');
    const descarga = page.waitForEvent('download');
    await reto.getByRole('button', { name: 'Descargar PDF' }).click();
    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toBe('aventura_lectora_caso_1_reto.pdf');
  });

  test('el certificado y el expediente se descargan', async ({ page }) => {
    await page.goto('/cierre');
    await hidratada(page.locator('#cert-nombre'));
    await page.locator('#cert-nombre').fill('Ana Prueba');
    const uno = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar certificado' }).click();
    expect((await uno).suggestedFilename()).toBe('certificado_aventura_lectora.pdf');

    await hidratada(page.locator('#exp-nombre'));
    await page.locator('#exp-nombre').fill('Ana Prueba');
    await page.getByRole('button', { name: 'Armar mi expediente' }).click();
    const dos = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Armar con lo que tengo' }).click();
    expect((await dos).suggestedFilename()).toBe('expediente_del_detective_lector.pdf');
  });
});

test('la camara del comic avanza con el teclado', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/unidad/2/pistas');
  await page.waitForLoadState('networkidle');
  const comic = page.locator('#comic-camara');
  await expect(comic).toHaveClass(/camara-activa/);
  await comic.scrollIntoViewIfNeeded();
  const caja = await comic.boundingBox();
  await page.evaluate(
    (y) => window.scrollTo(0, y + 10),
    (caja?.y ?? 0) + (await page.evaluate(() => window.scrollY)),
  );
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1200);
  await expect(comic.locator('[data-contador]')).toHaveText('2 de 6');
});

test.describe('recursos de terceros', () => {
  test('no cargan nada externo hasta que el estudiante lo pide', async ({ page }) => {
    const externos: string[] = [];
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith('http://localhost') && !u.startsWith('data:')) externos.push(u);
    });
    for (const p of PAGINAS) {
      await page.goto(`/unidad/4${p}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('iframe')).toHaveCount(0);
    }
    expect(externos).toEqual([]);
  });

  test('el juego del laberinto se muestra dentro de la pagina al pulsar', async ({ page }) => {
    await page.goto('/unidad/4/pistas');
    const tarjeta = page.getByRole('region', { name: 'El laberinto de la información' });
    await hidratada(tarjeta);
    await tarjeta.getByRole('button', { name: /Cargar el recurso/ }).click();
    const marco = tarjeta.locator('iframe');
    await expect(marco).toHaveAttribute(
      'src',
      'https://view.genially.com/664dca9c96d30b00146b5513',
    );
    await expect(marco).toHaveAttribute('title', 'El laberinto de la información');
  });

  test('el video de YouTube usa la version sin cookies', async ({ page }) => {
    await page.goto('/unidad/1/pistas');
    const tarjeta = page.getByRole('region', { name: 'El mensaje oculto' });
    await hidratada(tarjeta);
    await tarjeta.getByRole('button', { name: /Cargar el video/ }).click();
    await expect(tarjeta.locator('iframe')).toHaveAttribute(
      'src',
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/yVYG4uvefCQ/,
    );
  });

  test('los recursos que no permiten iframe se integran como actividad con enlace', async ({
    page,
  }) => {
    await page.goto('/unidad/1/pistas');
    const tarjeta = page.getByRole('region', { name: /La liebre y la tortuga: la fábula/ });
    await tarjeta.scrollIntoViewIfNeeded();
    await expect(tarjeta.getByText('Lee y compara')).toBeVisible();
    await expect(tarjeta.getByRole('link', { name: /Abrir en otra pestaña/ })).toHaveAttribute(
      'href',
      /culturagenial\.com/,
    );
  });

  test('cada caso muestra sus recursos de terceros dentro de la pagina', async ({ page }) => {
    // resources that load in a frame after a click, per case (the youtube video has its own button)
    const esperados: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 3, 5: 3 };
    for (const [caso, cantidad] of Object.entries(esperados)) {
      let total = 0;
      for (const p of PAGINAS) {
        await page.goto(`/unidad/${caso}${p}`);
        total += await page.getByRole('button', { name: /Cargar el recurso/ }).count();
      }
      expect(total, `caso ${caso}`).toBe(cantidad);
    }
  });
});

test.describe('libro de cuatro paginas por caso', () => {
  test('cada pagina muestra solo sus secciones', async ({ page }) => {
    const secciones: Record<string, string[]> = {
      '': ['portada', 'mision', 'introduccion', 'contenidos'],
      '/pistas': ['desarrollo'],
      '/lupa': ['practica'],
      '/cerrar': ['reto', 'cierre-caso'],
    };
    const todas = Object.values(secciones).flat();
    for (const [p, propias] of Object.entries(secciones)) {
      await page.goto(`/unidad/3${p}`);
      for (const id of todas) {
        const esperado = propias.includes(id) ? 1 : 0;
        await expect(page.locator(`main section[id="${id}"]`), `${p || '/'} ${id}`).toHaveCount(
          esperado,
        );
      }
    }
  });

  test('con Siguiente se recorre todo el libro hasta las referencias', async ({ page }) => {
    await page.goto('/programa');
    const visitadas: string[] = ['/programa'];
    for (let i = 0; i < 40; i++) {
      const siguiente = page.locator('a[rel="next"]');
      if ((await siguiente.count()) === 0) break;
      const href = await siguiente.first().getAttribute('href');
      visitadas.push(href ?? '');
      await page.goto(href ?? '/');
    }
    expect(visitadas).toEqual(['/programa', ...RUTAS_CASOS, '/cierre', '/referencias']);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Referencias');
  });

  test('cada enlace de la ficha llega a una pagina que tiene esa seccion', async ({ page }) => {
    await page.goto('/ficha');
    const enlaces = await page
      .locator('main a[href^="/"]')
      .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('href') ?? ''))]);
    const internos = enlaces.filter((h) => h.includes('#'));
    expect(internos.length).toBeGreaterThan(30);
    for (const href of internos) {
      const [ruta, ancla] = href.split('#');
      await page.goto(ruta || '/');
      await expect(page.locator(`[id="${ancla}"]`), href).toBeAttached();
    }
  });

  test('llegar al final de una pagina la marca como leida en el indice', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/unidad/2/lupa');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const enlace = page.locator('.curso-indice a[data-pagina="2/lupa"]');
    await expect(enlace).toHaveAttribute('data-leida', 'true');
    await expect(enlace).toContainText('Leída');
    const progreso = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('aventura_lectora:progreso') ?? '{}'),
    );
    expect(progreso.paginas_leidas).toContain('2/lupa');
    expect(progreso.visitados).toContain(2);
  });

  test('en celular el indice esta dentro del menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/unidad/3/pistas');
    await expect(page.locator('.curso-indice')).toBeHidden();
    await boton_menu(page).click();
    const indice = page.getByRole('navigation', { name: 'Índice del curso en el menú' });
    await expect(indice).toBeVisible();
    await expect(indice.getByRole('link', { name: /Seguir las pistas/ }).first()).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

test.describe('video en vista', () => {
  async function centrar(video: Locator) {
    await video.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  }

  test('empieza con volumen al llegar a la pantalla, sin aviso de sonido y se pausa al salir', async ({
    page,
  }) => {
    await page.goto('/unidad/1/pistas');
    const video = page.locator('video').first();
    await centrar(video);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true);
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    await expect(page.getByRole('button', { name: 'Activar sonido' })).toHaveCount(0);
    // no caption track: the captions are already burned into the picture
    await expect(video.locator('track')).toHaveCount(0);
    // el aviso debajo del video sobre el sonido fue removido
    await expect(page.getByText(/Empieza solo, sin sonido/)).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test('el video tiene sonido activo al reproducirse', async ({ page }) => {
    await page.goto('/unidad/1/pistas');
    const video = page.locator('video').first();
    await centrar(video);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true);
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
  });

  test.describe('con movimiento reducido', () => {
    test.use({ reducedMotion: 'reduce' });

    test('no se reproduce solo: queda el boton de reproducir sobre el poster', async ({ page }) => {
      await page.goto('/unidad/1/pistas');
      const video = page.locator('video').first();
      await centrar(video);
      await page.waitForTimeout(1500);
      expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
      await expect(page.getByRole('button', { name: /Ver el video/ }).first()).toBeVisible();
    });
  });
});

test.describe('orientacion dentro del caso', () => {
  test('los pasos del caso marcan la pagina actual y las ya leidas', async ({ page }) => {
    await page.goto('/unidad/2/pistas');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('[data-aviso-pagina]')).toContainText(
      'Página leída: Seguir las pistas',
    );
    await page.goto('/unidad/2/lupa');
    const pasos = page.getByRole('navigation', { name: 'Pasos de este caso' });
    await expect(pasos.getByRole('link', { name: /Entrenar la lupa/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(pasos.getByRole('link', { name: /Seguir las pistas/ })).toContainText('Leída');
  });

  test('en celular la pagina de pistas ofrece el indice En esta pagina', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/unidad/3/pistas');
    const indice = page.locator('details', { hasText: 'En esta página' });
    await expect(indice).toBeVisible();
    await indice.locator('summary').click();
    await expect(indice.getByRole('link').first()).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(indice).toBeHidden();
  });

  test('el paginador pone la pagina siguiente primero en celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/unidad/1');
    const enlaces = page.getByRole('navigation', { name: 'Páginas del libro' }).getByRole('link');
    await expect(enlaces.first()).toHaveAttribute('rel', 'next');
  });
});

test.describe('portada como libro', () => {
  const tamanos = [
    { nombre: 'escritorio', ancho: 1440, alto: 900, largo: 1 },
    { nombre: 'tableta', ancho: 768, alto: 1024, largo: 1.5 },
    { nombre: 'celular', ancho: 390, alto: 844, largo: 1.5 },
    { nombre: 'celular pequeno', ancho: 360, alto: 640, largo: 1.5 },
  ];
  for (const t of tamanos) {
    test(`el libro se abre con el scroll y la portadilla queda a la vista (${t.nombre})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: t.ancho, height: t.alto });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.apertura-activa')).toHaveCount(1);
      await expect(page.getByRole('link', { name: 'Empezar el caso 1' }).first()).toHaveAttribute(
        'href',
        '/unidad/1',
      );
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(t.alto * t.largo));
      await page.waitForTimeout(1600);
      const caja = await page.locator('#portadilla').boundingBox();
      expect(caja).not.toBeNull();
      // the title page is inside the screen once the book is open (centered on phones)
      const centro = (caja?.x ?? 0) + (caja?.width ?? 0) / 2;
      expect(centro).toBeGreaterThan(0);
      expect(centro).toBeLessThan(t.ancho);
    });
  }

  test('al abrir el libro el enlace Empezar el caso 1 de la portadilla es cliqueable y navega', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(1600);
    const boton = page.locator('#portadilla').getByRole('link', { name: 'Empezar el caso 1' });
    await expect(boton).toBeVisible();
    await boton.click();
    await expect(page).toHaveURL(/.*\/unidad\/1/);
  });

  test('en horizontal de celular la portada es una pila de paginas simple', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.apertura-activa')).toHaveCount(0);
    await expect(page.locator('#portadilla')).toBeAttached();
  });

  test('un clic en el boton O baja para abrir el libro lo abre', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /baja para abrir el libro/ }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  });
});

test.describe('pendientes', () => {
  test('no queda ningun PENDIENTE visible en todo el sitio', async ({ page }) => {
    const encontrados: string[] = [];
    for (const ruta of RUTAS) {
      await page.goto(ruta);
      const texto = await page.evaluate(() => document.body.innerText);
      if (texto.includes('[PENDIENTE')) encontrados.push(ruta);
    }
    expect(encontrados).toEqual([]);
    await page.goto('/unidad/1/cerrar');
    await expect(page.getByText(/Adaptación revisada por Selene María Caballero Valle/)).toBeVisible();
  });

  test('el reto del caso 4 muestra la noticia con su fuente y enlace', async ({ page }) => {
    await page.goto('/unidad/4/cerrar');
    const noticia = page.getByRole('region', { name: /De Bogotá al espacio/ });
    await expect(noticia).toBeVisible();
    await expect(noticia).toContainText('City TV Noticias');
    await expect(noticia).toContainText('25 de septiembre de 2026');
    await expect(noticia.getByRole('link', { name: /Leer la noticia/ })).toHaveAttribute(
      'href',
      /citytv\.eltiempo\.com/,
    );
  });

  test('el poema del caso 2 explica como se verifico y las referencias lo citan', async ({
    page,
  }) => {
    await page.goto('/unidad/2/pistas');
    const detalle = page.locator('details', { hasText: 'Cómo se verificó este texto' }).first();
    await expect(detalle).toBeAttached();
    await expect(detalle).toContainText('54 versos');
    await page.goto('/referencias');
    await expect(
      page.getByText(/Biblioteca Luis Ángel Arango, Banco de la República/),
    ).toBeVisible();
    await expect(page.getByText(/City TV Noticias/)).toBeVisible();
    await expect(page.getByText(/Andika \(SIL International\)/)).toBeVisible();
  });

  test('docentes lista las verificaciones del curso completas', async ({ page }) => {
    await page.goto('/docentes');
    const tabla = page.getByRole('table', { name: 'Verificaciones del curso' });
    await expect(tabla).toBeAttached();
    await expect(tabla.locator('tbody tr')).toHaveCount(6);
    await expect(tabla.getByText('Pendiente', { exact: true })).toHaveCount(0);
    await expect(tabla.getByText('Listo', { exact: true })).toHaveCount(6);
  });
});

import { expect, test, type Page } from '@playwright/test';

/**
 * R-AC-6 — comportamiento de la biblioteca de animaciones con el CSS real de
 * la app. No crea rutas de producción: monta fixtures en la página pública de
 * login y verifica estilos computados y el estado de las animaciones.
 */

const FIXTURE_ID = 'motion-fixture';

const openApp = async (page: Page) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () =>
      getComputedStyle(document.documentElement).getPropertyValue('--motion-duration').trim() !==
      '',
  );
};

const mount = async (page: Page, classes: string) => {
  await page.evaluate(
    ({ id, classes }) => {
      document.getElementById(id)?.remove();
      const element = document.createElement('article');
      element.id = id;
      element.className = classes;
      element.textContent = 'Contenido';
      element.style.width = '160px';
      element.style.height = '48px';
      element.style.background = '#ddd';
      document.body.appendChild(element);
    },
    { id: FIXTURE_ID, classes },
  );
  return page.locator(`#${FIXTURE_ID}`);
};

const readState = async (page: Page) =>
  page.evaluate((id) => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`No existe #${id}`);
    const animation = element.getAnimations()[0];
    const style = getComputedStyle(element);
    return {
      opacity: Number(style.opacity),
      animationName: style.animationName,
      animationPlayState: style.animationPlayState,
      playState: animation?.playState ?? null,
    };
  }, FIXTURE_ID);

/** Muestrea la opacidad para demostrar progreso o estabilidad sin depender de `getAnimations()`. */
const sampleOpacity = async (page: Page, count: number, interval: number) => {
  const samples: number[] = [];
  for (let index = 0; index < count; index += 1) {
    samples.push((await readState(page)).opacity);
    await page.waitForTimeout(interval);
  }
  return samples;
};

const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

test.describe('movimiento normal', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('la entrada completa y deja el contenido visible', async ({ page }) => {
    await openApp(page);
    await mount(page, 'motion-fade-in');

    await expect.poll(async () => (await readState(page)).opacity).toBe(1);
    const state = await readState(page);
    expect(state.animationName).toBe('app-motion-fade-in');
    expect(state.animationPlayState).toBe('running');
  });

  test('motion-pause mantiene la entrada detenida y transparente', async ({ page }) => {
    await openApp(page);
    await mount(page, 'motion-fade-in motion-pause');
    await page.waitForTimeout(200);

    const state = await readState(page);
    expect(state.animationPlayState).toBe('paused');
    expect(state.opacity).toBe(0);
  });

  test('activar movimiento reducido completa una entrada ya pausada', async ({ page }) => {
    await openApp(page);
    await mount(page, 'motion-fade-in motion-pause');
    await page.waitForTimeout(100);
    expect((await readState(page)).opacity).toBe(0);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await readState(page)).opacity).toBe(1);

    const state = await readState(page);
    expect(state.animationPlayState).toBe('running');
  });
});

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('una entrada pausada completa y deja el contenido visible', async ({ page }) => {
    await openApp(page);
    await mount(page, 'motion-fade-in motion-pause');

    await expect.poll(async () => (await readState(page)).opacity).toBe(1);
    const state = await readState(page);
    expect(state.animationPlayState).toBe('running');
  });

  test('una salida completa y deja de ser visible', async ({ page }) => {
    await openApp(page);
    await mount(page, 'motion-fade-out');

    await expect.poll(async () => (await readState(page)).playState).toBe('finished');
    const state = await readState(page);
    expect(state.opacity).toBe(0);
  });
});

test.describe('pausa por hover y motion-running', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('el hover pausa, motion-running reanuda y al quitarlo vuelve a pausar', async ({ page }) => {
    await openApp(page);
    const fixture = await mount(page, 'animate-pulse motion-pause-on-hover');
    await page.waitForTimeout(400);

    await fixture.hover();
    await expect.poll(async () => (await readState(page)).animationPlayState).toBe('paused');
    expect(await fixture.evaluate((element) => element.matches(':hover'))).toBe(true);

    const paused = await sampleOpacity(page, 3, 100);
    expect(spread(paused)).toBeLessThan(0.01);

    await page.evaluate((id) => {
      document.getElementById(id)?.classList.add('motion-running');
    }, FIXTURE_ID);
    await expect.poll(async () => (await readState(page)).animationPlayState).toBe('running');

    const running = await sampleOpacity(page, 5, 100);
    expect(spread(running)).toBeGreaterThan(0.02);

    await page.evaluate((id) => {
      document.getElementById(id)?.classList.remove('motion-running');
    }, FIXTURE_ID);
    await expect.poll(async () => (await readState(page)).animationPlayState).toBe('paused');

    const pausedAgain = await sampleOpacity(page, 3, 100);
    expect(spread(pausedAgain)).toBeLessThan(0.01);
  });

  test('motion-pause + motion-running permite reanudar', async ({ page }) => {
    await openApp(page);
    await mount(page, 'animate-pulse motion-pause motion-running');

    await expect.poll(async () => (await readState(page)).animationPlayState).toBe('running');
    const running = await sampleOpacity(page, 5, 100);
    expect(spread(running)).toBeGreaterThan(0.02);
  });
});

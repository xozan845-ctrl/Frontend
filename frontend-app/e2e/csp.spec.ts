import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';

const read = (path: string) => readFileSync(resolve(path), 'utf8');
const firebase = JSON.parse(read('firebase.json'))
  .hosting.headers.find((entry: { source: string }) => entry.source === '**')
  .headers.find((entry: { key: string }) => entry.key === 'Content-Security-Policy').value;
const nginx = read('../nginx.conf').match(/add_header Content-Security-Policy "([^"]+)"/)![1];
const meta = read('src/index.html').match(
  /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
)![1];
const matrix = JSON.parse(read('scripts/config/csp-resources.json'));
const tileUrl = read(
  'src/app/features/applications/logistica/constants/logistica.constants.ts',
).match(/LOGISTICA_TILE_URL = '([^']+)'/)![1];
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);

for (const [destination, policy] of Object.entries({ firebase, nginx })) {
  test.describe(`F34: cabecera ${destination} junto con CSP del HTML`, () => {
    test.beforeEach(async ({ page }) => {
      // R-E-12: cabeceras reales del repo, respuestas herméticas; nunca storage de producción.
      await page.route('**/*', async (route) => {
        const request = route.request();
        if (request.isNavigationRequest()) {
          return route.fulfill({
            contentType: 'text/html',
            headers: { 'Content-Security-Policy': policy },
            body: `<html><head><meta http-equiv="Content-Security-Policy" content="${meta}"></head><body><div id="map" style="width:512px;height:512px"></div></body></html>`,
          });
        }
        if (request.url().endsWith('/leaflet.js')) {
          return route.fulfill({
            contentType: 'text/javascript',
            body: read('node_modules/leaflet/dist/leaflet.js'),
          });
        }
        return route.fulfill({
          contentType: request.resourceType() === 'image' ? 'image/png' : 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: request.resourceType() === 'image' ? png : '{}',
        });
      });
      await page.goto('/__csp-fixture');
    });

    test('regression: F34 — mapa Leaflet, imágenes y conexiones habilitadas sin bloqueos CSP', async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.addScriptTag({ url: '/leaflet.js' });
      await page.evaluate(`(() => {
        const map = L.map('map').setView([12.1364, -86.2514], 12);
        L.tileLayer(${JSON.stringify(tileUrl)}).addTo(map);
      })()`);
      await expect.poll(() => page.locator('.leaflet-tile-loaded').count()).toBeGreaterThan(0);
      const results = await page.evaluate(
        async ({ imageSources, connections }) => {
          const imageUrls = imageSources
            .filter((source: string) => source.startsWith('https://'))
            .map((source: string) => `${source}/csp-image.png`);
          imageUrls.push(
            '/local.png',
            URL.createObjectURL(
              new Blob(
                [
                  Uint8Array.from(
                    atob(
                      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
                    ),
                    (c) => c.charCodeAt(0),
                  ),
                ],
                { type: 'image/png' },
              ),
            ),
          );
          const images = await Promise.all(
            imageUrls.map(async (url: string) => {
              const image = new Image();
              image.src = url;
              await image.decode();
              if (url.startsWith('blob:')) URL.revokeObjectURL(url);
              return image.naturalWidth;
            }),
          );
          const responses = await Promise.all(
            connections.map(async (source: string) => {
              const response = await fetch(
                source === "'self'" ? '/api-fixture' : `${source}/api-fixture`,
              );
              return response.ok;
            }),
          );
          return { images, responses };
        },
        { imageSources: matrix['img-src'], connections: matrix['connect-src'] },
      );
      expect(results.images.every((width) => width > 0)).toBe(true);
      expect(results.responses.every(Boolean)).toBe(true);
      expect(errors).toEqual([]);
    });

    test('regression: F34 — bloquea hosts ajenos y fondos de video remoto excluidos', async ({
      page,
    }) => {
      const violations = await page.evaluate(async () => {
        const violations: string[] = [];
        document.addEventListener('securitypolicyviolation', (event) =>
          violations.push(event.effectiveDirective),
        );
        for (const url of ['https://untrusted.example/api', 'https://other.kbcoleccion.com/api']) {
          await fetch(url).then(
            () => {
              throw new Error('Se permitió un host ajeno');
            },
            () => undefined,
          );
        }
        await new Promise<void>((resolve) => {
          document.addEventListener('securitypolicyviolation', (event) => {
            if (event.effectiveDirective === 'media-src') resolve();
          });
          const video = document.createElement('video');
          video.src = 'https://storage.kbcoleccion.com/background.mp4';
          document.body.append(video);
          video.load();
        });
        return violations;
      });
      expect(violations).toContain('connect-src');
      expect(violations).toContain('media-src');
    });
  });
}

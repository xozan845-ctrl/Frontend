import assert from 'node:assert/strict';
import test from 'node:test';
import { runSmokeChecks } from './hosting-smoke.mjs';

function fakeFetch(responses) {
  return async (url) => {
    const path = new URL(url).pathname;
    const response = responses[path];
    if (!response) throw new Error(`URL inesperada: ${path}`);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      text: async () => response.body,
    };
  };
}

test('Firebase Hosting smoke valida shell, fallback SPA y config runtime', async () => {
  const result = await runSmokeChecks({
    baseUrl: 'https://frontend.example.com/',
    spaPath: 'tienda/demo/shop',
    fetchImpl: fakeFetch({
      '/': { status: 200, body: '<app-root></app-root>' },
      '/tienda/demo/shop': { status: 200, body: '<app-root></app-root>' },
      '/config.json': { status: 200, body: '{"apiUrl":"https://api.example.com"}' },
    }),
  });

  assert.equal(result.results.length, 3);
  assert.deepEqual(
    result.results.map((check) => check.path),
    ['/', '/tienda/demo/shop', '/config.json'],
  );
});

test('Firebase Hosting smoke falla si una ruta responde error', async () => {
  await assert.rejects(
    runSmokeChecks({
      baseUrl: 'https://frontend.example.com',
      fetchImpl: fakeFetch({
        '/': { status: 200, body: '<app-root></app-root>' },
        '/shop': { status: 404, body: 'Not found' },
      }),
    }),
    /\/shop respondió HTTP 404/,
  );
});

test('Firebase Hosting smoke exige una URL http(s)', async () => {
  await assert.rejects(
    runSmokeChecks({ baseUrl: 'ftp://frontend.example.com', fetchImpl: fakeFetch({}) }),
    /http:\/\/ o https:\/\//,
  );
});

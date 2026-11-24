import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const matrix = JSON.parse(read('../config/csp-resources.json'));
const firebase = JSON.parse(read('../../firebase.json'))
  .hosting.headers.find(({ source }) => source === '**')
  .headers.find(({ key }) => key === 'Content-Security-Policy').value;
const nginx = read('../../../nginx.conf').match(/add_header Content-Security-Policy "([^"]+)"/)[1];
const meta = read('../../src/index.html').match(
  /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
)[1];
const directives = (policy) =>
  Object.fromEntries(
    policy
      .split(';')
      .filter((part) => part.trim())
      .map((part) => {
        const [name, ...sources] = part.trim().split(/\s+/);
        return [name, sources.sort()];
      }),
  );

// regression: F34 — la misma lista funcional debe pasar por ambas cabeceras y el HTML.
test('F34: Firebase y nginx aplican la misma CSP', () => {
  assert.deepEqual(directives(firebase), directives(nginx));
});

for (const [destination, policy] of Object.entries({ firebase, nginx, meta })) {
  test(`F34: ${destination} permite solo los recursos de la matriz común`, () => {
    const actual = directives(policy);
    for (const [directive, sources] of Object.entries(matrix)) {
      const expected = [...sources];
      if (destination === 'meta' && directive === 'connect-src') {
        expected.push('http://localhost:8080', 'http://localhost:3000');
      }
      assert.deepEqual(actual[directive], expected.sort(), directive);
      assert.ok(actual[directive].every((source) => !source.includes('*') && source !== 'https:'));
    }
  });
}

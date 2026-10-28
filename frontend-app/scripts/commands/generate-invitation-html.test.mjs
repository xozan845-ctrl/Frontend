import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInvitationHtml } from './generate-invitation-html.mjs';

const INDEX = `<!doctype html>
<html lang="es">
  <head>
    <title>Quantum Store — Hardware Premium</title>
    <meta name="description" content="Descripción del sitio." />
    <meta property="og:site_name" content="Quantum Store" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Quantum Store — Hardware Premium" />
    <meta property="og:image" content="https://app.test/og-image.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:image" content="https://app.test/og-image.png" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>`;

test('genera metadatos de invitación y conserva el shell de Angular', () => {
  const html = buildInvitationHtml(INDEX, 'https://app.test/');

  assert.match(html, /<title>Invitación de vendedor \| Quantum Store<\/title>/);
  assert.match(html, /<app-root><\/app-root>/);
  assert.match(html, /<meta name="description" content="Descripción del sitio\." \/>/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/);
  assert.match(html, /<meta property="og:title" content="Tu tienda te espera" \/>/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/app\.test\/og-invitacion\.png" \/>/,
  );
  assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.doesNotMatch(html, /og:image" content="https:\/\/app\.test\/og-image\.png"/);
  assert.doesNotMatch(html, /og:title" content="Quantum Store — Hardware Premium"/);
});

test('rechaza un HTML sin el punto de montaje de Angular', () => {
  assert.throws(() => buildInvitationHtml('<html><head></head><body></body></html>'), {
    message: /<app-root>/,
  });
});

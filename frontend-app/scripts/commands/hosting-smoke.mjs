/**
 * Smoke post-deploy para el frontend servido por Firebase Hosting (R-CD-9).
 *
 * Uso:
 *   FRONTEND_URL=https://frontend.example.com npm run hosting:smoke
 *   node scripts/commands/hosting-smoke.mjs --url https://frontend.example.com --spa-path /shop
 */

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--url') options.url = argv[++index];
    if (argument === '--spa-path') options.spaPath = argv[++index];
  }
  return options;
}

function normalizePath(path, fallback) {
  const value = (path || fallback).trim();
  return value.startsWith('/') ? value : `/${value}`;
}

function resolveBaseUrl(value) {
  if (!value) throw new Error('Falta FRONTEND_URL o --url con el dominio desplegado.');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('FRONTEND_URL debe usar http:// o https://.');
  }
  return url.toString().replace(/\/$/, '');
}

async function request(baseUrl, path, fetchImpl) {
  const url = new URL(path, `${baseUrl}/`).toString();
  const response = await fetchImpl(url, { redirect: 'follow' });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${path} respondió HTTP ${response.status}.`);
  }
  return { url, body };
}

export async function runSmokeChecks({ baseUrl, spaPath = '/shop', fetchImpl = fetch } = {}) {
  const normalizedBaseUrl = resolveBaseUrl(baseUrl);
  const normalizedSpaPath = normalizePath(spaPath, '/shop');
  const checks = [
    { path: '/', label: 'shell raíz', requiresShell: true },
    { path: normalizedSpaPath, label: `ruta SPA ${normalizedSpaPath}`, requiresShell: true },
    { path: '/config.json', label: 'configuración de runtime', requiresJson: true },
  ];
  const results = [];

  for (const check of checks) {
    const response = await request(normalizedBaseUrl, check.path, fetchImpl);
    if (check.requiresShell && !response.body.includes('<app-root')) {
      throw new Error(`${check.label} no contiene el punto de montaje <app-root>.`);
    }
    if (check.requiresJson) {
      try {
        JSON.parse(response.body);
      } catch {
        throw new Error(`${check.label} no contiene JSON válido.`);
      }
    }
    results.push({ ...check, status: 200 });
  }

  return { baseUrl: normalizedBaseUrl, results };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  runSmokeChecks({
    baseUrl: options.url ?? process.env.FRONTEND_URL,
    spaPath: options.spaPath ?? process.env.FRONTEND_SPA_PATH ?? '/shop',
  })
    .then(({ baseUrl, results }) => {
      for (const result of results) console.log(`✓ ${result.label}: ${baseUrl}${result.path}`);
      console.log('Firebase Hosting smoke OK.');
    })
    .catch((error) => {
      console.error(`Firebase Hosting smoke FAILED: ${error.message}`);
      process.exitCode = 1;
    });
}

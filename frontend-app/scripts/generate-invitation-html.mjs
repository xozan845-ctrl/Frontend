#!/usr/bin/env node
/**
 * Genera `dist/frontend-app/browser/invitacion.html` a partir del `index.html`
 * compilado.
 *
 * WhatsApp (y otros crawlers) no ejecutan JavaScript: leen el HTML que sirve
 * Firebase Hosting. Como la SPA reescribe todas las rutas a `index.html`, una
 * invitación compartida mostraba el host y la URL cruda. Este archivo conserva
 * el mismo shell de Angular pero con metadatos Open Graph propios de la
 * invitación; `firebase.json` lo sirve en `/i/**` y `/registro/vendedor`.
 *
 * Uso: `npm run build` (se ejecuta como `postbuild`).
 */
import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PUBLIC_ORIGIN = (
  process.env.FRONTEND_URL ?? 'https://kb-coleccion-internacional-ni.web.app'
).replace(/\/+$/, '');

const INVITATION_TITLE = 'Invitación de vendedor | Quantum Store';
const OG_TITLE = 'Tu tienda te espera';
const OG_DESCRIPTION = 'Acepta la invitación y empieza a vender con tu propia tienda.';
const SITE_NAME = 'Quantum Store';

/**
 * Sustituye el título y los metadatos sociales del shell compilado. Exportada
 * para probarla sin tocar el sistema de archivos.
 */
export function buildInvitationHtml(indexHtml, origin = PUBLIC_ORIGIN) {
  const base = origin.replace(/\/+$/, '');
  const image = `${base}/og-invitacion.png`;

  let html = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${INVITATION_TITLE}</title>`)
    .replace(/<meta\b[^>]*\b(?:property|name)="(?:og:[^"]+|twitter:[^"]+|robots)"[^>]*>\s*/gi, '');

  const tags = [
    '<meta name="robots" content="noindex, nofollow" />',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${OG_TITLE}" />`,
    `<meta property="og:description" content="${OG_DESCRIPTION}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="Invitación de vendedor — ${SITE_NAME}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:locale" content="es_NI" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${OG_TITLE}" />`,
    `<meta name="twitter:description" content="${OG_DESCRIPTION}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');

  html = html.replace(/<\/head>/i, `    ${tags}\n  </head>`);

  if (!html.includes('<app-root>')) {
    throw new Error('El index compilado no contiene <app-root>.');
  }
  return html;
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const browserDir = join(root, 'dist/frontend-app/browser');
  const indexPath = join(browserDir, 'index.html');
  const outputPath = join(browserDir, 'invitacion.html');

  let indexHtml;
  try {
    indexHtml = await readFile(indexPath, 'utf8');
  } catch {
    console.error(
      'No se encontró el build compilado. Ejecuta `npm run build` antes de generar la invitación.',
    );
    throw new Error(`Falta ${indexPath}`);
  }

  const html = buildInvitationHtml(indexHtml);
  await writeFile(outputPath, html, 'utf8');

  const { size } = await stat(outputPath);
  console.log(
    `Invitación HTML generada: ${outputPath} (${Math.round(size / 1024)} KB, OG ${PUBLIC_ORIGIN}/og-invitacion.png)`,
  );
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  await main();
}

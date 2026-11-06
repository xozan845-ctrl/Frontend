/**
 * Genera `public/version.json` desde `package.json` antes de build/start.
 * El aviso de actualización lo consulta para mostrar la versión desplegada
 * sin recompilar el bundle (R-UX-6, R-CD-4).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const payload = `${JSON.stringify({ version }, null, 2)}\n`;

writeFileSync(join(root, 'public/version.json'), payload);
console.log(`version.json: v${version}`);

/**
 * Falla si el build de Angular emite el aviso de presupuesto (`R-PF-1`).
 *
 * El `maximumError` de `angular.json` ya rompe el build; este check convierte
 * también el `maximumWarning` en gate real: cualquier crecimiento por encima
 * del techo ratchet hace fallar CI. Requiere `build.log` (generado con
 * `npm run build 2>&1 | tee build.log`).
 */
import { readFileSync } from 'node:fs';

const log = readFileSync('build.log', 'utf8');
const exceeded = log.match(/bundle initial exceeded maximum budget\. ([^\n]+)/);

if (exceeded) {
  console.error(`Presupuesto inicial superado (R-PF-1): ${exceeded[1]}`);
  process.exit(1);
}

console.log('Presupuesto inicial dentro del techo (R-PF-1).');

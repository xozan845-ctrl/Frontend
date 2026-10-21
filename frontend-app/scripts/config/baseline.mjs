/**
 * config/baseline.mjs — Deuda arquitectónica aceptada.
 *
 * GENERADO por `npm run rules:baseline`. Cada clave es un hallazgo que ya
 * existía al introducir el motor. El check falla ante hallazgos NUEVOS.
 * Elimina entradas al corregir la deuda; no las añadas para silenciar
 * violaciones nuevas.
 */
export const baseline = {
  'architecture-types': [],
  'architecture-layers': [],
  'architecture-lifecycle': [
    'src/app/layout/navbar/navbar.component.ts|R-AR-15|ngOnInit',
    'src/app/shared/directives/scroll-reveal.directive.ts|R-AR-15|ngOnInit',
    'src/app/shared/ui/pwa-install/pwa-install-banner.component.ts|R-AR-15|ngOnInit',
  ],
  'architecture-config': [],
  'architecture-packaging': [],
};

/** Claves aceptadas para una suite (para validar el propio baseline). */
export function baselineFor(suiteId) {
  return new Set(baseline[suiteId] ?? []);
}

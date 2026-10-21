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
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/ai-scraper/pages/ai-job-detail/ai-job-detail.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/logistica/components/map-panel/map-panel.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/products/components/quick-view-modal/quick-view-modal.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/products/pages/product-detail/product-detail.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/products/pages/search-autocomplete/search-autocomplete.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/vendor/pages/clients/clients.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/vendor/pages/new-order/new-order.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/vendor/pages/order-detail/order-detail.component.ts|R-AR-15|ngOnDestroy',
    'src/app/layout/navbar/navbar.component.ts|R-AR-15|ngOnInit',
    'src/app/shared/directives/focus-trap.directive.ts|R-AR-15|ngOnDestroy',
    'src/app/shared/directives/scroll-reveal.directive.ts|R-AR-15|ngOnDestroy',
    'src/app/shared/directives/scroll-reveal.directive.ts|R-AR-15|ngOnInit',
    'src/app/shared/ui/pwa-install/pwa-install-banner.component.ts|R-AR-15|ngOnDestroy',
    'src/app/shared/ui/pwa-install/pwa-install-banner.component.ts|R-AR-15|ngOnInit',
  ],
  'architecture-config': [],
  'architecture-packaging': [],
};

/** Claves aceptadas para una suite (para validar el propio baseline). */
export function baselineFor(suiteId) {
  return new Set(baseline[suiteId] ?? []);
}

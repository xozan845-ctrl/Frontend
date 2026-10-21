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
    'src/app/features/account/pages/account/account.component.ts|R-AR-15|ngOnInit',
    'src/app/features/account/pages/orders/orders.component.ts|R-AR-15|ngOnInit',
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts|R-AR-15|constructor',
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts|R-AR-15|ngOnInit',
    'src/app/features/ai-scraper/pages/ai-job-detail/ai-job-detail.component.ts|R-AR-15|constructor',
    'src/app/features/ai-scraper/pages/ai-job-detail/ai-job-detail.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/auth/pages/register-form/register-form.component.ts|R-AR-15|constructor',
    'src/app/features/billing/pages/invoice-detail/invoice-detail.component.ts|R-AR-15|constructor',
    'src/app/features/home/pages/home/home.component.ts|R-AR-15|ngOnInit',
    'src/app/features/home/pages/store-entry/store-entry.component.ts|R-AR-15|constructor',
    'src/app/features/logistica/components/map-panel/map-panel.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/logistica/pages/dashboard/dashboard.component.ts|R-AR-15|constructor',
    'src/app/features/products/components/product-card/product-card.component.ts|R-AR-15|constructor',
    'src/app/features/products/components/quick-view-modal/quick-view-modal.component.ts|R-AR-15|constructor',
    'src/app/features/products/components/quick-view-modal/quick-view-modal.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/products/pages/product-detail/product-detail.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/products/pages/product-list/product-list.component.ts|R-AR-15|ngOnInit',
    'src/app/features/products/pages/search-autocomplete/search-autocomplete.component.ts|R-AR-15|constructor',
    'src/app/features/products/pages/search-autocomplete/search-autocomplete.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/vendor/pages/clients/clients.component.ts|R-AR-15|constructor',
    'src/app/features/vendor/pages/clients/clients.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/vendor/pages/dashboard/dashboard.component.ts|R-AR-15|constructor',
    'src/app/features/vendor/pages/new-order/new-order.component.ts|R-AR-15|constructor',
    'src/app/features/vendor/pages/new-order/new-order.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/vendor/pages/order-detail/order-detail.component.ts|R-AR-15|constructor',
    'src/app/features/vendor/pages/order-detail/order-detail.component.ts|R-AR-15|ngOnDestroy',
    'src/app/features/vendor/pages/orders/orders.component.ts|R-AR-15|constructor',
    'src/app/layout/navbar/navbar.component.ts|R-AR-15|ngOnInit',
    'src/app/shared/directives/focus-trap.directive.ts|R-AR-15|ngOnDestroy',
    'src/app/shared/directives/scroll-reveal.directive.ts|R-AR-15|ngOnDestroy',
    'src/app/shared/directives/scroll-reveal.directive.ts|R-AR-15|ngOnInit',
    'src/app/shared/ui/coming-soon/coming-soon.component.ts|R-AR-15|ngOnInit',
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

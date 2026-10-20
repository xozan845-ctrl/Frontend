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
  'architecture-layers': [
    'src/app/features/account/pages/account/account.component.ts|R-SO-8|AUTH_REPOSITORY',
    'src/app/features/account/pages/order-detail/order-detail.component.ts|R-SO-8|ORDER_REPOSITORY',
    'src/app/features/account/pages/orders/orders.component.ts|R-SO-8|ORDER_REPOSITORY',
    'src/app/features/ai-scraper/pages/ai-dashboard/ai-dashboard.component.ts|layer|src/app/features/ai-scraper/services/ai-connection.service.ts',
    'src/app/features/auth/pages/forgot-password/forgot-password.component.ts|R-SO-8|AUTH_REPOSITORY',
    'src/app/features/auth/pages/forgot-password/forgot-password.component.ts|layer|src/app/features/auth/repositories/auth.repository.ts',
    'src/app/features/billing/adapters/fixtures/billing.fixture.ts|layer|src/app/features/billing/constants/billing.constants.ts',
    'src/app/features/billing/models/billing.model.ts|layer|src/app/features/billing/constants/billing.constants.ts',
    'src/app/features/billing/pages/invoice-detail/invoice-detail.component.ts|layer|src/app/features/billing/adapters/fixtures/billing.fixture.ts',
    'src/app/features/billing/pages/invoices/invoices.component.ts|layer|src/app/features/billing/adapters/fixtures/billing.fixture.ts',
    'src/app/features/cart/pages/checkout/checkout.component.ts|R-SO-8|ORDER_REPOSITORY',
    'src/app/features/cart/pages/checkout/checkout.component.ts|layer|src/app/features/cart/repositories/order.repository.ts',
    'src/app/features/logistica/components/map-panel/map-panel.component.ts|layer|src/app/features/logistica/services/leaflet-api.ts',
    'src/app/layout/footer/footer.component.ts|layer|src/app/features/products/public-api.ts',
    'src/app/layout/navbar/navbar.component.ts|layer|src/app/features/auth/public-api.ts',
    'src/app/layout/navbar/navbar.component.ts|layer|src/app/features/cart/public-api.ts',
    'src/app/layout/navbar/navbar.component.ts|layer|src/app/features/products/public-api.ts',
    'src/app/layout/navbar/navbar.component.ts|layer|src/app/features/wishlist/public-api.ts',
  ],
  'architecture-config': [
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts|R-AR-11|https://books.toscrape.com/',
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts|R-AR-11|https://quotes.toscrape.com/',
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts|R-AR-11|https://scrapethissite.com/',
  ],
};

/** Claves aceptadas para una suite (para validar el propio baseline). */
export function baselineFor(suiteId) {
  return new Set(baseline[suiteId] ?? []);
}

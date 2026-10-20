/**
 * config/baseline.mjs — Deuda arquitectónica aceptada.
 *
 * GENERADO por `npm run rules:baseline`. Cada clave es un hallazgo que ya
 * existía al introducir el motor. El check falla ante hallazgos NUEVOS.
 * Elimina entradas al corregir la deuda; no las añadas para silenciar
 * violaciones nuevas.
 */
export const baseline = {
  'architecture-types': [
    'src/app/core/config/api.config.ts:ApiConfiguration',
    'src/app/core/config/api.config.ts:ApiEndpointsConfig',
    'src/app/core/config/currency.config.ts:CurrencyConfig',
    'src/app/core/constants/company.constants.ts:CompanyInfo',
    'src/app/core/services/notification.service.ts:Notification',
    'src/app/core/services/notification.service.ts:NotificationType',
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts:ChatSuggestion',
    'src/app/features/ai-scraper/pages/ai-chat/ai-chat.component.ts:SessionGroup',
    'src/app/features/ai-scraper/pages/ai-job-detail/ai-job-detail.component.ts:DetailTab',
    'src/app/features/ai-scraper/state/ai-jobs.store.ts:AiJobsState',
    'src/app/features/ai-scraper/state/ai-session.store.ts:AiSessionState',
    'src/app/features/auth/state/auth.store.ts:AuthState',
    'src/app/features/billing/components/billing-sidebar/billing-sidebar.component.ts:BillingNavItem',
    'src/app/features/billing/components/billing-sidebar/billing-sidebar.component.ts:BillingSoonItem',
    'src/app/features/billing/components/invoice-draft-panel/invoice-draft-panel.component.ts:InvoiceLineQuantityChange',
    'src/app/features/billing/pages/new-invoice/new-invoice.component.ts:BillingNotice',
    'src/app/features/cart/services/cart.service.ts:MockItem',
    'src/app/features/cart/state/cart-ui.store.ts:CartUiState',
    'src/app/features/cart/state/cart.store.ts:CartState',
    'src/app/features/cart/state/order.store.ts:OrderState',
    'src/app/features/logistica/components/clients-table/clients-table.component.ts:ClientRow',
    'src/app/features/logistica/components/deliveries-donut/deliveries-donut.component.ts:DonutArc',
    'src/app/features/logistica/components/logistica-sidebar/logistica-sidebar.component.ts:LogisticaNavItem',
    'src/app/features/logistica/services/leaflet-api.ts:LeafletApi',
    'src/app/features/logistica/state/logistica-dashboard.store.ts:LogisticaDashboardState',
    'src/app/features/plans/constants/plans.constants.ts:PlanFeature',
    'src/app/features/plans/constants/plans.constants.ts:PlanTier',
    'src/app/features/products/adapters/product.adapter.ts:CatalogEntry',
    'src/app/features/products/pages/search-autocomplete/search-autocomplete.component.ts:HighlightPart',
    'src/app/features/products/state/product.store.ts:ProductState',
    'src/app/features/products/state/recently-viewed.store.ts:RecentlyViewedState',
    'src/app/features/products/state/reviews.store.ts:ReviewsState',
    'src/app/features/stores/pages/create-store/create-store.component.ts:ProductRow',
    'src/app/features/stores/state/store-wizard.store.ts:StoreWizardState',
    'src/app/features/vendor/components/order-draft-panel/order-draft-panel.component.ts:OrderLineQuantityChange',
    'src/app/features/vendor/components/vendor-sidebar/vendor-sidebar.component.ts:VendorNavItem',
    'src/app/features/vendor/pages/order-detail/order-detail.component.ts:TimelineStep',
    'src/app/features/vendor/state/client-search.store.ts:ClientSearchState',
    'src/app/features/vendor/state/order-draft.store.ts:OrderDraftState',
    'src/app/features/vendor/state/vendor-catalog.store.ts:VendorCatalogState',
    'src/app/features/vendor/state/vendor-orders.store.ts:VendorOrdersState',
    'src/app/features/vendor/state/vendor-orders.store.ts:VendorTodayKpis',
    'src/app/features/wishlist/state/wishlist.store.ts:WishlistState',
    'src/app/shared/ui/empty-state/empty-state.component.ts:EmptyStateVariant',
    'src/app/shared/ui/pwa-install/pwa-install-banner.component.ts:BeforeInstallPromptEvent',
    'src/app/shared/ui/trust-badges/trust-badges.component.ts:TrustBadge',
  ],
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

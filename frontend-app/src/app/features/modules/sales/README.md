# modules/sales/ — Composición de Ventas y Pedidos

Módulo de workspace que compone la experiencia de ventas de empresa y los
pedidos/POS del vendedor sobre los dominios y stores de sus features.

## Empresa

- `pages/company-sales`: KPIs, recurrentes, historial, filtros, paginación y
  modales de venta.
- `components/company-new-sale-modal`: asistente de nueva venta.
- `components/company-quick-sale-modal`: venta rápida.
- `components/company-sale-payment-methods`: selector de forma de pago.
- `sales.routes.ts`: ruta lazy y providers del store, portal y catálogo.

## Vendedor

- `pages/orders`: lista completa con filtro por estado.
- `pages/order-detail`: detalle, líneas y cambio de estado.
- `pages/new-order`: punto de venta.
- `components/client-picker`, `create-client-modal`, `order-draft-panel`,
  `order-info-fields`, `order-line`, `product-pick-card`,
  `product-pick-grid`, `quantity-stepper` y `confirm-modal`: piezas del POS.
- `recent-orders-table` sigue en `features/vendor` porque también lo usa el
  inicio del panel.

La empresa carga `sales.routes.ts` desde `EMPRESAS_ROUTES`; el vendedor carga
las páginas desde `VENDOR_ROUTES` y mantiene sus stores en el shell para que
sobrevivan a la navegación. El dominio, los stores y los adaptadores siguen en
sus features; el módulo solo compone presentación y providers (ADR-63/64).
`features/empresas/public-api` y `features/vendor/public-api` exponen lo que el
módulo necesita, sin exportar rutas de workspace.

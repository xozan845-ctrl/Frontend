# modules/sales/ — Composición de Ventas

Módulo de workspace que compone la pantalla de Ventas de empresa sobre el
dominio, el store y los adaptadores de `features/empresas`.

- `pages/company-sales`: página de KPIs, recurrentes, historial, filtros,
  paginación y modales de venta.
- `components/company-new-sale-modal`: asistente de nueva venta.
- `components/company-quick-sale-modal`: venta rápida.
- `components/company-sale-payment-methods`: selector de forma de pago de los
  modales.
- `sales.routes.ts`: ruta lazy y providers del store, portal y catálogo.

La empresa carga este módulo desde `EMPRESAS_ROUTES`. El dominio de pedidos,
clientes y ventas sigue en sus features; el módulo solo compone la experiencia
(ADR-63). `features/empresas/public-api` expone los stores, tokens y tipos que
el módulo necesita, sin exportar las rutas del workspace.

# modules/cash/ — Composición de Caja

Módulo de la pantalla de Caja de empresa sobre el dominio `features/domains/cash`.

- `pages/cash`: centro financiero con saludo, seis KPIs, tabs, pills de período,
  búsqueda, movimientos, cierres, caja chica, bancos y transferencias.
- `components/cash-movement-modal`: alta/edición de movimientos de caja y banco.
- `components/cash-report-modal`: filtros de reporte y exportación Excel/PDF.
- `cash.routes.ts`: ruta lazy y `CashStore`.

El dominio, adaptador y store viven en `features/domains/cash`; el módulo solo
compone la experiencia (ADR-73/74).

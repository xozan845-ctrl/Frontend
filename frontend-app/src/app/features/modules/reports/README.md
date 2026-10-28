# modules/reports/ — Composición de Reportes

Módulo compartido por empresa y vendedor. La página recibe `REPORTS_SCOPE_CONFIG`
y consume el `ReportsStore`, cuya fuente (`REPORTS_DATA_SOURCE`) provee el
workspace.

- `pages/reports`: KPIs de ventas, pedidos y ticket promedio; días recientes y
  desglose por estado.
- `reports.routes.ts`: ruta lazy y `ReportsStore`.

El dominio, el puerto y el adaptador viven en `features/reports`; las fuentes de
empresa y tienda en sus features (ADR-71).

# reports/ — Dominio de reportes

Reportes de ventas compartidos por empresa y tienda. El dominio no conoce HTTP:
la fuente de datos de cada workspace implementa `ReportsDataSource` y traduce
los estados propios de su API antes del cálculo común.

| Capa            | Responsabilidad                                                          |
| --------------- | ------------------------------------------------------------------------ |
| `models/`       | Entrada, día, estado y snapshot normalizados; política pura de métricas. |
| `repositories/` | Puerto `REPORTS_DATA_SOURCE` con `snapshot`, `loading` y `load`.         |
| `adapters/`     | Normalización de entradas externas (fechas, montos y estados) al modelo. |
| `state/`        | `ReportsStore` con snapshot, días recientes y carga delegada.            |

`buildReportSnapshot` (`models/report-metrics/`) es una función pura sobre
`ReportEntry` normalizado: separa pedidos creados, ventas reconocidas, cobros,
cancelaciones, devoluciones y neto (ADR-85). Las fuentes viven en
`features/applications/company` y `features/domains/store-sales`; la composición
en `features/modules/shared/reports` (ADR-71).

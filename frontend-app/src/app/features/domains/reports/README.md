# reports/ — Dominio de reportes

Reportes de ventas compartidos por empresa y tienda. El dominio no conoce HTTP:
la fuente de datos de cada workspace implementa `ReportsDataSource`.

| Capa            | Responsabilidad                                                  |
| --------------- | ---------------------------------------------------------------- |
| `models/`       | Entrada, día, estado y snapshot del reporte.                     |
| `repositories/` | Puerto `REPORTS_DATA_SOURCE` con `snapshot`, `loading` y `load`. |
| `adapters/`     | Agrupación por día/estado, total y ticket promedio.              |
| `state/`        | `ReportsStore` con snapshot, días recientes y carga delegada.    |

Las fuentes viven en `features/empresas` y `features/vendor`; la composición
en `features/modules/reports` (ADR-71).

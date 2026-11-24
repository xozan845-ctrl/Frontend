# reports/ — Dominio de reportes

Reportes de ventas compartidos por empresa y tienda. El dominio no conoce HTTP:
la fuente de datos de cada workspace implementa el puerto de lectura y expone su
estado con señales de Angular.

| Capa            | Responsabilidad                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| `models/`       | Entrada, día, estado y snapshot del reporte.                                 |
| `services/`     | Puerto puro `ReportsSourcePort` (lectura sin señales, R-NC-1).               |
| `repositories/` | Contrato Angular `ReportsDataSource` y token `REPORTS_DATA_SOURCE` (R-AR-3). |
| `adapters/`     | Agrupación por día/estado, total y ticket promedio.                          |
| `state/`        | `ReportsStore` con snapshot, días recientes y carga delegada.                |

`ReportsSourcePort.read()` devuelve las entradas normalizadas y el instante de
la lectura sin depender de Angular; `ReportsDataSource` añade `snapshot`,
`loading` y `load` para la composición visual. Las fuentes viven en
`features/applications/company` y `features/domains/store-sales`; la composición
en `features/modules/shared/reports` (ADR-71).

# shared/orders/ — Primitivos de pedidos compartidos

Componentes y metadatos de pedidos reutilizados por **Ventas de empresa** y por
**Pedidos / POS del vendedor**.

| Unidad               | Responsabilidad                                                           |
| -------------------- | ------------------------------------------------------------------------- |
| `models/`            | Tono/estado y contrato de la tabla (`OrderTableRow`, `OrderTableColumn`). |
| `constants/`         | `ORDER_STATUS_META` para estados de empresa y vendedor.                   |
| `repositories/`      | `OrdersDataSource` y fábrica del token de cada fuente de pedidos.         |
| `state/with-orders`  | Store compartido de lista, detalle, recarga y cambio de estado.           |
| `order-status-badge` | Badge accesible con etiqueta y color por estado.                          |
| `order-totals`       | Subtotal, descuento, IVA opcional y total; descuento editable o fijo.     |
| `order-table`        | Tabla configurable de pedidos por columnas y filas normalizadas.          |

La empresa y el vendedor usan vocabularios de estado distintos; el módulo los
normaliza a una tabla común de presentación (ADR-57). El IVA y el descuento se
configuran por flujo para no imponer la lógica del POS a una venta rápida.

`order-table` no conoce stores ni rutas de negocio: recibe `rows`, `columns`,
un formato de fecha y los `data-testid` que cada pantalla necesita. Ventas de
empresa configura las nueve columnas de su tabla; Pedidos recientes del vendedor
usa el subconjunto pedido/cliente/total/estado/fecha y añade el enlace al
detalle mediante `numberHref` (ADR-61).

`withOrders<T, S>` es la feature de estado común: recibe el token de un
`OrdersDataSource` y aporta `orderRecords`, carga visible, recarga silenciosa,
detalle y cambio de estado con avisos. Solo `list` es obligatorio
(`detail`/`updateStatus` son capacidades opcionales). El tipo `T` y el estado
`S` son los del workspace; los derivados de cada pantalla siguen en su store.
`OrdersFeatureOptions` permite adaptar los mensajes (por ejemplo, "ventas" en
empresa). Pedidos del vendedor y Ventas de empresa ya la usan; empresa solo
implementa `list` porque su pantalla es de lectura (ADR-62).

> Fase 2: estado, badge, totales, tabla y store compartidos; el modelo/adaptador
> vive en `features/orders`. La composición del módulo sigue pendiente.

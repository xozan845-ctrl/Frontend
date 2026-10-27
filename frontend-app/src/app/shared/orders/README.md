# shared/orders/ — Primitivos de pedidos compartidos

Componentes y metadatos de pedidos reutilizados por **Ventas de empresa** y por
**Pedidos / POS del vendedor**.

| Unidad               | Responsabilidad                                                           |
| -------------------- | ------------------------------------------------------------------------- |
| `models/`            | Tono/estado y contrato de la tabla (`OrderTableRow`, `OrderTableColumn`). |
| `constants/`         | `ORDER_STATUS_META` para estados de empresa y vendedor.                   |
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

> Fase 2: estado, badge, totales y tabla compartidos; el modelo/adaptador vive
> en `features/orders`. El store compartido y la composición del módulo siguen
> pendientes.

# shared/orders/ — Primitivos de pedidos compartidos

Componentes y metadatos de pedidos reutilizados por **Ventas de empresa** y por
**Pedidos / POS del vendedor**.

| Unidad               | Responsabilidad                                                       |
| -------------------- | --------------------------------------------------------------------- |
| `models/`            | Tono y metadatos de estado de pedido.                                 |
| `constants/`         | `ORDER_STATUS_META` para estados de empresa y vendedor.               |
| `order-status-badge` | Badge accesible con etiqueta y color por estado.                      |
| `order-totals`       | Subtotal, descuento, IVA opcional y total; descuento editable o fijo. |

La empresa y el vendedor usan vocabularios de estado distintos; el módulo los
normaliza a una tabla común de presentación (ADR-57). El IVA y el descuento se
configuran por flujo para no imponer la lógica del POS a una venta rápida.

> Fase 1: se comparten estado, badge y totales. La unificación del modelo,
> adaptador, store y tabla de pedidos queda como siguiente fase.

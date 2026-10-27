# orders/ — Dominio compartido de pedidos

Modelo y adaptador normalizado para los pedidos de empresa y vendedor.

| Capa        | Responsabilidad                                              |
| ----------- | ------------------------------------------------------------ |
| `models/`   | `Order`, `OrderLine` y campos opcionales de ambos contratos. |
| `adapters/` | Normalización tolerante de `OrderView`/pedidos del vendedor. |

`Order.status` conserva el texto del contrato de origen; la presentación usa
`shared/orders` (`ORDER_STATUS_META`, badge y totales). El adaptador acepta
`snake_case`/`camelCase`, envelopes, centavos, cliente anidado y líneas con
`oferta_id` o `producto_id`.

El feature es `domainOnly` (ADR-60): no tiene páginas ni rutas. Empresa y
vendedor lo consumen desde sus adaptadores actuales.

El estado reutilizable no vive aquí: `shared/orders/state/with-orders` aporta el
store común y `shared/orders/order-table` la tabla, para que el dominio siga sin
dependencias de UI ni de estado y no arrastre esas piezas al bundle inicial
(ADR-62). Pedidos del vendedor y Ventas de empresa ya usan el store; empresa
solo implementa la capacidad de listado. La composición de Ventas y de Pedidos/POS del vendedor vive en
`features/modules/sales` (ADR-63/64).

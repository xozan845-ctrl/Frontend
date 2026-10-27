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
vendedor lo consumen desde sus adaptadores actuales. La siguiente fase moverá
el store/tabla compartidos y la composición a `features/modules/sales`.

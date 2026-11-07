# domains/store-sales/ — Ventas, pedidos y catálogo de tienda

Dominio del POS y los pedidos del vendedor. Consume `domains/orders` y
`domains/clients`.

- `models/`: pedidos, ofertas, productos, clientes del POS y borradores.
- `adapters/`: normalización de pedidos, ofertas y productos.
- `repositories/`: puertos de clientes, pedidos, ofertas y productos.
- `services/`: implementaciones HTTP, fuente de pedidos y reportes de tienda.
- `state/`: búsqueda de clientes, borrador de pedido, catálogo, ofertas y
  pedidos.
- `constants/`: estados, IVA, intervalos y configuración de reportes.

La composición visual vive en `features/modules/shared/sales`; el shell y el branding
de tienda siguen en `applications/store`.

# domains/company-sales/ — Ventas y portal de empresa

Dominio de ventas de empresa, pedidos del portal y tiendas del tenant. Consume
`domains/catalog`, `domains/clients` y `domains/orders`.

- `models/`: ventas, filas, KPIs, tiendas y resúmenes del portal.
- `adapters/`: normalización de ventas, pedidos y tiendas.
- `repositories/`: puerto `COMPANY_PORTAL_REPOSITORY` y fuente de pedidos.
- `services/`: implementación HTTP y `createCompanyOrdersSource`.
- `state/`: `CompanySalesStore` y `CompanyPortalStore`.
- `constants/`: periodos, métodos de pago y claves de persistencia.

La composición visual de ventas vive en `features/modules/sales`; el portal de
tiendas y vendedores se consume desde `applications/empresas`.

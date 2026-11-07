# applications/store/ — Workspace de tienda

Experiencia `/app/tienda`: shell, guard, páginas de inicio, productos y tienda,
branding y tabla de pedidos recientes. El POS, pedidos, ofertas, catálogo y
clientes viven en `features/domains/store-sales` y se consumen por su API
pública.

- `pages/`: dashboard, productos, tienda y shell.
- `guards/`: acceso por rol de vendedor.
- `components/recent-orders-table`: UI reutilizada por el inicio.
- `state/vendor-store` y `state/store-logo`: branding del shell.

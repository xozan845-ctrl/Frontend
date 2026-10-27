# modules/clients/ — Composición de Clientes

Módulo de workspace que compone el dominio compartido `features/clients`.

- `pages/clients`: página de cartera, KPIs, tabs, filtros y paginación.
- `components/client-modal`: alta manual de cliente.
- `clients.routes.ts`: ruta lazy y providers del store/fuente de datos.

La empresa y el vendedor cargan este mismo módulo; el workspace padre inyecta
`CLIENTS_PAGE_CONFIG` y `CLIENTS_SCOPE_CONFIG` para decidir endpoint, storage y
presentación (ADR-56/ADR-59).

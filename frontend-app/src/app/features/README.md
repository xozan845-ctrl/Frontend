# features/ — Dominios de negocio

Cada feature es una unidad autocontenida. Los features concretos viven dentro
de un grupo explícito y conservan la misma estructura interna:

```text
features/<grupo>/<feature>/
├── pages/            # destinos de ruta (contenedores)
├── components/       # presentacionales internos
├── state/            # signalStore / estado de feature
├── services/         # lógica de aplicación
├── repositories/     # puertos + InjectionToken
├── adapters/         # normalización del backend (ACL)
├── models/           # dominio, DTOs y tipos
├── constants/        # constantes del feature
└── <feature>.routes.ts
```

## Tipos de feature y ubicación

Los hermanos directos de `features/` no son un accidente: representan dos
tipos distintos de unidad. La tercera categoría tiene una frontera propia:

```text
features/
├── applications/        # experiencias completas de la aplicación
│   └── <application>/    # páginas, estado y dominio local
├── domains/              # dominios reutilizables
│   └── <domain>/         # sin pages/components ni rutas
└── modules/
    ├── shared/           # módulos usados por empresa y tienda
    │   └── <module>/     # composición; solo UI/rutas
    └── company/          # módulos exclusivos de empresa
        └── <module>/
```

El `kind` de cada entrada se declara en `scripts/config/project.mjs` y lo
verifica `R-AR-16`. `applications/` y `domains/` no son capas técnicas: son
grupos físicos que hacen visible la diferencia entre una experiencia completa,
un dominio reutilizable y un módulo de composición.

| Feature                     | Propósito                                                                         |
| --------------------------- | --------------------------------------------------------------------------------- |
| `applications/account`      | Perfil, cambio de contraseña e historial de pedidos.                              |
| `applications/admin`        | Inventario de bodega y pantallas de administración.                               |
| `applications/ai-scraper`   | Jobs y chat de scraping con IA (ADR-18).                                          |
| `applications/auth`         | Login, registro y guards/interceptores de sesión.                                 |
| `applications/billing`      | Facturación: nueva factura, listado y detalle (ADR-23).                           |
| `applications/cart`         | Checkout y confirmación; el carrito vive en `domains/storefront`.                 |
| `domains/clients`           | Dominio de cartera de clientes compartido por empresa y vendedor (ADR-56).        |
| `domains/session`           | Sesión, roles, permisos y resolución de workspace.                                |
| `domains/file-storage`      | Buckets, objetos, subidas y cuotas de almacenamiento por tenant.                  |
| `domains/catalog`           | Catálogo maestro de productos: modelo, puerto y servicio.                         |
| `domains/company-catalog`   | Catálogo administrable de empresa: productos, servicios y operaciones.            |
| `domains/company-sales`     | Ventas, pedidos y portal de tiendas de empresa.                                   |
| `domains/store-sales`       | POS, pedidos, ofertas y catálogo de tienda.                                       |
| `domains/storefront`        | Productos, carrito, wishlist y reseñas del storefront.                            |
| `domains/media-background`  | Fondos multimedia de plataforma, empresa y tienda: adapter, puerto, HTTP y store. |
| `modules/shared/clients`    | Composición de la página/modal de Clientes (ADR-59).                              |
| `modules/shared/sales`      | Composición de Ventas de empresa y Pedidos/POS del vendedor (ADR-63/64).          |
| `modules/company/catalog`   | Composición del catálogo de productos, servicios y materia prima (ADR-65).        |
| `domains/orders`            | Dominio compartido de pedidos para empresa y vendedor (ADR-60).                   |
| `domains/finance`           | Dominio de caja, compras y gastos con persistencia local (ADR-66/73).             |
| `domains/expenses`          | Dominio de gastos con tipos, estados, beneficiarios y reportes (ADR-72).          |
| `modules/company/expenses`  | Composición de la pantalla de Gastos y sus modales (ADR-72).                      |
| `domains/purchases`         | Dominio de compras, proveedores, órdenes e historial (ADR-66).                    |
| `modules/company/purchases` | Composición del centro de compras y sus modales (ADR-66).                         |
| `domains/payables`          | Cuentas por pagar compartidas por empresa y tienda (ADR-67).                      |
| `domains/banks`             | Cuentas bancarias compartidas por empresa y tienda (ADR-68).                      |
| `domains/barcodes`          | Etiquetas de códigos de barras compartidas por empresa y tienda (ADR-69).         |
| `domains/credits`           | Ventas a crédito compartidas por empresa y tienda (ADR-70).                       |
| `domains/reports`           | Reportes de ventas compartidos por empresa y tienda (ADR-71).                     |
| `applications/company`      | Workspace `/app/empresa`: empresa, invitaciones, reportes y logística.            |
| `applications/home`         | Inicio, entrada multi-tienda y 404.                                               |
| `applications/logistica`    | Tablero contextual de rutas, entregas y mapa Leaflet (ADR-25).                    |
| `applications/plans`        | Planes y suscripciones.                                                           |
| `applications/shop`         | Storefront: catálogo, detalle y búsqueda; dominio en `domains/storefront`.        |
| `applications/onboarding`   | Asistente de creación de empresa y tienda.                                        |
| `applications/storage`      | Página de almacenamiento; el dominio vive en `domains/file-storage`.              |
| `applications/store`        | Workspace `/app/tienda`: shell, guard, páginas y branding; dominio `store-sales`. |
| `applications/wishlist`     | Página de favoritos; store en `domains/storefront`.                               |

## Contratos de capas

Cada feature declara sus capas obligatorias en `FEATURE_CONTRACTS`
(`scripts/config/project.mjs`, `R-AR-16`). `applications/account` reutiliza `applications/auth` y `applications/cart`
por su API pública; sus capas locales son `pages`, `state`, `components` y
`models`, sin duplicar stores, puertos ni adapters de esos dominios.

## Fronteras

- Un feature consume a otro solo por `public-api.ts`/`public-ui.ts`
  (`R-CX-6`).
- Los features de tipo `domain` exponen lógica reutilizable sin páginas ni rutas.
- `features/modules/<scope>/<módulo>` compone dominios para un workspace; no
  duplica modelos, stores ni adapters.
- `pages/` consume estado del store; `components/` es presentacional
  (`R-SO-8`).
- Las rutas se declaran en `<feature>.routes.ts` y se componen en
  `app.routes.ts` (`R-AR-12`).

## Navegación por módulos

Los sidebars de empresa y vendedor no declaran sus ítems: se generan desde
`core/workspace` según el workspace, los permisos y la sesión. Cada feature
expone sus páginas/rutas y el registro común decide qué módulos se muestran y
qué rutas se protegen con `moduleGuard`.

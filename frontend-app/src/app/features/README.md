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
    └── <module>/         # composición de uno o varios dominios; solo UI/rutas
```

El `kind` de cada entrada se declara en `scripts/config/project.mjs` y lo
verifica `R-AR-16`. `applications/` y `domains/` no son capas técnicas: son
grupos físicos que hacen visible la diferencia entre una experiencia completa,
un dominio reutilizable y un módulo de composición.

| Feature                   | Propósito                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `applications/account`    | Perfil, cambio de contraseña e historial de pedidos.                               |
| `applications/admin`      | Inventario de bodega y pantallas de administración.                                |
| `applications/ai-scraper` | Jobs y chat de scraping con IA (ADR-18).                                           |
| `applications/auth`       | Login, registro, autorización por workspace y guards de sesión.                    |
| `applications/billing`    | Facturación: nueva factura, listado y detalle (ADR-23).                            |
| `applications/cart`       | Carrito, checkout y confirmación de pedido.                                        |
| `domains/clients`         | Dominio de cartera de clientes compartido por empresa y vendedor (ADR-56).         |
| `modules/clients`         | Composición de la página/modal de Clientes (ADR-59).                               |
| `modules/sales`           | Composición de Ventas de empresa y Pedidos/POS del vendedor (ADR-63/64).           |
| `modules/catalog`         | Composición del catálogo de productos, servicios y materia prima (ADR-65).         |
| `domains/orders`          | Dominio compartido de pedidos para empresa y vendedor (ADR-60).                    |
| `domains/finance`         | Dominio de compras y caja con persistencia local (ADR-66).                         |
| `domains/expenses`        | Dominio de gastos con tipos, estados, beneficiarios y reportes (ADR-72).           |
| `modules/expenses`        | Composición de la pantalla de Gastos y sus modales (ADR-72).                       |
| `domains/payables`        | Cuentas por pagar compartidas por empresa y tienda (ADR-67).                       |
| `domains/banks`           | Cuentas bancarias compartidas por empresa y tienda (ADR-68).                       |
| `domains/barcodes`        | Etiquetas de códigos de barras compartidas por empresa y tienda (ADR-69).          |
| `domains/credits`         | Ventas a crédito compartidas por empresa y tienda (ADR-70).                        |
| `domains/reports`         | Reportes de ventas compartidos por empresa y tienda (ADR-71).                      |
| `applications/empresas`   | Empresa, modalidad logística y vendedores (ADR-27).                                |
| `applications/home`       | Inicio, entrada multi-tienda y 404.                                                |
| `applications/logistica`  | Tablero contextual de rutas, entregas y mapa Leaflet (ADR-25).                     |
| `applications/plans`      | Planes y suscripciones.                                                            |
| `applications/products`   | Catálogo, detalle, búsqueda y reseñas.                                             |
| `applications/stores`     | Asistente de creación de tienda.                                                   |
| `applications/vendor`     | Panel del vendedor: POS y pedidos; clientes por el feature compartido (ADR-20/55). |
| `applications/wishlist`   | Lista de deseos persistida localmente.                                             |

## Contratos de capas

Cada feature declara sus capas obligatorias en `FEATURE_CONTRACTS`
(`scripts/config/project.mjs`, `R-AR-16`). `applications/account` reutiliza `applications/auth` y `applications/cart`
por su API pública; sus capas locales son `pages`, `state`, `components` y
`models`, sin duplicar stores, puertos ni adapters de esos dominios.

## Fronteras

- Un feature consume a otro solo por `public-api.ts`/`public-ui.ts`
  (`R-CX-6`).
- Los features de tipo `domain` exponen lógica reutilizable sin páginas ni rutas.
- `features/modules/<módulo>` compone dominios para un workspace; no duplica
  modelos, stores ni adapters.
- `pages/` consume estado del store; `components/` es presentacional
  (`R-SO-8`).
- Las rutas se declaran en `<feature>.routes.ts` y se componen en
  `app.routes.ts` (`R-AR-12`).

## Navegación por módulos

Los sidebars de empresa y vendedor no declaran sus ítems: se generan desde
`core/workspace` según el workspace, los permisos y la sesión. Cada feature
expone sus páginas/rutas y el registro común decide qué módulos se muestran y
qué rutas se protegen con `moduleGuard`.

# features/ — Dominios de negocio

Cada feature es un dominio autocontenido con la misma estructura interna:

```text
features/<feature>/
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

| Feature           | Propósito                                                                          |
| ----------------- | ---------------------------------------------------------------------------------- |
| `account`         | Perfil, cambio de contraseña e historial de pedidos.                               |
| `admin`           | Inventario de bodega y pantallas de administración.                                |
| `ai-scraper`      | Jobs y chat de scraping con IA (ADR-18).                                           |
| `auth`            | Login, registro, autorización por workspace y guards de sesión.                    |
| `billing`         | Facturación: nueva factura, listado y detalle (ADR-23).                            |
| `cart`            | Carrito, checkout y confirmación de pedido.                                        |
| `clients`         | Dominio de cartera de clientes compartido por empresa y vendedor (ADR-56).         |
| `modules/clients` | Composición de la página/modal de Clientes (ADR-59).                               |
| `modules/sales`   | Composición de Ventas de empresa y Pedidos/POS del vendedor (ADR-63/64).           |
| `modules/catalog` | Composición del catálogo de productos, servicios y materia prima (ADR-65).         |
| `orders`          | Dominio compartido de pedidos para empresa y vendedor (ADR-60).                    |
| `finance`         | Dominio de compras, gastos y caja con persistencia local (ADR-66).                 |
| `payables`        | Cuentas por pagar compartidas por empresa y tienda (ADR-67).                       |
| `empresas`        | Empresa, modalidad logística y vendedores (ADR-27).                                |
| `home`            | Inicio, entrada multi-tienda y 404.                                                |
| `logistica`       | Tablero contextual de rutas, entregas y mapa Leaflet (ADR-25).                     |
| `plans`           | Planes y suscripciones.                                                            |
| `products`        | Catálogo, detalle, búsqueda y reseñas.                                             |
| `stores`          | Asistente de creación de tienda.                                                   |
| `vendor`          | Panel del vendedor: POS y pedidos; clientes por el feature compartido (ADR-20/55). |
| `wishlist`        | Lista de deseos persistida localmente.                                             |

## Contratos de capas

Cada feature declara sus capas obligatorias en `FEATURE_CONTRACTS`
(`scripts/config/project.mjs`, `R-AR-16`). `account` reutiliza `auth` y `cart`
por su API pública; sus capas locales son `pages`, `state`, `components` y
`models`, sin duplicar stores, puertos ni adapters de esos dominios.

## Fronteras

- Un feature consume a otro solo por `public-api.ts`/`public-ui.ts`
  (`R-CX-6`).
- Los features `domainOnly` exponen lógica reutilizable sin páginas ni rutas.
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

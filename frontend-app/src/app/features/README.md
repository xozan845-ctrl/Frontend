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

| Feature      | Propósito                                               |
| ------------ | ------------------------------------------------------- |
| `account`    | Perfil, cambio de contraseña e historial de pedidos.    |
| `ai-scraper` | Jobs y chat de scraping con IA (ADR-18).                |
| `auth`       | Login, registro, recuperación y guards de sesión.       |
| `billing`    | Facturación: nueva factura, listado y detalle (ADR-23). |
| `cart`       | Carrito, checkout y confirmación de pedido.             |
| `home`       | Inicio, entrada multi-tienda y 404.                     |
| `logistica`  | Tablero de rutas, entregas y mapa Leaflet (ADR-25).     |
| `plans`      | Planes y suscripciones.                                 |
| `products`   | Catálogo, detalle, búsqueda y reseñas.                  |
| `stores`     | Asistente de creación de tienda.                        |
| `vendor`     | Panel del vendedor: POS, pedidos y clientes (ADR-20).   |
| `wishlist`   | Lista de deseos persistida localmente.                  |

## Contratos de capas

Cada feature declara sus capas obligatorias en `FEATURE_CONTRACTS`
(`scripts/config/project.mjs`, `R-AR-16`). `account` reutiliza `auth` y `cart`
por su API pública; sus capas locales son `pages`, `state`, `components` y
`models`, sin duplicar stores, puertos ni adapters de esos dominios.

## Fronteras

- Un feature consume a otro solo por `public-api.ts`/`public-ui.ts`
  (`R-CX-6`).
- `pages/` consume estado del store; `components/` es presentacional
  (`R-SO-8`).
- Las rutas se declaran en `<feature>.routes.ts` y se componen en
  `app.routes.ts` (`R-AR-12`).

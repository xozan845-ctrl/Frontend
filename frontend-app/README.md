# E-Commerce Frontend App 🛒

Frontend web e-commerce ("Quantum Store") desarrollado con **Angular 22**,
gestión de estado reactiva con **NgRx Signals** y diseño con **Tailwind CSS**.

> Este repositorio es **solo el frontend**. Consume el API del backend
> (gateway de Core Engine, `/api/v1`) y, de forma **independiente**, el backend
> de IA `ai_scraper_executor` (`/api/v1`, ADR-18). La arquitectura, las reglas y
> las decisiones del proyecto viven en [`docs/`](./docs).

---

## 🚀 Características Principales

- **Entrada multi-tienda (`/`)**: busca tu tienda por URL o **crea tu empresa** con el asistente (`/crear-empresa`; `/crear-tienda` queda como alias). El storefront es **multi-tienda**: cada tienda vive bajo `/tienda/:storeId` (ADR-15).
- **Catálogo (`/tienda/:storeId/shop`)**: navegación, filtrado por categoría/precio, orden y paginación.
- **Detalle de Producto (`/tienda/:storeId/producto/:id`)**: galería, variantes y relacionados.
- **Carrito y Checkout (`/tienda/:storeId/carrito`, `/tienda/:storeId/checkout` → `/checkout/confirmacion`)**: flujo de compra con guard de autenticación. Carrito **híbrido**: local para invitados y del servidor para compradores (se vuelca al iniciar sesión).
- **Autenticación (`/login`, `/register`, `/recuperar`)**: formularios reactivos con `AuthStore` y refresco de sesión ante `401`.
- **Cuenta (`/cuenta`)**: perfil, cambio/recuperación de contraseña y **Mis Pedidos** (`/cuenta/pedidos`, `/cuenta/pedidos/:id`).
- **Crear empresa (`/crear-empresa`)**: asistente guiado para empresarios (cuenta → empresa y primera tienda → productos → listo, ADR-16/28).
- **Clientes de empresa y vendedor (`/app/empresa/clientes`, `/app/tienda/clientes`, ADR-51/56)**: módulo compartido con KPIs, pestañas (lista, top, frecuentes, inactivos), filtros, búsqueda, alta manual e importación CSV. La empresa ve la cartera de sus órdenes y el vendedor solo la de sus propias ventas; los registros manuales se aíslan por tenant/vendedor en `localStorage` hasta que exista un endpoint backend de clientes.
- **Ventas de empresa (`/app/empresa/ventas`, ADR-54)**: centro operativo con KPIs del día/mes, clientes con pago recurrente, historial por periodo y forma de pago, y modales de **Nueva Venta** (asistente de 6 pasos) y **Venta rápida** (escáner/código y cobro). Las ventas registradas se guardan por tenant en `localStorage` hasta que Core Engine exponga el POST de ventas de empresa.
- **Vendedores de empresa (`/app/empresa/vendedores`)**: el empresario escribe solo la parte local del correo (Gmail por defecto), selecciona una tienda disponible y genera una invitación con URL corta de un solo uso (`/i/<token>`) y mensaje listo para WhatsApp. El invitado completa su registro en una landing de bienvenida.
- **Productos y servicios de empresa (`/app/empresa/productos`, ADR-74/76)**: catálogo administrable con KPIs, pestañas de productos/servicios/materia prima, búsqueda, filtros, orden, paginación, exportación CSV y modal unificado de alta/edición (precio, costo, margen, stock mínimo/máximo, garantía, marca y código de barras). La persistencia es **server-side** en `/catalog/productos` y `/catalog/servicios`; `localStorage` ya no es fuente de verdad (ADR-74).
- **Workspace de tienda (`/app/tienda`, ADR-20)**: superficie de trabajo del vendedor dentro del workspace unificado. Lanzadas: **Inicio** (KPIs del día y accesos rápidos, `/app/tienda/inicio`), **Nuevo pedido** (POS con clientes, catálogo y "Pedidos recientes" en vivo por sondeo, `/app/tienda/ventas/nuevo`), **Pedidos** (lista con filtro por estado y detalle con cambio de estado, `/app/tienda/pedidos`) y **Clientes** (búsqueda por nombre/código/teléfono y alta rápida, `/app/tienda/clientes`); el resto (Productos, Inventario, Reportes, Ajustes, Ayuda) se completa por fases.
- **Facturación (`/app/tienda/facturacion`, ADR-23)**: submódulo de tienda sin shell propio; comparte el sidebar y el guard `store:manage-billing`. Incluye **Nueva factura** (cliente, información, catálogo y panel de la factura actual con IVA 15 %), **Facturas** (listado con filtro por estado) y **detalle imprimible** del comprobante. En esta fase usa datos de presentación; la lógica de emisión llega con los stores y puertos del feature. El header incluye **Facturación**: sin sesión abre el alta de **cuenta de facturador** (`/register?rol=biller`, ADR-24) y con sesión entra al submódulo.
- **Logística (`/app/logistica`, ADR-25)**: tablero visual de rutas y entregas dentro del workspace unificado: KPIs del día, **mapa de clientes y rutas** sobre OpenStreetMap (Leaflet), estado de entregas, repartidores activos y tablas de **pedidos en ruta** y **clientes del día**. El filtro por zona y la jornada son funcionales; las secciones restantes (mapa de clientes, rutas, pedidos, repartidores, zonas, incidencias, reportes, configuración) se completan por fases. En esta fase usa datos de demostración.
- **Lista de Deseos (`/tienda/:storeId/wishlist`)**: favoritos persistidos localmente.
- **Planes (`/plans`)**: selección de membresías.
- **Scraping con IA (`/ia`)**: feature independiente que consume el backend `ai_scraper_executor` (ADR-18): crear/supervisar **jobs** y **chat** por sesión (URL → radiografía → instrucciones → resultados).
- **Búsqueda** con autocompletado, **dark mode**, **PWA install banner** y página `404`.

---

## 🛠️ Tecnologías

| Tecnología         | Descripción                                                          |
| :----------------- | :------------------------------------------------------------------- |
| **Angular 22**     | Framework principal (standalone components, lazy loading, signals)   |
| **NgRx Signals**   | Gestión de estado reactiva (`@ngrx/signals`)                         |
| **Tailwind CSS 4** | Estilos utility-first con tokens propios (`surface`, `accent`)       |
| **Leaflet**        | Mapa de rutas sobre OpenStreetMap en el módulo de logística (ADR-25) |
| **Vitest**         | Runner de pruebas unitarias y de componentes                         |
| **Playwright**     | Pruebas E2E de los flujos críticos                                   |
| **ESLint**         | Lint (incluye `templateAccessibility`)                               |
| **Prettier**       | Formato de código (`.prettierrc`)                                    |
| **TypeScript 6**   | Tipado estático                                                      |

---

## 📋 Requisitos Previos

- **Node.js**: 20 o superior (LTS compatible con Angular 22)
- **npm**: 10 o superior

---

## ⚡ Instalación y Desarrollo

```bash
git clone https://github.com/xozan845-ctrl/Frontend.git
cd Frontend/frontend-app
npm install
npm start            # http://localhost:4200
```

La aplicación se recarga al modificar los archivos fuente.

### Configuración del API

La URL base y los endpoints se configuran en
[`src/environments/environment.ts`](./src/environments/environment.ts) —desarrollo:
`http://localhost:8080/api/v1`— y
[`environment.prod.ts`](./src/environments/environment.prod.ts) —producción:
`https://api.kbcoleccion.com/api-proxy/api/v1`— a través de `apiConfig`
(`src/app/core/config/api.config.ts`). Con `apiUrl: ''` y `dataSource: 'api'` la
app avisa de que falta configuración; con `dataSource: 'mock'` usa datos de prueba.

El backend de IA es **independiente** y se consume por **un único endpoint** con
**CORS** (ADR-18): `aiScraperUrl` en
[`environment.ts`](./src/environments/environment.ts) /
[`environment.prod.ts`](./src/environments/environment.prod.ts). El backend debe
permitir el origen del frontend (`CORS_ORIGINS`). Si exige autenticación, la
**API key** se introduce en runtime en `/ia` (se guarda en `sessionStorage`;
**nunca** viaja en el bundle).

---

## 📜 Scripts

| Comando                                 | Descripción                                           |
| :-------------------------------------- | :---------------------------------------------------- |
| `npm start`                             | Servidor de desarrollo en `http://localhost:4200`     |
| `npm run build`                         | Build de producción en `dist/frontend-app/browser/`   |
| `npm run watch`                         | Build de desarrollo con watch                         |
| `npm test`                              | Pruebas unitarias/componentes con Vitest (`ng test`)  |
| `npm run typecheck`                     | Comprobación de tipos (app + specs)                   |
| `npm run coverage:diff`                 | Cobertura del diff (`R-COV-5`)                        |
| `npm run e2e`                           | Pruebas E2E con Playwright                            |
| `npm run lighthouse`                    | Lighthouse CI sobre el build estático (`R-PF-8`)      |
| `npm run lint` / `lint:css`             | Lint de TS/HTML y de CSS                              |
| `npm run format` / `format:check`       | Formatea / verifica formato con Prettier              |
| `npm run rules:check`                   | Valida las reglas de gobernanza del repo              |
| `npm run rules:baseline`                | Regenera la deuda aceptada del motor de reglas        |
| `npm run test:engine`                   | Tests del motor de gobernanza                         |
| `npm run hosting:smoke`                 | Smoke del sitio publicado en Firebase Hosting         |
| `npm run og-image`                      | Regenera la imagen Open Graph por defecto             |
| `npm run deploy`                        | Publica en el sitio live de Firebase Hosting          |
| `npm run deploy:preview`                | Publica un canal de staging con expiración            |
| `npm run release:check -- --tag vX.Y.Z` | Valida tag, versiones y procedencia antes de publicar |
| `npm run release:readiness`             | Avisa si hay cambios de artefacto sin release/tag     |
| `npm run patch` / `minor` / `major`     | Prepara el bump de versión (sin commit ni tag)        |

---

## 📁 Estructura del Proyecto

> **Estructura enterprise** (`core/` · `shared/` · `layout/` · `features/`,
> ADR-12) **aplicada**, con la taxonomía de ADR-80 y los scopes de ADR-81.

```text
src/
├── environments/                 # Configuración por entorno (API, flags)
└── app/
    ├── core/                     # Infraestructura transversal · SIN UI · no depende de features
    │   ├── config/               # apiConfig: endpoints y dataSource
    │   ├── constants/            # company info
    │   ├── models/               # helpers genéricos de respuesta de API
    │   ├── services/             # SEO, notificaciones, versión, actualización
    │   └── workspace/            # WORKSPACE_MODULES y modelo de módulos
    ├── shared/                   # Presentación/utilidades reutilizables (sin negocio)
    │   ├── banks/ barcodes/ clients/ credits/ orders/ payables/ reports/
    │   ├── directives/           # scroll-reveal, focus-trap
    │   ├── pipes/
    │   └── ui/                   # componentes de UI reutilizables
    ├── layout/                   # Chrome de la app
    │   ├── header/
    │   └── footer/
    └── features/                 # Dominios de negocio (clean/hexagonal)
        ├── applications/         # Experiencias completas: 16 features con rutas
        │   ├── account/ admin/ ai-scraper/ auth/ billing/ cart/ company/
        │   ├── home/ logistica/ onboarding/ plans/ shop/ storage/ store/
        │   └── workspace/ wishlist/
        ├── domains/              # Dominios reutilizables sin UI: 18 features
        │   ├── banks/ barcodes/ catalog/ clients/ company-catalog/
        │   ├── company-sales/ credits/ expenses/ file-storage/ finance/
        │   ├── media-background/ orders/ payables/ purchases/ reports/
        │   └── session/ store-sales/ storefront/
        └── modules/              # Composición por workspace: 11 módulos
            ├── company/          # catalog, expenses, finance, purchases
            └── shared/           # banks, barcodes, clients, credits, payables, reports, sales
```

Cada feature declara en `FEATURE_CONTRACTS` (`scripts/config/project.mjs`,
`R-AR-16`) su `kind` (`application`, `domain` o `module`), sus capas permitidas
y su API pública (`public-api.ts` / `public-ui.ts`). El patrón común es
**puerto** (interfaz + `InjectionToken` en `repositories/`) → servicio que lo
implementa → adapter que normaliza la respuesta del backend. Las fronteras y
la separación **Smart/Dumb** se detallan en
[`docs/rules/frontend/`](./docs/rules/frontend/README.md) y
[`docs/rules/architecture/`](./docs/rules/architecture/README.md).

El inventario vigente de módulos, puertos y pruebas de sustitución vive en
[`docs/mvp/arquitectura-agnostica.md`](./docs/mvp/arquitectura-agnostica.md);
la matriz de aceptación con evidencia en
[`docs/mvp/aceptacion-frontend.md`](./docs/mvp/aceptacion-frontend.md).

Cada capa documenta su contrato en su propio README:
[`core/`](./src/app/core/README.md) · [`shared/`](./src/app/shared/README.md) ·
[`layout/`](./src/app/layout/README.md) ·
[`features/`](./src/app/features/README.md) (`R-DO-7`).

---

## 📚 Reglas y documentación

- **Índice de documentación**: [`docs/README.md`](./docs/README.md).
- **Reglas del proyecto** (punto fijo): [`docs/rules/README.md`](./docs/rules/README.md).
- **Decisiones de arquitectura**: [`docs/decisiones.md`](./docs/decisiones.md).
- **Estado y evidencias** (auditoría): [`docs/rules/_meta/AUDIT.md`](./docs/rules/_meta/AUDIT.md).
- **Inventario de arquitectura agnóstica**: [`docs/mvp/arquitectura-agnostica.md`](./docs/mvp/arquitectura-agnostica.md).
- **Matriz de aceptación del frontend**: [`docs/mvp/aceptacion-frontend.md`](./docs/mvp/aceptacion-frontend.md).
- **Despliegue actual en Firebase Hosting**: [`docs/firebase-hosting-setup.md`](./docs/firebase-hosting-setup.md).
- **Dockploy** (referencia futura, no operativo): [`docs/dockploy-setup.md`](./docs/dockploy-setup.md).

---

## 🏗️ Compilación para Producción

```bash
npm run build
```

Los archivos optimizados se generan en `dist/frontend-app/browser/`. El despliegue
se rige por [`docs/rules/cd/`](./docs/rules/cd/README.md) y el destino actual es
Firebase Hosting; Dockploy queda como referencia futura.

Para **producción** usa `npm run deploy`; para un canal de **staging** con
expiración usa `npm run deploy:preview`. Ver
[`docs/firebase-hosting-setup.md`](./docs/firebase-hosting-setup.md).

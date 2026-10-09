# E-Commerce Frontend App 🛒

Frontend web e-commerce ("Quantum Store") desarrollado con **Angular 22**,
gestión de estado reactiva con **NgRx Signals** y diseño con **Tailwind CSS**.

> Este repositorio es **solo el frontend**. Consume el API del backend
> (gateway de Core Engine, `/api/v1`) y, de forma **independiente**, el backend
> de IA `ai_scraper_executor` (`/api/v1`, ADR-18). La arquitectura, las reglas y
> las decisiones del proyecto viven en [`docs/`](./docs).

---

## 🚀 Características Principales

- **Entrada multi-tienda (`/`)**: busca tu tienda por URL o **crea la tuya** con el asistente (`/crear-tienda`). El storefront es **multi-tienda**: cada tienda vive bajo `/tienda/:storeId` (ADR-15).
- **Catálogo (`/tienda/:storeId/shop`)**: navegación, filtrado por categoría/precio, orden y paginación.
- **Detalle de Producto (`/tienda/:storeId/producto/:id`)**: galería, variantes y relacionados.
- **Carrito y Checkout (`/tienda/:storeId/carrito`, `/tienda/:storeId/checkout` → `/checkout/confirmacion`)**: flujo de compra con guard de autenticación. Carrito **híbrido**: local para invitados y del servidor para compradores (se vuelca al iniciar sesión).
- **Autenticación (`/login`, `/register`, `/recuperar`)**: formularios reactivos con `AuthStore` y refresco de sesión ante `401`.
- **Cuenta (`/cuenta`)**: perfil, cambio/recuperación de contraseña y **Mis Pedidos** (`/cuenta/pedidos`, `/cuenta/pedidos/:id`).
- **Crear tienda (`/crear-tienda`)**: asistente guiado para vendedores (cuenta → tienda → productos → listo, ADR-16).
- **Lista de Deseos (`/tienda/:storeId/wishlist`)**: favoritos persistidos localmente.
- **Planes (`/plans`)**: selección de membresías.
- **Scraping con IA (`/ia`)**: feature independiente que consume el backend `ai_scraper_executor` (ADR-18): crear/supervisar **jobs**, **chat** por sesión (URL → radiografía → instrucciones → resultados), radiografía/memoria y métricas.
- **Búsqueda** con autocompletado, **dark mode**, **PWA install banner** y página `404`.

---

## 🛠️ Tecnologías

| Tecnología         | Descripción                                                        |
| :----------------- | :----------------------------------------------------------------- |
| **Angular 22**     | Framework principal (standalone components, lazy loading, signals) |
| **NgRx Signals**   | Gestión de estado reactiva (`@ngrx/signals`)                       |
| **Tailwind CSS 4** | Estilos utility-first con tokens propios (`surface`, `accent`)     |
| **Vitest**         | Runner de pruebas unitarias y de componentes                       |
| **Playwright**     | Pruebas E2E de los flujos críticos                                 |
| **ESLint**         | Lint (incluye `templateAccessibility`)                             |
| **Prettier**       | Formato de código (`.prettierrc`)                                  |
| **TypeScript 6**   | Tipado estático                                                    |

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
`https://api.kbcoleccion.com/api/v1`— a través de `apiConfig`
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

| Comando                             | Descripción                                          |
| :---------------------------------- | :--------------------------------------------------- |
| `npm start`                         | Servidor de desarrollo en `http://localhost:4200`    |
| `npm run build`                     | Build de producción en `dist/frontend-app/browser/`  |
| `npm run watch`                     | Build de desarrollo con watch                        |
| `npm test`                          | Pruebas unitarias/componentes con Vitest (`ng test`) |
| `npm run e2e`                       | Pruebas E2E con Playwright                           |
| `npm run lint`                      | Lint con ESLint                                      |
| `npm run format` / `format:check`   | Formatea / verifica formato con Prettier             |
| `npm run patch` / `minor` / `major` | Sube la versión y publica el tag semver              |

---

## 📁 Estructura del Proyecto

> **Estructura enterprise** (`core/` · `shared/` · `layout/` · `features/`,
> ADR-12) **aplicada**.

```text
src/
├── environments/                 # Configuración por entorno (API, flags)
└── app/
    ├── core/                     # Infraestructura transversal · SIN UI · no depende de features
    │   ├── config/               # API config (endpoints, dataSource)
    │   ├── constants/            # company info
    │   ├── models/               # helpers genéricos de respuesta de API
    │   └── services/             # SEO, configuración de tienda, notificaciones
    ├── shared/                   # Presentación/utilidades reutilizables (sin negocio)
    │   ├── directives/           # scroll-reveal, focus-trap
    │   └── ui/                   # componentes de UI reutilizables
    ├── layout/                   # Chrome de la app
    │   ├── navbar/
    │   └── footer/
    ├── features/                 # Dominios de negocio (clean/hexagonal)
    │   ├── account/              # pages/ (perfil, pedidos), state, services, repositories, adapters
    │   ├── ai-scraper/           # pages/ (dashboard, detalle, chat), components/, state, services, repositories, adapters, models
    │   ├── auth/                 # pages/login, pages/register, state, services, repositories, adapters, guards
    │   ├── cart/                 # pages/cart-view, pages/checkout, pages/confirmation, state, services, repositories, adapters
    │   ├── home/                 # pages/home, pages/store-entry (raíz multi-tienda), pages/not-found
    │   ├── plans/                # pages/plans
    │   ├── products/             # pages/, components/, state, services, repositories, adapters, models
    │   ├── stores/               # pages/create-store (asistente), components/, state, services, repositories, adapters, models
    │   └── wishlist/             # pages/wishlist, state
    ├── app.component.ts          # Componente raíz (standalone)
    ├── app.config.ts             # Providers globales (DI de repositorios)
    └── app.routes.ts             # Rutas raíz; compone los <feature>.routes.ts
```

Cada feature agrupa sus `pages/`, `components/`, `state/`, `services/`,
`repositories/`, `adapters/`, `models/`, `constants/` y `mocks/`, y expone sus
rutas en `<feature>.routes.ts`. El patrón común es **puerto** (interfaz +
`InjectionToken`) → servicio que lo implementa → adapter que normaliza la
respuesta del backend. La separación **Smart/Dumb** y las fronteras entre
features se detallan en
[`docs/rules/frontend/`](./docs/rules/frontend/README.md) y
[`docs/rules/architecture/`](./docs/rules/architecture/README.md) (ADR-12).

---

## 📚 Reglas y documentación

- **Reglas del proyecto** (punto fijo): [`docs/rules/README.md`](./docs/rules/README.md).
- **Decisiones de arquitectura**: [`docs/decisiones.md`](./docs/decisiones.md).
- **Estado y deudas** (auditoría): [`docs/rules/_meta/AUDIT.md`](./docs/rules/_meta/AUDIT.md).
- **Despliegue en Dockploy**: [`docs/dockploy-setup.md`](./docs/dockploy-setup.md).

---

## 🏗️ Compilación para Producción

```bash
npm run build
```

Los archivos optimizados se generan en `dist/frontend-app/browser/`. El despliegue
en Dockploy se rige por [`docs/rules/cd/`](./docs/rules/cd/README.md).

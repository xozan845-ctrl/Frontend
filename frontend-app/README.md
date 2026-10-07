# E-Commerce Frontend App 🛒

Frontend web e-commerce ("Quantum Store") desarrollado con **Angular 22**,
gestión de estado reactiva con **NgRx Signals** y diseño con **Tailwind CSS**.

> Este repositorio es **solo el frontend**. Consume el API del backend
> (gateway de Core Engine, `/api/v1`). La arquitectura, las reglas y las
> decisiones del proyecto viven en [`docs/`](./docs).

---

## 🚀 Características Principales

- **Inicio (Home)**: página de bienvenida con promociones y productos destacados.
- **Catálogo (`/shop`)**: navegación, filtrado por categoría/precio, orden y paginación.
- **Detalle de Producto (`/product/:id`)**: galería, variantes, reseñas y relacionados.
- **Carrito (`/cart` → sidebar) y Checkout (`/checkout`)**: flujo de compra con guard de autenticación y confirmación (`/checkout/confirmation`).
- **Autenticación (`/login`, `/register`)**: formularios reactivos con `AuthStore`.
- **Lista de Deseos (`/wishlist`)**: favoritos persistidos localmente.
- **Planes (`/plans`)**: selección de membresías.
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
[`src/environments/environment.ts`](./src/environments/environment.ts) y
[`environment.prod.ts`](./src/environments/environment.prod.ts) a través de
`apiConfig` (`src/app/core/config/api.config.ts`). Con `apiUrl: ''` y
`dataSource: 'api'`, la app avisa si falta la configuración; con
`dataSource: 'mock'` usa datos de prueba.

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
    │   ├── auth/                 # pages/login, pages/register, state, services, repositories, adapters, guards
    │   ├── cart/                 # pages/cart-view, pages/checkout, pages/confirmation, state, services, repositories, adapters
    │   ├── home/                 # pages/home, pages/not-found
    │   ├── plans/                # pages/plans
    │   ├── products/             # pages/, components/, state, services, repositories, adapters, models
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

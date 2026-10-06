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
| **Tailwind CSS 3** | Estilos utility-first con tokens propios (`surface`, `accent`)     |
| **Vitest**         | Runner de pruebas unitarias y de componentes                       |
| **Prettier**       | Formato de código (`.prettierrc`)                                  |
| **TypeScript 6**   | Tipado estático                                                    |

---

## 📋 Requisitos Previos

- **Node.js**: 20 o superior (LTS compatible con Angular 22)
- **npm**: 10 o superior

---

## ⚡ Instalación y Desarrollo

```bash
git clone https://github.com/hnslmejia-sudo/frontend-ecomerce.git
cd frontend-ecomerce/frontend-app
npm install
npm start            # http://localhost:4200
```

La aplicación se recarga al modificar los archivos fuente.

### Configuración del API

La URL base y los endpoints se configuran en
[`src/environments/environment.ts`](./src/environments/environment.ts) y
[`environment.prod.ts`](./src/environments/environment.prod.ts) a través de
`apiConfig` (`src/app/shared/constants/api.config.ts`). Con `apiUrl: ''` y
`dataSource: 'api'`, la app avisa si falta la configuración; con
`dataSource: 'mock'` usa datos de prueba.

---

## 📜 Scripts

| Comando                             | Descripción                                          |
| :---------------------------------- | :--------------------------------------------------- |
| `npm start`                         | Servidor de desarrollo en `http://localhost:4200`    |
| `npm run build`                     | Build de producción en `dist/frontend-app/`          |
| `npm run watch`                     | Build de desarrollo con watch                        |
| `npm test`                          | Pruebas unitarias/componentes con Vitest (`ng test`) |
| `npm run patch` / `minor` / `major` | Sube la versión y publica el tag semver              |

---

## 📁 Estructura del Proyecto

```text
src/
├── environments/                 # Configuración por entorno (API, flags)
└── app/
    ├── domains/                  # Features de negocio (feature-first)
    │   ├── auth/                 # login, register, AuthStore, AuthService
    │   ├── cart/                 # carrito, checkout, confirmación, OrderService
    │   ├── home/                 # home y not-found
    │   ├── plans/                # planes y suscripciones
    │   ├── products/             # catálogo, detalle, stores y adapters
    │   └── wishlist/             # lista de deseos
    ├── shared/                   # Código transversal
    │   ├── constants/            # API config, company info
    │   ├── directives/           # scroll-reveal
    │   ├── models/               # utilidades de respuesta de API
    │   ├── services/             # SEO, configuración de tienda
    │   ├── ui/                   # componentes de UI reutilizables
    │   └── utils/                # guards e interceptors
    ├── app.config.ts             # Providers globales (DI de repositorios)
    ├── app.routes.ts             # Rutas lazy por dominio
    └── app.ts                    # Componente raíz
```

Cada dominio agrupa sus `components/`, `state/`, `services/`, `repositories/`,
`adapters/`, `models/`, `constants/` y `mocks/`. El patrón común es **puerto**
(interfaz + `InjectionToken`) → servicio que lo implementa → adapter que normaliza
la respuesta del backend. Detalle en
[`docs/rules/architecture/`](./docs/rules/architecture/README.md).

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

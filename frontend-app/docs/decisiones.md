# Decisiones de Arquitectura (ADR) — frontend-ecomerce

Este archivo registra decisiones técnicas deliberadas que se apartan de lo obvio
o que cambian una regla. Cada decisión se enmarca como **ADR-XX** con estado,
contexto y consecuencias.

> **Procedencia:** los ADR previos de este archivo pertenecían al backend **Core
> Engine** (otro repositorio). Se reemplazaron por los de este frontend; el
> histórico del backend no aplica aquí.

---

## ADR-01: Flujo trunk-based (`main` + ramas cortas + tags semver)

- **Fecha**: 2026-10-06
- **Estado**: Aceptado
- **Contexto**: el proyecto heredó de Core Engine un modelo de tres entornos por
  rama (`develop → staging → main`) con promociones y backport. Este repo solo
  tenía `main` (más ramas remotas heredadas `cuba`/`hansmini`/`reestructura`),
  versiona por tags semver (`v1.0.0`, `v1.1.0`, `v1.2.1`) y lo mantiene un equipo
  pequeño.
- **Decisión**: adoptar **trunk-based**: `main` como única rama de larga vida y
  protegida; ramas cortas `tipo/ámbito-descripción` que nacen de `main` y mueren
  al mergear; releases por tag semver (`npm run patch/minor/major` ya existen);
  historial lineal (rebase).
- **Consecuencias**: menos ceremonia y ramas obsoletas; no hay un entorno de
  stage permanente (ver ADR-02). Si se necesita stage, se decide en un ADR nuevo
  y se documenta en `cd/` — no se crea una rama de larga vida por conveniencia.

---

## ADR-02: Despliegue del frontend en Dockploy (mismo VPS que Core Engine)

- **Fecha**: 2026-10-06
- **Estado**: Aceptado
- **Contexto**: el backend Core Engine ya se despliega con Dockploy en un VPS.
  El frontend necesita un destino sin montar una infraestructura nueva.
- **Decisión**: desplegar la SPA en **Dockploy**, en un **proyecto propio**
  (`frontend-ecomerce`) dentro del mismo VPS, con un environment `produccion`
  que sigue `main`. El artefacto es el build estático de Angular
  (`dist/frontend-app/browser`) servido por nginx con fallback de rutas SPA.
- **Consecuencias**: se reutiliza la operación existente; el frontend y el
  backend mantienen **proyectos separados** (no se mezclan servicios/entornos) y
  el frontend no comparte red interna con los servicios del backend. El
  `Dockerfile`/`nginx.conf` y la configuración de Dockploy son deuda del primer
  PR de despliegue (`R-CD-*`).

---

## ADR-03: Arquitectura Angular feature-first con NgRx Signals

- **Fecha**: 2026-10-06
- **Estado**: Aceptado (implementado) — **superado en organización por ADR-12**
  (la estructura pasa a `core/ · shared/ · layout/ · features/`; se conservan
  standalone, lazy y `signalStore`)
- **Contexto**: la app creció por dominios (`auth`, `cart`, `home`, `plans`,
  `products`, `wishlist`) y utiliza `@ngrx/signals` para estado.
- **Decisión**: organizar por **dominio** (`domains/<feature>`) + código
  transversal (`shared/`); componentes **standalone** con **lazy loading** por
  ruta; estado en `signalStore` (`withState/withComputed/withMethods/withHooks`);
  formularios **reactivos**. Es la base de `R-AR-1/5/6/7`.
- **Consecuencias**: la app no usa `NgModules` ni servicios de estado con
  `BehaviorSubject`. Los componentes delegan el cálculo en `computed` y el
  acceso a datos en stores/servicios.

---

## ADR-04: Puertos + `InjectionToken` + adapters (ACS del backend)

- **Fecha**: 2026-10-06
- **Estado**: Aceptado (implementado)
- **Contexto**: el frontend debe consumir el API del backend Core Engine
  (`/api/v1`) pero también funcionar con mocks y ser tolerante a variaciones de
  forma de la respuesta.
- **Decisión**: definir cada dependencia externa como **interfaz + `InjectionToken`**
  (`PRODUCT_REPOSITORY`, `ORDER_REPOSITORY`, `AUTH_REPOSITORY`) implementada por
  un `service` y cableada en `app.config.ts`; normalizar toda respuesta con
  **adapters** puros (`adapt*FromBackend`) tolerantes a `camelCase`/`snake_case` y
  envelopes `{ data }`/`{ items }`/`{ results }`. Es la base de `R-AR-3/4`.
- **Consecuencias**: los componentes no conocen el shape del backend; cambiar de
  backend (o usar mocks) es cambiar el `useClass` del token. Deuda: los adapters
  usan `Record<string, any>` (`R-NC-10`) y no tienen tests (`R-U-5/6`, `G-5`).

---

## ADR-05: Estado de cliente en `localStorage` (y deuda del token)

- **Fecha**: 2026-10-06
- **Estado**: Aceptado con deuda (el token de sesión queda **superseded por
  ADR-10**: access en memoria + refresh en `sessionStorage`)
- **Contexto**: carrito, wishlist, tema, reseñas y "vistos recientemente" deben
  persistir entre sesiones sin backend. El `AuthStore` también persiste
  `{ user, token }`.
- **Decisión**: persistir en `localStorage` (claves `ecom_*`) el estado **no
  sensible**; el token de sesión **no debería** persistir ahí (`R-SE-1`), pero se
  mantiene de forma temporal por compatibilidad con la implementación actual.
- **Consecuencias**: carrito/wishlist funcionan sin cuenta. La persistencia del
  token es **deuda de seguridad** registrada en `AUDIT.md`; el próximo cambio de
  sesión debe mover el token a memoria/cookie `HttpOnly` (`R-SE-1`).

---

## ADR-06: Vitest + Angular TestBed como stack de pruebas

- **Fecha**: 2026-10-06
- **Estado**: Aceptado
- **Contexto**: Angular 22 permite el builder `@angular/build:unit-test` con
  Vitest; el proyecto ya trae `vitest` y `jsdom` en `devDependencies` y ningún
  setup de Karma.
- **Decisión**: estandarizar las pruebas en **Vitest** (con `TestBed` para
  componentes y `HttpTestingController` para servicios), en lugar de Karma/Jest.
- **Consecuencias**: `npm test` ejecuta la suite sin navegador; la cobertura se
  configurará sobre este runner (`R-COV-4`). Los ejemplos y comandos de
  `rules/test/` son de Vitest.

---

## ADR-07: Tailwind 3 + tokens de diseño y dark mode por clase

- **Fecha**: 2026-10-06
- **Estado**: Aceptado (implementado)
- **Contexto**: la UI usa Tailwind con paletas propias (`surface`, `accent`),
  tipografías (`Outfit`, `Plus Jakarta Sans`) y dark mode.
- **Decisión**: centralizar el diseño en `tailwind.config.js` (tokens) y
  controlar el tema con la clase `dark` en `<html>`, aplicada antes del bootstrap
  (`main.ts`) y persistida en `localStorage`. Es la base de `R-UX-3/5`.
- **Consecuencias**: los componentes usan las clases del token; introducir
  colores arbitrarios fuera de la paleta exige justificación en el PR.

---

## ADR-08: Reglas y documentación reescritas para el frontend

- **Fecha**: 2026-10-06
- **Estado**: Aceptado
- **Contexto**: `docs/rules/**` y `docs/decisiones.md` eran de Core Engine
  (NestJS, microservicios, Postgres, RabbitMQ, CQRS, Dockploy multi-entorno) y
  declaraban "frontend N/A", cuando este repo **es** el frontend.
- **Decisión**: conservar la **mecánica** que funcionó (áreas con
  `README.md` + `NN-tema.md`, IDs inmutables, reglas verificables, `_meta/`
  separado, ADRs, checklist de PR) y reescribir **todo** el contenido para el
  stack real: `architecture/`, `ui/`, `security/`, `test/`, `git/`, `ci/`, `cd/`,
  `ai/` y `documentation/`.
- **Consecuencias**: se eliminaron las áreas backend inexistentes
  (`microservice/`, `gateway/`, `data/`, `db/`, `observability/`) y los
  documentos que describían otro repo. Los gates de CI/CD quedan como
  **contrato** mientras no exista pipeline; el estado real está en `_meta/AUDIT.md`.

---

## ADR-09: CSR zoneless por defecto; SSR/hidratación diferidos (no son excluyentes)

- **Fecha**: 2026-10-06
- **Estado**: Aceptado
- **Contexto**: Angular 22 permite **zoneless** (`provideZonelessChangeDetection`,
  sin `zone.js`) y también **SSR/SSG con hidratación** (incluida la incremental).
  La app ya es zoneless (no hay `zone.js` en `package.json`) y **no** tiene SSR
  (`main.ts` hace `bootstrapApplication`, sin `@angular/ssr`).
- **Decisión**: mantener **CSR zoneless** como modelo por defecto (`R-PF-7`).
  **No** se adopta SSR/SSG/hidratación por ahora; su introducción es una decisión
  futura, **medida** (SEO/LCP) y registrada en un ADR nuevo (`R-HI-6`). Las reglas
  `R-HI-*` quedan **condicionales**: solo aplican si se adopta render en servidor.
- **Clarificación**: _zoneless_ (cómo se detectan cambios) y _SSR_ (dónde se
  genera el HTML) son **ortogonales** y se pueden combinar; la elección de
  zoneless **no** obliga a renunciar a SSR, ni al contrario. Se difiere SSR por
  coste/beneficio, no por incompatibilidad.
- **Consecuencias**: sin runtime Node ni código condicionado por plataforma en el
  arranque; a cambio, se renuncia temporalmente al HTML inicial indexable (SEO),
  que se reevalúa si el negocio lo exige. La persistencia actual en
  `localStorage` (`ADR-05`) no necesita cambios mientras no haya SSR.

---

## ADR-10: Autenticación JWT en cabeceras `Authorization` (sin cookies)

- **Fecha**: 2026-10-06
- **Estado**: Aceptado
- **Contexto**: el backend Core Engine emite **JWT** (access + refresh con `jti`
  revocable, ADR-18 del backend). Se evaluó el patrón cookie `HttpOnly` para
  mitigar XSS y se decidió mantener **JWT en cabeceras**: API-first, stateless y
  sin CSRF propio de cookies.
- **Decisión**: el token viaja en la cabecera `Authorization: Bearer <jwt>`
  (interceptor). El **access token** vive **en memoria** (vida corta); el
  **refresh token** se persiste (`sessionStorage` preferido; `localStorage` solo
  con "recordarme") con **rotación** y **revocación** por `jti`. **No se usan
  cookies**. Regla: `R-SE-1`; endurecimiento: `R-SE-9`.
- **Consecuencias**: se simplifica CORS/CSRF (no hay `withCredentials` ni token
  CSRF). A cambio, el token es **legible por JS**, así que **XSS es la amenaza
  principal**; se compensa con CSP estricta, minimización de terceros,
  sanitización, TTL corto y refresh rotativo/revocable. La alternativa que
  eliminaría del todo el riesgo (cookie `HttpOnly` o BFF) queda **descartada por
  decisión**, registrada aquí.
- **Implementación (2026-10-06)**: access token **en memoria**; refresh en
  `sessionStorage` (`ecom_refresh_token`); renovación en `POST /auth/refresh`
  (`{ refresh_token }`) al iniciar la app si hay refresh persistido. Si el backend
  no devuelve refresh token, degrada a sesión **solo en memoria** (re-login al
  recargar); se purga cualquier access token heredado de `localStorage`.

---

## ADR-11: Tailwind CSS 3 → 4 (breaking, por seguridad)

- **Fecha**: 2026-10-06
- **Estado**: Aceptado
- **Contexto**: la auditoría dejó **7 advisories sin corrección en Tailwind 3**
  (`tailwindcss`, `braces`, `chokidar`, `micromatch`, `fast-glob`,
  `postcss-nested`, `postcss-selector-parser`); `braces`/`micromatch`/`fast-glob`
  aparecen como vulnerables en **todas** sus versiones, así que no hay parche
  dentro de v3 (`R-SE-5`/`R-QA-6` exigen 0 `high`). Tailwind 4 elimina ese árbol
  de dependencias.
- **Decisión**: migrar a **Tailwind CSS 4.3.3**:
  - `@tailwindcss/postcss` + `postcss.config.json` (Angular solo lee la config
    PostCSS en **JSON**, no `postcss.config.js`).
  - `src/styles.css`: `@import "tailwindcss";` + `@config "../tailwind.config.js";`
    (se reutiliza el config) + `@custom-variant dark (&:where(.dark, .dark *));`
    para el dark mode por clase.
  - Renombres oficiales v4 aplicados: `outline-none → outline-hidden`,
    `flex-grow → grow`, `flex-shrink → shrink`.
  - Se elimina `autoprefixer` (lo cubre v4) y se sustituye el `@apply` de clases
    custom (`card`, `focus-ring`) por utilidades, porque v4 `@apply` solo acepta
    utilidades.
- **Consecuencias**: `npm audit` queda en **0 vulnerabilidades**. El CSS pasa de
  ~92 kB a ~110 kB y el bundle inicial sigue bajo presupuesto (~464 kB < 500 kB).
  Es un **cambio rompiente con impacto visual** (escala de sombras/radios,
  variantes): requiere **QA visual**; revertir es volver a v3 (reintroduce los
  advisories).

---

## ADR-12: Estructura enterprise (`core/` · `shared/` · `layout/` · `features/`) y separación Smart/Dumb

- **Fecha**: 2026-10-07
- **Estado**: Aceptado (migración en curso)
- **Contexto**: la app creció con un feature-first simple (`domains/` + `shared/`)
  que ya no expresa bien las fronteras al escalar a varios equipos y dominios:
  no hay una capa explícita de infraestructura transversal (`core/`), el chrome
  visual vive dentro de un "dominio" (`domains/layout`), las piezas genéricas
  (`shared/models`, `shared/services`) se mezclan con la presentación, y cada
  feature declara sus rutas inline en `app.routes.ts`.
- **Decisión**: adoptar una estructura **empresarial por capas de primer nivel**
  y una separación explícita entre contenedores y presentacionales:
  - **`core/`** — infraestructura transversal **sin UI ni reglas de negocio**:
    tokens/config de API, adapters genéricos de envelopes, servicios de
    aplicación sin UI (SEO, configuración de tienda, notificaciones). `core/` no
    depende de `shared/`, `layout/` ni `features/`.
  - **`shared/`** — presentación y utilidades **reutilizables y sin lógica de
    negocio**: `ui/`, `directives/`, `pipes/`, `constants/`. Puede depender de
    `core/`, nunca de `features/`.
  - **`layout/`** — chrome de la aplicación (`navbar/`, `footer/`, drawers)
    montado por `app.component`; sin reglas de negocio.
  - **`features/<feature>/`** — dominios de negocio con **clean/hexagonal**
    interno: `pages/`, `components/`, `state/` (signal stores), `services/`,
    `repositories/` (puertos + `InjectionToken`), `adapters/`, `models/`,
    `constants/`, `mocks/`, `public-api.ts`, `public-ui.ts` y
    `<feature>.routes.ts`.
  - **Rutas por feature**: `app.routes.ts` compone con `loadChildren`/
    `loadComponent`; los features exponen su propio `<feature>.routes.ts`.
  - **Smart vs Dumb**: contenedores (páginas y componentes _smart_) inyectan
    stores/servicios y orquestan; presentacionales (_dumb_) reciben `input`,
    emiten `output` y **no** inyectan stores ni servicios de dominio.
- **Consecuencias**: se renombra `domains/` → `features/`; `layout` sube a
  `app/layout/`; las piezas genéricas se mueven de `shared/` a `core/`; se
  actualizan las reglas `R-AR-1/2/6`, se añaden `R-AR-12` (rutas por feature) y
  `R-AR-13` (frontera de `core/`), y se añade `R-SO-8` (Smart/Dumb). La migración
  se hace por PRs atómicas (código + specs + `angular.json` de cobertura), sin
  romper los gates. Revertir es volver a `domains/` + `shared/`.

## ADR-13: Configuración de despliegue en runtime (`/config.json`)

- **Contexto**: la URL base del API cambia por entorno y fijarla en
  `environment.prod.ts` obliga a recompilar el bundle. Es configuración pública
  (`R-CD-2`), no un secreto.
- **Decisión**: resolver `apiUrl` en **tiempo de ejecución** desde
  `/config.json`, generado por el contenedor a partir de `API_URL`
  (`docker-entrypoint.d/40-runtime-config.sh`). La app lo carga con
  `provideAppInitializer` antes de crear los servicios, que siguen leyendo
  `environment` (`R-AR-11`); un valor vacío conserva el fallback de
  `src/environments/`. Si el archivo falta o falla, no hay ruido en consola
  (`R-E-9`). La **tienda** no vive aquí: se resuelve por URL (ADR-15).
- **Consecuencias**: el mismo build sirve a cualquier entorno cambiando solo
  variables del contenedor (alineado con `R-CD-4`); `config.json` se versiona
  vacío como plantilla y se añade al `assetGroups` del service worker. Revertir
  es volver a fijar los valores en `environment.prod.ts` y quitar el
  `provideAppInitializer`.

## ADR-14: Moneda del storefront en córdobas (NIO)

- **Contexto**: Core Engine maneja montos en córdobas nicaragüenses (NIO), pero
  la UI mostraba `$` y `toFixed(2)` en 15 puntos, sin separadores locales ni
  símbolo correcto.
- **Decisión**: centralizar el formato en `core/config/currency.config.ts`
  (`Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' })` →
  `C$1,200.00`) y exponerlo con el pipe standalone `appCurrency`
  (`shared/pipes`). `core/` lo usa también el SEO; el pipe devuelve `''` para
  precios opcionales nulos.
- **Consecuencias**: una sola fuente de verdad para moneda y locale; cambiar de
  divisa es editar `CURRENCY`. Revertir es volver a `$` + `toFixed(2)`.

## ADR-15: Storefront multi-tienda por URL (`/tienda/:storeId`)

- **Contexto**: Core Engine es **multi-tienda (multi-tenant)**: cada vendedor
  tiene su tienda y sus ofertas, y su superficie pública es **por tienda**
  (`GET /api/v1/tiendas/:id` → `{ tienda, ofertas }`); no existe un endpoint
  público que liste tiendas. Fijar un `storeId` en `environment`/`config.json`
  ataba el frontend a una sola tienda y contradecía el modelo.
- **Decisión**: resolver la tienda **desde la URL**. Todo el storefront vive
  bajo `/tienda/:storeId` (home, `shop`, `producto/:id`, `carrito`, `checkout`,
  `wishlist`), con un `storefrontResolver` que carga la tienda y sus ofertas en
  `ProductStore` antes de activar la ruta; los componentes reciben `storeId`
  como `input` (`withComponentInputBinding`) y construyen enlaces store-scoped.
  La raíz `/` es una entrada multi-tienda (`store-entry`); los componentes
  presentacionales reciben `storeId` por `input` (no inyectan stores, `R-SO-6`).
  Se elimina `storeId` de `environment`, `ApiConfiguration` y de
  `/config.json`, y las rutas dejan de exigir sesión para navegar (el catálogo
  es público); solo `checkout` sigue protegido y redirige a
  `/login?returnUrl=<ruta>`.
- **Consecuencias**: un mismo build sirve a todas las tiendas y el enlace de
  cada tienda se comparte (`/tienda/<id>`). Cuando el backend exponga un
  directorio público (`GET /api/v1/tiendas`), la raíz podrá poblarse con él sin
  cambiar el resto. Revertir es volver a fijar un `storeId` de configuración.

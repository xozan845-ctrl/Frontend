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
  `Dockerfile`/`nginx.conf` y la configuración de Dockploy quedaron a cargo del
  primer PR de despliegue (`R-CD-*`, ya entregado).

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

## ADR-05: Estado de cliente en `localStorage` (token: deuda cerrada por ADR-10)

- **Fecha**: 2026-10-06
- **Estado**: **Superseded por ADR-10** — la deuda del token quedó **cerrada**:
  access en memoria + refresh rotativo en `sessionStorage` + purga del
  `localStorage` heredado.
- **Contexto**: carrito, wishlist, tema, reseñas y "vistos recientemente" deben
  persistir entre sesiones sin backend. El `AuthStore` también persiste
  `{ user, token }`.
- **Decisión**: persistir en `localStorage` (claves `ecom_*`) el estado **no
  sensible**; el token de sesión **no debería** persistir ahí (`R-SE-1`), pero se
  mantiene de forma temporal por compatibilidad con la implementación actual.
- **Consecuencias**: carrito/wishlist funcionan sin cuenta. La persistencia del
  token quedó registrada como deuda de seguridad en `AUDIT.md` y **ADR-10 la
  cerró** (`R-SE-1`).

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

## ADR-16: Alta de tienda guiada (`/crear-tienda`) con rol vendedor

- **Contexto**: Core Engine permite a un **vendedor** abrir su tienda
  (`POST /vendedores/tienda`) y publicar productos con margen
  (`POST /vendedores/productos`), pero el storefront solo permitía comprar. La
  raíz `/` (entrada multi-tienda) no ofrecía descubrimiento para vendedores.
- **Decisión**: añadir un **asistente paso a paso** en `/crear-tienda`, público
  (gestiona la cuenta en el propio flujo). Pasos: **1) Cuenta** de vendedor
  (registro con `rol: 'vendedor'`, o login), **2) Tienda** (nombre/descripción →
  `POST /vendedores/tienda`), **3) Productos** (opcional; elegir del catálogo +
  margen → `POST /vendedores/productos`), **4) Listo** (enlace a la tienda). La
  raíz `/` gana un CTA **“Crear mi tienda”** con copy que invita al registro.
- **Consecuencias**: nuevo feature `stores` (`pages/`, `components/`, `state/`
  con `StoreWizardStore`, `services/`+`repositories/` con puerto
  `STORE_REPOSITORY`, `adapters/`, `stores.routes.ts`), cableado en
  `app.config.ts`/`app.routes.ts` (R-AR-1/3/12). `RegisterData` admite `role`
  (`customer`→`comprador`, `seller`→`vendedor`). El indicador de pasos es
  presentacional (R-SO-8). Revertir es quitar la ruta y el CTA.

## ADR-17: Idioma de las rutas (términos técnicos en inglés, dominio en español)

- **Contexto**: `R-NC-12` exigía rutas "en inglés técnico" (`/shop`,
  `/product/:id`, `/checkout/confirmation`), pero el producto es de cara al
  público hispanohablante (`R-NC-7`: UI, modelos y mensajes en español) y varias
  rutas ya se habían fijado en español al introducir el storefront multi-tienda
  (`/tienda/:storeId`, ADR-15), el alta de tienda (`/crear-tienda`, ADR-16) y el
  área de cuenta (`/cuenta`, `/cuenta/pedidos`). El resultado era un mapa de
  rutas mixto sin criterio documentado, con `R-NC-12` desactualizada.
- **Decisión**: las rutas van en **`kebab-case`** y su idioma sigue el tipo de
  término:
  - **Términos técnicos consolidados** del comercio electrónico se mantienen en
    inglés: `/login`, `/register`, `/plans`, `/shop`, `/wishlist`, `/checkout`.
  - **Sustantivos de dominio** que el usuario hispanohablante identifica mejor en
    su idioma van en español: `/producto/:id`, `/carrito`,
    `/checkout/confirmacion`, `/cuenta`, `/cuenta/pedidos`, `/tienda/:storeId`,
    `/crear-tienda`, `/recuperar`.
  - La ruta comodín `**` sigue resolviendo al `not-found.component`.
- **Consecuencias**: se actualiza `R-NC-12` para reflejar el criterio (con
  respaldo de este ADR, `R-DO-2`); las rutas nuevas deben encajar en una de las
  dos categorías. **No** se renombran las rutas existentes para no romper los
  enlaces compartidos de tiendas (`/tienda/<id>`) ni el resto de la app.
  Revertir es volver a rutas 100 % en inglés y renombrar todos los enlaces.

## ADR-18: Integración con el backend de IA `ai_scraper_executor` (segunda fuente de datos)

- **Fecha**: 2026-10-09
- **Estado**: Aceptado
- **Contexto**: existe un backend **independiente** (`ai_scraper_executor`,
  NestJS + worker Crawlee/Playwright + LLM) que expone una API REST asíncrona
  bajo `/api/v1` (jobs, sesiones tipo chat, radiografía/memoria, métricas). No
  comparte dominio ni autenticación con el gateway de Core Engine; su única
  superficie de consumo es un **endpoint HTTP** con **CORS** por allowlist
  (`CORS_ORIGINS`) y, opcionalmente, cabecera `x-api-key`.
- **Decisión**: integrarlo como un **feature aislado** del frontend
  (`features/ai-scraper`), consumido por HTTP a través de **un endpoint**:
  - El host vive en `environment.aiScraperUrl` (`R-AR-11`); los paths y
    constantes en `features/ai-scraper/constants` (`R-AR-13`). **No** se
    reutiliza `apiUrl` (son backends distintos).
  - CORS se habilita **en el backend** (`CORS_ORIGINS=<origen del frontend>`);
    el frontend no hace proxy ni intermedia.
  - La API key (si el despliegue la exige) se aporta en **runtime** y se guarda
    en `sessionStorage` (`ecom_ai_scraper_key`); un interceptor dedicado añade
    `x-api-key` **solo** a las peticiones a `aiScraperUrl` (`R-SE-1/2/8`). Nunca
    va en el bundle.
  - El consumo sigue el patrón del frontend: **puertos + `InjectionToken`**
    (`R-AR-3`, `R-SO-4`), **adapters** tolerantes (`R-AR-4`), **signal stores**
    con **polling reactivo** (`timer` + `rxMethod`, nunca `setInterval`,
    `R-ST-5`, `R-PF-6`) y **rutas lazy** (`R-AR-12`, `R-LZ-1`).
  - Alcance "consumo completo": jobs (crear/listar/detalle/cancelar/reintentar),
    sesiones tipo chat, radiografía/memoria y métricas/salud.
- **Consecuencias**: nueva superficie `core/config/ai-scraper.config.ts` (paths),
  CSP `connect-src` ampliada al host del backend (`R-SE-9`) y cobertura de
  contrato/adapters/servicios/stores/UI. El backend debe permitir el origen del
  frontend por CORS. Revertir es quitar la ruta `/ia`, el enlace del navbar y el
  feature; el resto del storefront no se toca.

## ADR-19: Retiro de la radiografía y las métricas del frontend de IA

- **Fecha**: 2026-10-13
- **Estado**: Aceptado
- **Contexto**: el feature `ai-scraper` (ADR-18) exponía en `/ia` un panel de
  conexión, la supervisión de **jobs** y el chat de **sesiones**, más una página
  de **radiografía/memoria** y **métricas/salud**. Al pasar el chat a ser la
  superficie principal, el dashboard quedó reducido al panel de conexión y la
  radiografía y las métricas perdieron su punto de entrada, quedando sin uso.
- **Decisión**: retirar del frontend el **feature de radiografía** (página
  `/ia/radiography`, store, servicio, puerto y modelos) y el **vertical de
  métricas/salud** (store, servicio, puerto, modelos/DTO, funciones del adapter,
  fixtures y sus specs), junto con su cableado en rutas y constantes. Esto
  **reduce** los alcances declarados en ADR-18.
- **Consecuencias**: menos superficie y menos código muerto; el backend
  `ai_scraper_executor` conserva esos endpoints (el frontend solo deja de
  consumirlos). Revertir es recuperar los archivos del historial de git. La
  radiografía **del flujo de sesión** (estado `RADIOGRAPHY`) **se mantiene**.

## ADR-20: Módulo de vendedores (panel POS con pedidos en tiempo real)

- **Fecha**: 2026-10-15
- **Estado**: Aceptado
- **Contexto**: el frontend ya cubre el alta de tienda (ADR-16) y el storefront
  multi-tienda (ADR-15), pero **no** existe una superficie de trabajo del
  **vendedor**: registrar pedidos con steppers de cantidad, consultar pedidos
  recientes con su estado y gestionar clientes. Core Engine tampoco expone los
  endpoints de pedidos/clientes/stock del vendedor, así que el contrato se
  asume en el frontend con adapters tolerantes y modo `mock` mientras llega el
  backend.
- **Decisión**: crear el feature **`vendor`** (`features/vendor/`) como extensión
  del módulo de tienda, con su mismo lenguaje visual (tokens `surface`/`accent`,
  Outfit/Plus Jakarta Sans, animaciones existentes, dark mode, `appCurrency`):
  - **Rutas** `/vendedor` (lazy vía `loadChildren`, guard de rol `vendedor`) con
    hijas `inicio`, `ventas/nuevo`, `pedidos`, `pedidos/:id` y `clientes`; las
    secciones sin fase (inventario, reportes, ajustes, ayuda) se muestran con
    estado "En construcción" en lugar de enlaces muertos (R-UX-1).
  - **Estado** por signal stores de feature provistos en la ruta (patrón
    ADR-21): `OrderDraftStore` (borrador del pedido con IVA **15 %**
    parametrizable —`VENDOR_TAX_RATE`— y persistencia en `localStorage`
    `ecom_vendor_order_draft`) y `VendorOrdersStore` (recientes, listado,
    detalle y cambio de estado).
  - **Tiempo real por polling reactivo** (`timer` + `rxMethod`, nunca
    `setInterval`, R-PF-6) cada **15 s**, pausado con la pestaña oculta; SSE/WS
    queda como opción futura y requeriría un ADR nuevo.
  - **Contrato asumido** con adapters tolerantes + fixtures de contrato (R-C-8)
    y modo `mock` (mismo patrón que `stores`); los endpoints reales quedan como
    frontera del backend (aún no expuestos).
  - "Generar cotización" se muestra **deshabilitado** hasta su fase propia
    (fuera de alcance).
- **Consecuencias**: nueva superficie **100 % lazy** (sin coste en el bundle
  inicial); el navbar gana el enlace `VENDEDOR` para cuentas de vendedor. Toda
  la lógica se prueba por la matriz de capas (adapters y contrato, servicios,
  stores y componentes) y se agregan flujos E2E del panel. Revertir es retirar
  la ruta `/vendedor`, el enlace del navbar y el feature.

## ADR-21: Provisión de infraestructura por feature en rutas lazy

- **Contexto**: `R-AR-3` fija que la composición de puertos→servicios vive en
  `app.config.ts`. Al cerrar el **presupuesto inicial** (`R-PF-1`) se movió la
  infraestructura del feature `stores` (puertos `STORE_REPOSITORY`/
  `CATALOG_REPOSITORY`, sus servicios y `StoreWizardStore`) a los `providers` de
  su ruta lazy (`loadChildren`), sacándola del bundle inicial. Eso mejora
  `R-LZ-1`/`R-PF-1`, pero se aparta de la letra de `R-AR-3`.
- **Decisión**: para features **lazy y autocontenidos** cuya infraestructura no
  se comparte con el resto de la app, la composición de sus puertos puede vivir
  en los `providers` de su ruta (`<feature>.routes.ts`), no en `app.config.ts`.
  Los puertos **transversales** (auth, cart, products) siguen en `app.config.ts`.
- **Consecuencias**: la infraestructura del feature viaja en su chunk lazy
  (menor bundle inicial y mejor frontera de feature). Se actualiza `R-AR-3` para
  reflejarlo. Revertir es volver a declarar esos `provide` en `app.config.ts`.
- **Nota de numeración**: este ADR se registró originalmente como un segundo
  `ADR-18`; al cerrar la deuda documental (12ª auditoría) se renumeró a
  **`ADR-21`** —primer número libre tras `ADR-20`— sin tocar `ADR-19`/`ADR-20`,
  que ya tenían referencias (R-DO-2).

## ADR-22: Acceso visible al panel de vendedor (enlace siempre visible + alta guiada)

- **Fecha**: 2026-10-19
- **Estado**: Aceptado
- **Contexto**: ADR-20 añadió el enlace `VENDEDOR` al navbar **solo para cuentas
  de vendedor**. Un comprador o un visitante anónimo no encontraba ninguna
  entrada al panel desde la interfaz, aunque el `vendorGuard` ya resuelve el
  acceso (anónimo → `/login`, comprador → `/crear-tienda`) y el alta de tienda
  permite crear la cuenta de vendedor (ADR-16). El módulo quedaba indescubrible.
- **Decisión**: el enlace "Vendedor" del navbar (desktop y móvil) se muestra
  **siempre** y apunta a `/vendedor/inicio`; el `vendorGuard` sigue siendo la
  única autoridad de acceso. El login detecta la intención de vendedor (cuando
  `returnUrl` vive bajo `/vendedor`) y ofrece el alta con rol vendedor
  (`/register?rol=seller`, que el registro traduce a `role: 'seller'`), de modo
  que un visitante sin cuenta crea una cuenta de vendedor y entra al panel en un
  solo recorrido.
- **Consecuencias**: el navbar deja de depender del rol para el enlace y el
  recorrido se cubre con E2E (`R-E-21`). El contrato del alta
  (`RegisterData.role`) se reutiliza sin cambios de backend (`rol: 'vendedor'`
  en el registro real). `ADR-20` mantiene su decisión sobre guard y rutas; esta
  decisión sustituye únicamente su consecuencia sobre la visibilidad del enlace.
  Revertir es restaurar la condición de rol en las dos variantes del enlace.
  **Actualización (ADR-26)**: el registro real envía `rol: 'empresario'` y el
  guard acepta `empresario` y `vendedor`.

## ADR-23: Módulo de facturación visual (feature independiente)

- **Fecha**: 2026-10-19
- **Estado**: Aceptado — **fase visual** (la lógica de emisión queda para una
  fase posterior)
- **Contexto**: el panel del vendedor (ADR-20) ya cubre pedidos, clientes y POS,
  pero no existe una superficie de **facturación**. El diseño de referencia es
  el mismo lenguaje visual del POS de la tienda (sidebar oscuro, cards, chips,
  panel de totales), por lo que conviene extenderlo sin duplicar la lógica de
  pedidos. Se pidió expresamente construir **primero la parte visual**.
- **Decisión**: crear el feature **`features/billing/`** como módulo
  independiente, cargado de forma perezosa desde `app.routes.ts` bajo
  `/facturacion` (R-AR-12, R-LZ-1):
  - **Rutas**: `/facturacion/nueva` (POS de facturación), `/facturacion/facturas`
    (listado con filtro por estado) y `/facturacion/facturas/:id` (detalle
    imprimible). `''` redirige a `nueva`.
  - **Shell propio** (`pages/billing-shell/`) con sidebar oscuro que replica el
    del vendedor, marca la sección activa y muestra las secciones sin fase como
    "Pronto" (R-UX-1). El sidebar del vendedor gana el enlace **Facturación**.
  - **Presentación pura**: componentes _dumb_ con `input`/`output` (R-SO-8),
    páginas contenedoras con estado local de UI, fixtures en
    `adapters/fixtures/billing.fixture.ts` y cálculo de totales como función
    pura (`calculateInvoiceTotals`, IVA 15 %).
  - **Alcance visual**: cliente, información (fecha y condición de pago),
    catálogo con stock y panel "Factura actual" con totales, listado filtrable y
    comprobante con `@media print`. Las acciones de emisión y guardado muestran
    un aviso de "vista de diseño" en lugar de llamar al backend.
- **Consecuencias**: el feature no incluye todavía puertos, servicios HTTP,
  stores ni guard de rol; la ruta es navegable para revisar el diseño y se
  protegerá con el guard de vendedor al conectar la lógica (R-SE-6). El bundle
  inicial no crece (todo el módulo viaja en chunks lazy) y el módulo se prueba
  con specs de componentes/páginas y sus fixtures (R-CP-1, R-CP-2). Revertir es
  retirar la ruta `/facturacion`, el enlace del sidebar del vendedor y el
  feature.

## ADR-24: Acceso a facturación desde el header y alta de cuenta de facturador

- **Fecha**: 2026-10-19
- **Estado**: Aceptado
- **Contexto**: el módulo de facturación (ADR-23) solo era accesible por URL o
  desde el sidebar del vendedor. Se necesita una entrada visible en el **header**
  y un recorrido de alta específico para una **cuenta de facturador**. Core
  Engine solo distingue los roles `comprador` y `vendedor`; no existe aún un rol
  `facturador` en el contrato del backend.
- **Decisión**:
  - El navbar (desktop y móvil) añade el enlace **Facturación**. Sin sesión
    apunta a `/register?rol=biller&returnUrl=/facturacion/nueva`; con sesión
    apunta directo a `/facturacion/nueva`.
  - `RegisterData.role` admite `biller`. El servicio de autenticación lo envía
    al backend como `rol: 'vendedor'` (una cuenta de facturador es una cuenta de
    vendedor con acceso a facturación) hasta que exista un rol propio en el
    contrato.
  - El formulario de registro reconoce `rol=biller`, muestra el título
    **Facturador**, un aviso de contexto y, tras autenticarse, vuelve al
    `returnUrl` (o a `/facturacion/nueva` si no viene).
- **Consecuencias**: el alta funciona con el contrato actual del backend sin
  cambios de API; el rol `facturador` queda como etiqueta de producto y se
  podrá separar cuando el backend lo exponga (solo cambia el mapeo del payload).
  La ruta de facturación sigue sin guard en la fase visual; al conectar la lógica
  se protegerá con un guard que acepte vendedor/facturador (R-SE-6). Revertir es
  quitar el enlace del navbar y la intención `biller` del formulario.
  **Actualización (ADR-26)**: el alta traduce `biller` a `rol: 'empresario'`
  (no `vendedor`), que es el rol registrable del contrato real.

## ADR-25: Módulo de logística visual (tablero de rutas y entregas)

- **Fecha**: 2026-10-20
- **Estado**: Aceptado — **fase visual** (la lógica de rutas y entregas queda
  para una fase posterior)
- **Contexto**: se necesita una superficie de **logística** para monitorear
  clientes, rutas, repartidores y entregas. Core Engine aún no expone endpoints
  de rutas, repartidores ni entregas, y el pedido explícito es construir primero
  el **diseño** con fidelidad al boceto aprobado. El lenguaje visual es el mismo
  del panel del vendedor (ADR-20) y de facturación (ADR-23): shell con sidebar
  oscuro, tarjetas, chips y tablas.
- **Decisión**:
  - Crear el feature **`features/logistica/`** cargado de forma perezosa bajo
    `/logistica` (R-AR-12, R-LZ-1), con shell propio y entrada visible en el
    navbar (desktop y móvil).
  - **Rutas**: `/logistica/dashboard` (tablero) y las secciones del sidebar
    (`mapa-clientes`, `rutas`, `pedidos`, `repartidores`, `zonas`,
    `incidencias`, `reportes`, `configuracion`) como páginas "En construcción"
    reales (R-UX-1) con SEO propio (R-UX-6). `''` redirige a `dashboard`.
  - **Mapa**: Leaflet 1.9 + teselas de **OpenStreetMap** (R-SE-7: proveedor
    externo justificado; sin API key ni datos de usuario en la URL). El JS viaja
    en el chunk lazy del tablero y el CSS se carga como asset al montar el panel,
    para no tocar el bundle inicial (R-PF-1). La CSP de `index.html` y
    `nginx.conf` autoriza únicamente `tile.openstreetmap.org` en `img-src`.
  - **Datos de demostración**: `mocks/logistica.mocks.ts` replica los valores
    del boceto; `LogisticaDashboardStore` (provisto en la ruta, ADR-21) simula la
    latencia de carga, expone estados de carga (R-UX-1) y deriva filtros y
    totales en `withComputed` (R-ST-3). El filtro de zona y la jornada son
    funcionales; el resto de acciones son visuales.
  - **Presentación pura**: componentes _dumb_ con `input`/`output` y
    `data-testid` (R-SO-8, R-CP-2), con specs de componente y de store. La página
    "En construcción" se promueve a `shared/ui/coming-soon/` porque ahora tiene
    dos consumidores reales (vendor y logística, R-SH-3).
- **Consecuencias**: el módulo es navegable y revisable sin backend; al conectar
  la lógica se sustituyen los mocks por puertos HTTP y se protege con el guard
  correspondiente (R-SE-6). El CSS global de Tailwind crece ~5 kB y el bundle
  inicial queda en **507.72 kB**, por encima del presupuesto de aviso de 500 kB
  (ya excedido en `main` con 501.04 kB); el aviso no bloquea el build (el error
  está en 1 MB) y el recorte del inicial se registra como deuda aparte para no
  mezclar un refactor global con este módulo (R-IA-6). Revertir es retirar la
  ruta `/logistica`, el enlace del navbar y el feature.

---

## ADR-26: Consumo del contrato real de autenticación (`/api/v1/auth`)

- **Fecha**: 2026-10-21
- **Estado**: Aceptado
- **Contexto**: el frontend venía consumiendo una versión **asumida** del
  contrato de auth (payload `rol: 'vendedor'`, envelope `{ data }`, sin
  `expira_en`). El OpenAPI público de Core Engine y el código de
  `identity-service` confirman otro contrato: el alta pública solo admite
  `empresario` o `comprador`; la sesión devuelve `access_token`,
  `refresh_token`, `expira_en` y `usuario`; y existen endpoints que el frontend
  aún no consumía (`crear-usuario`, `vincular-personal`). Además, el panel del
  vendedor debe aceptar al **empresario**, que es el rol que crea la empresa y
  la tienda.
- **Decisión**:
  - `RegisterData.role` conserva las intenciones de producto (`customer`,
    `seller`, `biller`), pero el payload traduce `seller`/`biller` a
    **`empresario`** y el resto a **`comprador`**. Esto sustituye el mapeo a
    `vendedor` de ADR-22/ADR-24.
  - La detección interna de vendedor (`isSellerRole`) acepta `empresario` y
    `vendedor`; la usan el `vendorGuard` y el asistente de alta de tienda.
  - El puerto `AuthRepository` consume **toda** la superficie `/auth`:
    `registro`, `login`, `refresh`, `logout`, `me`, `restablecer-contrasena`,
    `cambiar-contrasena`, `crear-usuario` y `vincular-personal`.
  - `crear-usuario` y `vincular-personal` se exponen en `AuthService`/`AuthStore`
    para las futuras pantallas de administración y logística; no se añade UI en
    este cambio.
  - El adapter normaliza `tenant_id`/`personal_id` a `tenantId`/`personalId` y
    sigue tolerando envelopes heredados (`R-AR-4`).
- **Consecuencias**: el login, refresh, logout y `me` funcionan contra el
  gateway actual. El alta con `empresario` exige que `identity-service` esté
  construido con el cambio de roles de ADR-25 del backend; una imagen anterior
  rechaza `empresario` y acepta `vendedor`. El alta de tienda sigue necesitando
  `POST /empresas` antes de `POST /vendedores/tienda` (tenant activo), que se
  abordará al conectar el dominio de empresas. Revertir es volver a mapear
  `seller`/`biller` a `vendedor` y retirar los dos métodos nuevos del puerto.

## ADR-27: Gestión de empresas (tenant comercial) en el frontend

- **Fecha**: 2026-10-21
- **Estado**: Aceptado
- **Contexto**: Core Engine incorporó las empresas como tenant comercial
  (ADR-25 del backend): la empresa agrupa tienda, vendedores, participación y
  modalidad logística. El frontend no tenía dominio de empresas y el alta de
  tienda fallaba contra el backend real porque el JWT del empresario recién
  registrado no incluía `tenant_id`.
- **Decisión**:
  - Nuevo feature lazy **`features/empresas/`** con modelos, adapter, puerto
    (`COMPANY_REPOSITORY`), servicio HTTP y `CompanyStore` (R-AR-3, R-AR-4).
  - Se consumen los cuatro endpoints del contrato: alta (`POST /empresas`),
    consulta (`GET /empresas/:id`), cambio de modalidad
    (`PATCH /empresas/:id/logistica`) y alta de vendedor
    (`POST /empresas/:id/vendedores`).
  - La página **`/vendedor/empresa`** vive bajo el shell del vendedor y su
    `vendorGuard`; muestra el alta al empresario sin empresa, la ficha de la
    empresa, el cambio de modalidad y el alta de vendedores con participación.
    Un vendedor solo ve la ficha en modo lectura.
  - Tras crear la empresa el `CompanyStore` **renueva la sesión**
    (`AuthStore.refreshTokenOnce`): el backend actualiza rol/`tenant_id` del
    usuario y el JWT anterior no lleva el tenant que exige
    `POST /vendedores/tienda`.
  - El identificador de la empresa activa se toma del `tenant_id` del usuario
    normalizado por el adapter de auth (ADR-26). La lista de vendedores se
    limita a los creados en la sesión porque el contrato público no expone un
    listado de vendedores de la empresa.
- **Consecuencias**: el empresario puede crear y configurar su empresa sin
  salir del panel; el alta de tienda ya dispone de `tenant_id` tras el refresh.
  **Actualización (ADR-28)**: la creación de empresa ya está encadenada dentro
  del paso 2 del asistente `/crear-tienda`. Queda pendiente editar el
  nombre/estado de la empresa cuando el contrato lo permita. Revertir es retirar
  el feature, la ruta y el ítem del sidebar.

## ADR-28: Onboarding encadenado empresa → tienda → ofertas

- **Fecha**: 2026-10-21
- **Estado**: Aceptado
- **Contexto**: el asistente `/crear-tienda` registraba la cuenta y creaba la
  tienda, pero el backend exige que el JWT del empresario lleve `tenant_id`
  (`POST /vendedores/tienda`) y que cada oferta incluya `tienda_id`
  (`POST /vendedores/productos`). Sin ese encadenado el onboarding fallaba
  contra el backend real.
- **Decisión**:
  - El paso 2 del asistente pasa a llamarse **Negocio** y agrupa los datos de la
    empresa (nombre + modalidad logística) y de la tienda. Si el usuario ya
    tiene `tenant_id`, la sección de empresa no se muestra.
  - `StoreWizardStore` orquesta el alta: crea la empresa
    (`POST /empresas`), **renueva la sesión** para obtener el nuevo JWT con
    tenant y solo entonces crea la tienda (`POST /vendedores/tienda`). Si el
    alta de empresa falla, no se crea la tienda; si la tienda falla después, el
    reintento omitie la empresa ya creada.
  - El nombre de la empresa es opcional en el formulario: si se deja vacío se
    usa el nombre de la tienda.
  - `publishOffer` incluye `tienda_id` en el payload
    (`{ tienda_id, producto_id, margen }`), conforme a `PublicarProductoRequestDto`.
- **Consecuencias**: el recorrido cuenta → empresa → tienda → productos funciona
  con el contrato real. El wizard gana una dependencia explícita del puerto
  `COMPANY_REPOSITORY` (provisto en la ruta lazy) y el `StoreWizardStore`
  depende de `AuthStore` para renovar la sesión. Revertir es volver a un paso 2
  de solo tienda y retirar `tienda_id` del payload de ofertas.

## ADR-29: Ofertas del vendedor (listado y margen)

- **Fecha**: 2026-10-21
- **Estado**: Aceptado
- **Contexto**: la sección **Productos** del panel era una página "En
  construcción". Core Engine ya expone el contrato de ofertas:
  `GET /vendedores/me/ofertas` (`PaginaOfertasResponseDto`) y
  `PATCH /vendedores/productos/:id` (`CambiarMargenRequestDto`), con el margen
  en enteros 0–90 (RN-01).
- **Decisión**:
  - Nuevo `VendorOffersStore` y página `pages/products` con el puerto
    `VENDOR_OFFER_REPOSITORY`/`VendorOfferService`, provistos en la ruta lazy de
    `productos`.
  - La página lista las ofertas paginadas con stock, precio base, margen y
    precio de venta; permite editar el margen por fila y refrescar.
  - El listado y la actualización pasan por un adapter tolerante
    (`VendorOffer`) que normaliza precios string/número y la paginación
    (`items`, `total`, `pagina`, `limite`, `paginas`).
  - La edición local valida margen entero 0–90 antes de llamar al backend y
    reemplaza la fila con la oferta devuelta por `PATCH`.
- **Consecuencias**: el panel deja de tener una sección muerta y el vendedor
  puede ajustar precios sin salir de la lista. La página no consulta
  `GET /vendedores/me/productos` (endpoint asumido del POS); usa únicamente el
  contrato público de ofertas. Revertir es restaurar la página "En
  construcción" y retirar el store, el servicio y el ítem de fixtures E2E.

## ADR-30: Ficha de la tienda pública en el storefront

- **Fecha**: 2026-10-21
- **Estado**: Aceptado
- **Contexto**: `ProductService.getStorefront` ya consumía `GET /tiendas/:id`
  (`TiendaPublicaResponseDto`), pero la página del catálogo ignoraba `tienda` y
  mostraba un título editorial fijo ("Tienda Completa"). El contrato sí devuelve
  el nombre y la descripción de la tienda, y el backend es multi-tienda.
- **Decisión**:
  - El catálogo público muestra `tienda.nombre` como título y
    `tienda.descripcion` como subtítulo, con un fallback editorial cuando la
    tienda no trae datos.
  - Se versiona un fixture de `TiendaPublicaResponseDto` (incluye `empresa_id`,
    `propietario_usuario_id`, `participacion_porcentaje` y ofertas con precios
    decimales) y un test de contrato del adapter.
  - El E2E del storefront verifica que el nombre y la descripción de la tienda
    salen del endpoint público.
- **Consecuencias**: el storefront deja de ser genérico y usa la identidad real
  de cada tienda sin peticiones adicionales (la ficha llega en la misma
  respuesta que las ofertas). Revertir es volver al título fijo y retirar el
  fixture/test de contrato.

## ADR-31: Ficha de la tienda del vendedor

- **Fecha**: 2026-10-21
- **Estado**: Aceptado
- **Contexto**: `StoreService.getMyStore` ya consumía
  `GET /vendedores/me/tienda` (`TiendaResponseDto`), pero ninguna pantalla la
  usaba. El vendedor no tenía un lugar para ver el nombre/descripción de su
  tienda, su empresa, participación o el enlace público.
- **Decisión**:
  - Nueva página **`/vendedor/tienda`** con el ítem "Mi tienda" en el sidebar.
    Usa `VendorStoreStore`, provisto en la ruta lazy junto a `STORE_REPOSITORY`.
  - La ficha muestra nombre, descripción, participación, fecha de creación,
    empresa, id de tienda y accesos a la tienda pública, productos y empresa.
  - Si el backend devuelve `404`, la vista muestra el estado vacío con enlace a
    `/crear-tienda`; los errores se traducen y se pueden reintentar.
  - El adapter de `stores` amplía el modelo `Store` con `companyId`,
    `ownerUserId`, `participationPercentage` y `createdAt` (opcionales) para
    reutilizar el mismo contrato sin duplicar el endpoint.
- **Consecuencias**: el vendedor tiene una vista de identidad de su tienda y un
  atajo a la tienda pública. El endpoint queda consumido por una sola capa
  (`StoreService`). Revertir es retirar la ruta, el ítem del sidebar y los
  campos opcionales del modelo.

## ADR-32: Catálogo maestro de productos

- **Fecha**: 2026-10-21
- **Estado**: Aceptado
- **Contexto**: la app consumía `GET /catalog/productos` solo para enriquecer el
  storefront y no existía una pantalla para administrar el catálogo maestro. El
  contrato expone listado público con filtros/paginación, detalle y CRUD del
  empresario.
- **Decisión**:
  - Nuevo `CatalogProductService`/`CatalogProductsStore` y página
    **`/vendedor/catalogo`** dentro del shell del vendedor.
  - Se consumen `GET /catalog/productos` (q, estado, categoría, paginación),
    `GET /catalog/productos/:id`, `POST /catalog/productos` y
    `PATCH /catalog/productos/:id`.
  - La página muestra SKU, nombre, categoría, precio base, stock y estado; el
    empresario puede crear y editar en un formulario inline. Un vendedor ve el
    listado en modo lectura.
  - El sidebar separa **Catálogo** (productos maestros) de **Ofertas** (lo que
    antes se llamaba "Productos"), para reflejar el contrato.
  - **Limitación conocida del backend**: `GET /catalog/productos` valida
    `pagina`/`limite` como números sin transformar la query string, así que
    rechaza `?pagina=1&limite=20` con `400 VALIDACION`. El servicio omite esos
    parámetros cuando tienen los valores por defecto; la paginación explícita
    queda pendiente de que Core Engine añada la coerción numérica.
- **Consecuencias**: el empresario administra su catálogo y las ofertas siguen
  su flujo propio. La primera página y los filtros `q`/`estado`/`categoria`
  funcionan contra el backend actual; la paginación explícita requiere el fix
  del backend. Revertir es retirar la ruta, el ítem del sidebar y los archivos
  del catálogo.

## ADR-33: Inventario de bodega para administración

- **Fecha**: 2026-10-22
- **Estado**: Aceptado
- **Contexto**: `GET /admin/inventario` expone las líneas de stock de la bodega
  (`LineaInventarioResponseDto`) y exige rol `admin`. El frontend no tenía área
  de administración ni guard para ese rol.
- **Decisión**:
  - Nuevo feature lazy **`admin`** con `ADMIN_ROUTES`, cargado desde
    `app.routes.ts` con `loadChildren`.
  - `adminGuard` en `auth` acepta `admin` y `super_admin`; restaura la sesión con
    refresh, manda al login al anónimo y al inicio a un rol no autorizado.
  - Página **`/admin/inventario`** con resumen (SKU, stock físico, reservado,
    valor total), búsqueda por SKU/nombre, filtro por estado y tabla con stock
    físico/disponible/reservado, precio base y valor total.
  - Adapter tolerante a `snake_case`/`camelCase`, números string y envelopes.
- **Consecuencias**: el área admin queda aislada del panel del vendedor y de su
  guard; añadir futuras pantallas admin solo requiere rutas hijas en
  `ADMIN_ROUTES`. Revertir es retirar el feature, la ruta lazy y el guard.

## ADR-34: Carrito alineado con `CarritoResponseDto`

- **Fecha**: 2026-10-22
- **Estado**: Aceptado
- **Contexto**: el carrito ya consumía los cinco endpoints de `/carrito`, pero
  el adapter descartaba `total`, `expira_en` y los metadatos de cada línea
  (`tienda_id`, `vendedor_id`, `sku`, `estado`). El total se recalculaba en el
  cliente y la reserva temporal del servidor no se mostraba.
- **Decisión**:
  - Introducir `CartSnapshot { items, total, expiresAt }` como valor del puerto
    `CART_REPOSITORY`; todas las mutaciones devuelven el snapshot normalizado.
  - El adapter usa el `total` autoritativo del backend (con fallback derivado) y
    conserva `expira_en`, `tienda_id`, `vendedor_id`, `sku` y `estado`.
  - `CartStore` expone `total` y `expiresAt`; el total del servidor prevalece
    sobre el derivado local y el invitado sigue usando su carrito en
    `localStorage`.
  - La vista del carrito muestra la hora de expiración de la reserva y limita el
    botón de aumentar cantidad al `stock` de la oferta.
- **Consecuencias**: el carrito refleja el estado real del backend (total y
  expiración) y evita añadir más unidades de las disponibles. El flujo de
  invitado no cambia. Revertir es volver a `CartItem[]` y retirar la vista de
  expiración/stock.

## ADR-35: Órdenes del comprador y checkout alineados con `OrderViewResponseDto`

- **Fecha**: 2026-10-22
- **Estado**: Aceptado
- **Contexto**: checkout, historial, detalle y timeline ya consumían `POST
/orders`, `GET /orders`, `GET /orders/:id` y `GET /orders/:id/timeline`, pero
  el adapter descartaba comisión, moneda, comprador/vendedor, dirección y fechas
  del ciclo de vida. La UI mostraba el estado crudo del backend y un
  `orderNumber` inventado cuando el contrato solo expone `id`.
- **Decisión**:
  - El modelo `OrderResponse` incorpora `buyerId`, `sellerId`, `commission`,
    `currency`, `shippingAddress`, `updatedAt` y las fechas `paidAt`,
    `shippedAt`, `deliveredAt`, `cancelledAt`, `returnedAt`.
  - `orderNumber` se deriva del `id` real (`ORD-XXXXXXXX`); se mantiene
    `order_number` como fallback tolerante para respuestas heredadas.
  - Se añade `orderStatusLabel` para traducir `pagada`, `en_preparacion`,
    `enviada`, `entregada`, `cancelada` y `devuelta` en historial, detalle y
    confirmación.
  - El checkout sigue creando la orden con `usar_carrito: true`; el backend
    vacía el carrito y la confirmación usa la orden devuelta.
- **Consecuencias**: el comprador ve estados legibles y la orden conserva el
  contexto completo del contrato. Quedan para siguientes PRs las vistas de
  administración (`/orders/admin/todas`), vendedor (`/orders/vendedor/*`,
  comisiones) y el avance de estado logístico (`PATCH /orders/:id/estado`).
  Revertir es volver al modelo reducido y al estado crudo.

## ADR-36: Órdenes globales y transición de estado para administración

- **Fecha**: 2026-10-22
- **Estado**: Aceptado
- **Contexto**: el área admin ya tenía inventario. Faltaban la vista global de
  órdenes (`GET /orders/admin/todas`) y el avance del ciclo logístico
  (`PATCH /orders/:id/estado`, roles admin/logística).
- **Decisión**:
  - Nueva página **`/admin/pedidos`** con lista global, filtro por estado y
    detalle con timeline.
  - El detalle usa `GET /orders/:id` y `GET /orders/:id/timeline`; el cambio de
    estado usa `PATCH /orders/:id/estado` con los estados permitidos
    (`en_preparacion`, `enviada`, `entregada`, `cancelada`, `devuelta`).
  - Se extiende el puerto de órdenes con `listAll` (admin) y `advanceStatus`
    (logística), reutilizando el adapter y el modelo del checkout.
  - Tras avanzar el estado se actualizan la fila y el detalle sin recargar la
    lista completa.
- **Consecuencias**: el admin opera el ciclo de la orden desde el área de
  administración. Los endpoints de vendedor (`/orders/vendedor/mis-ventas`,
  `/orders/tienda/:id`, comisiones) quedan pendientes porque el backend aún no
  autoriza al rol `empresario` (responde 403). Revertir es retirar la ruta y los
  métodos nuevos del puerto.

## ADR-37: Envíos de logística para administración y empresa

- **Fecha**: 2026-10-23
- **Estado**: Aceptado
- **Contexto**: el módulo `logistica` era una maqueta visual sin datos reales.
  Core Engine expone `GET /admin/envios` (todas las guías, con `monto`),
  `GET /empresarios/me/envios` (guías de la empresa),
  `POST /empresarios/me/envios/:id/asignacion` (flota `plataforma`/`empresa` en
  modalidad híbrida) y `PATCH /envios/:id/estado` (`enviada`, `entregada`,
  `cancelada`). Las guías nacen del evento `payment.procesado`, no de un alta
  manual.
- **Decisión**:
  - Nueva ruta lazy **`/logistica/envios`** dentro del shell existente, con
    `logisticsGuard` (admin, super_admin y empresario) y `EnviosStore` al
    alcance de la ruta.
  - El store elige el listado según el rol: admin/super_admin usan
    `/admin/envios`; empresario usa `/empresarios/me/envios`. La asignación solo
    se ofrece al empresario para envíos `hibrida`; el avance de estado se ofrece
    al admin y, para el empresario, solo cuando la guía ya está asignada a la
    flota de su tenant.
  - Modelo `Shipment` con guía, pedido, empresa, modalidad, proveedor, estado,
    fecha y `amount` opcional (solo admin). Adapter tolerante a `snake_case`,
    `camelCase`, montos string y envelopes.
  - La tabla filtra por estado en cliente, muestra carga/error/vacío y conserva
    el monto al actualizar una fila con la respuesta sin `monto`.
- **Consecuencias**: la primera fase de logística consume datos reales de
  envíos y cubre el ciclo de despacho. Quedan para siguientes fases el
  field-service (rutas, personal, tracking, incidencias) y la adaptación del
  panel de pedidos del empresario a `GET /orders/empresa`; los endpoints
  `/orders/vendedor/mis-ventas` y `/orders/vendedor/comisiones` siguen
  devolviendo 403 para `empresario` y no se consumen. Revertir es retirar la
  ruta, el ítem del sidebar y las capas nuevas del feature.

## ADR-38: Administración de almacenamiento por empresa

- **Fecha**: 2026-10-23
- **Estado**: Aceptado
- **Contexto**: Core Engine expone `GET /admin/storage/tenants` con el bucket,
  cuota, uso, objetos y estado de cada organización, además de `PATCH
/admin/storage/tenants/:id` para ajustar cuota/estado y `POST
/admin/storage/tenants/:id/recalcular` para reconstruir el uso desde la
  metadata. El frontend no tenía ninguna pantalla de almacenamiento.
- **Decisión**:
  - Nueva ruta lazy **`/admin/almacenamiento`** dentro del área de
    administración, con `adminGuard` y `StorageStore` al alcance de la ruta.
  - Resumen de empresas, uso total, cuota total y activos; tabla por tenant con
    tenant/bucket, barra de uso, objetos, estado y cuota editable en GB.
  - `PATCH` envía `cuota_bytes` (convertido desde GB) o `estado`; `POST`
    recalcula el uso. Tras cada mutación se actualiza la fila sin recargar.
  - Adapter tolerante a `snake_case`/`camelCase`, números string y
    `PaginaBucketsResponseDto`. Enlaces de navegación desde inventario y pedidos.
- **Consecuencias**: el admin controla cuotas y suspensión por empresa desde la
  consola. Quedan para una siguiente fase el panel de objetos del tenant
  (`/storage/bucket`, `/storage/objetos`, descarga y flujo de subida
  prefirmada). Revertir es retirar la ruta, la página, el store y los enlaces.

## ADR-39: Rutas y paradas de logística de campo

- **Fecha**: 2026-10-23
- **Estado**: Aceptado
- **Contexto**: `/logistica/rutas` era una página "En construcción". Core Engine
  expone `GET /field/rutas` (rutas del tenant con sus paradas),
  `PATCH /field/rutas/:id` (estado) y
  `PATCH /field/rutas/:id/paradas/:paradaId` (actualizar una parada). El
  `PATCH` de parada exige `nombre` además de `completada`.
- **Decisión**:
  - Sustituir el placeholder por la ruta lazy real, protegida con `fieldGuard`
    (admin, super_admin, empresario, logística, coordinador, supervisor y
    operativo; espeja `ROLES_LOGISTICA`).
  - `RutasStore` carga las rutas con sus paradas, autoselecciona la primera,
    permite filtrar por estado, actualizar el estado de la ruta y
    completar/reabrir paradas.
  - Al cambiar el estado, el backend no devuelve `paradas`; el store conserva
    las existentes al fusionar la respuesta. La actualización de parada envía
    `{ nombre, completada }` para respetar la validación del servicio.
  - Adapter tolerante a `snake_case`/`camelCase`, envelopes y paradas sin
    orden explícito.
- **Consecuencias**: primera fase de field-service cubierta con rutas y paradas.
  Quedan personal, incidencias, tracking, asistencia y asignación de flota.
  Revertir es restaurar el placeholder y retirar el store, la página y el puerto.

## ADR-40: Personal de logística de campo

- **Fecha**: 2026-10-23
- **Estado**: Aceptado
- **Contexto**: `/logistica/repartidores` era una página "En construcción". Core
  Engine expone `GET /field/personal` con el equipo del tenant, su cargo,
  disponibilidad, contacto, ruta/vehículo asignado, check-in y última ubicación.
- **Decisión**:
  - Sustituir el placeholder por una vista real protegida con `fieldGuard`.
  - `PersonalStore` carga el equipo, autoselecciona el primero, permite buscar
    por nombre/correo/teléfono y filtrar por estado; resume equipo, en ruta,
    disponibles y fuera de turno.
  - Vista maestro-detalle con ficha de contacto, ruta/vehículo, check-in y
    coordenadas reportadas. Sin mutaciones en esta fase.
  - Adapter tolerante a `snake_case`/`camelCase`, números string y envelopes.
- **Consecuencias**: el empresario consulta su equipo de reparto desde la
  consola. Quedan incidencias, tracking, asistencia y asignación de flota.
  Revertir es restaurar el placeholder y retirar store, página y puerto.

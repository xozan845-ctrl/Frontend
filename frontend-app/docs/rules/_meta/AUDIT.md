# AUDIT — Estado actual del frontend vs `rules/`

> **Snapshot** reescrito completo en cada auditoría (`R-COV-3`): describe el
> estado **presente** de `frontend-ecomerce`. El histórico vive en
> [`AUDIT-HISTORY.md`](./AUDIT-HISTORY.md).

- **Última auditoría:** 2026-10-22 — **13ª de frontend-ecomerce**: cierre de la
  fase de **gobernanza y calidad** (presupuesto como gate, umbrales y diff
  coverage, axe en E2E, Lighthouse en CI y `docs-sync` por área) sobre los
  módulos acumulados hasta ADR-35.
- **Actualización (2026-10-23):** se añaden `presentation-guards`
  (`R-SO-8` + `R-ST-3`) y `R-PF-4` a `performance-guards`; la cobertura del
  motor sube a **44/252** sin deuda nueva. Los demás gates no se re-auditan en
  esta actualización.
- **Estado global:** 🟢 **CUMPLE** — gates **G-1…G-6** + `R-QA-6` verdes,
  presupuesto inicial **513.09 kB** dentro del techo **515 kB** (error 560 kB),
  cobertura **95.31/89.55/94.84/96.11** sobre umbrales **94/88/93/95** más diff
  coverage **80%**, `npm audit` en **0**, **27 flujos E2E** (incluye axe en
  desktop y móvil) y **Lighthouse 84/98/93/91**. El motor verifica **44/252**
  IDs de regla con check real; sin contextuales pendientes
  declaradas en `cites`. Sin deudas abiertas.

## Evidencia ejecutada (2026-10-22)

| Verificación        | Comando                        | Resultado                                                                                   |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| Build (G-3)         | `npm run build`                | ✅ initial **513.09 kB** (< 515 kB de aviso; error 560 kB) · SW generado (`ngsw-worker.js`) |
| Tests (G-1)         | `npm test -- --watch=false`    | ✅ **167 archivos / 1011 tests**                                                            |
| Cobertura (G-2)     | idem                           | ✅ 95.31 / 89.55 / 94.84 / 96.11 (umbral **94/88/93/95**) + diff **80%** (`R-COV-5`)        |
| E2E (G-6)           | `npm run e2e`                  | ✅ **27 flujos Playwright** (incluye axe en desktop y Pixel 5, `R-E-25`)                    |
| Lighthouse (R-PF-8) | `npm run lighthouse`           | ✅ 84 / 98 / 93 / 91 (mediana de 3 runs; umbral 70/95/90/85)                                |
| Formato (G-4)       | `npx prettier --check .`       | ✅ en CI                                                                                    |
| Lint (G-5)          | `npm run lint`                 | ✅ **0 errores / 0 warnings**                                                               |
| Seguridad (R-QA-6)  | `npm audit --audit-level=high` | ✅ **0 vulnerabilidades**                                                                   |
| CI                  | `gh pr checks`                 | ✅ 14 checks obligatorios en verde (incluye Lighthouse, Gitleaks y CodeQL)                  |
| `main` protegida    | `gh api .../protection`        | ✅ PR obligatorio + **14 checks** + estricto, sin force, `enforce_admins: true`             |
| Release             | `git tag`                      | ✅ `v1.25.2` sobre `main` (`R-CD-3`)                                                        |

### Cobertura del motor de reglas (`R-DO-9`)

- **44/252** IDs con check real; sin contextuales pendientes.
- Suites nuevas de esta fase: `store-guards` (R-ST-1/2/4/7), `naming-guards`
  (R-NC-1/2/11), `coverage-guards` (R-COV-2), `presentation-guards` (R-SO-8 y
  R-ST-3), R-PF-4 en `performance-guards` y R-NC-9 en `architecture-types`.
- Gates de calidad en CI: `check-budget` (R-PF-1), `coverage:diff` (R-COV-5),
  axe (R-E-25), Lighthouse (R-PF-8) y `docs-sync` por área (R-DO-8).

## Cumplimiento por área

### Arquitectura y naming (`R-AR`, `R-NC`)

| Regla                       | Estado | Evidencia                                                                                                         |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| R-AR-1/2 estructura         | ✅     | `core/`, `shared/`, `layout/`, `features/`; `core`/`shared`/`layout` no importan features                         |
| R-AR-3 puertos + DI         | ✅     | `architecture-ports`: 16 repositorios con interfaz + `InjectionToken`; stores sin adapters ni `HttpClient`        |
| R-AR-4/7/8/9/11             | ✅     | Adapters, signal stores, reactive forms, sin HTTP en componentes, errores traducidos, entorno (R-AR-5 contextual) |
| R-AR-6/12 rutas             | ✅     | `<feature>.routes.ts`; `stores` y `vendor` con `loadChildren`; páginas lazy                                       |
| R-AR-10 ciclo de vida       | ✅     | `rxMethod` (se libera con el store) + `takeUntilDestroyed` + listeners y sondeo liberados                         |
| R-AR-13 frontera de `core/` | ✅     | `core/{config,constants,models,services}` sin UI ni features                                                      |
| R-NC-1 sufijo `.component`  | ✅     | **0** componentes sin sufijo                                                                                      |
| R-NC-2 plantillas/estilos   | ✅     | Plantillas y estilos en archivos hermanos; sin `styles: []` en el decorador                                       |
| R-NC-9/10 DTO vs modelo     | ✅     | `models/*.dto.ts` con `Backend...DTO` (`product`, `store`, `vendor`); `strict` + `unknown` + narrowing            |
| R-NC-11 claves `ecom_`      | ✅     | `ecom_theme`, `ecom_cart_items`, `ecom_refresh_token`, …                                                          |
| R-NC-12 rutas               | ✅     | `kebab-case`; idioma por tipo de término (ADR-17); `**` → `not-found`                                             |

### Ingeniería frontend (`R-CX`, `R-SO`, `R-SH`, `R-LZ`, `R-ST`, `R-PF`, `R-HI`)

| Regla                       | Estado | Evidencia                                                                                                                                     |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX-1..5/7                 | ✅     | Capas, adapters, casos de uso con nombre de dominio; lógica fuera de componentes                                                              |
| R-CX-6 fronteras de feature | ✅     | Entrypoints públicos (`public-api.ts`/`public-ui.ts`); sin imports internos cruzados                                                          |
| R-SO-1/4/5                  | ✅     | DIP + ISP: puertos separados (stores, catálogo, pedidos, clientes, productos del vendedor)                                                    |
| R-SO-6/8 presentacionales   | ✅     | Presentacionales por `input`/`output`; contenedores en `pages/` (POS, pedidos, clientes, inicio)                                              |
| R-SH-1..6                   | ✅     | `shared/` sin dependencias a features; ≥2 consumidores                                                                                        |
| R-LZ-1..6                   | ✅     | Rutas lazy + `@defer (on idle)`; mocks fuera del bundle inicial; sin preloading                                                               |
| R-ST-1..7                   | ✅     | Stores con `withState/Computed/Methods/Hooks` + `rxMethod`; KPIs y filtros en `withComputed`; `store-guards` + `presentation-guards` (R-ST-3) |
| R-PF-1/3/5                  | ✅     | Build **511.94 kB** (< 515 kB, sin aviso; gate `check-budget`); rutas lazy; sin preloading                                                    |
| R-PF-2 imágenes             | ✅     | `aspect-square`, `priority` estático para LCP y preconnect; **0** `NG0295x`                                                                   |
| R-PF-4/6/7                  | ✅     | Derivados en `computed`/pipes; **sin** métodos del componente en plantilla; **sin** `setTimeout`/`setInterval`; zoneless                      |
| R-HI-\*                     | N/A    | Sin SSR (diferido, ADR-09)                                                                                                                    |

### UI (`R-AC`, `R-UX`)

| Regla            | Estado | Evidencia                                                                                                                                                       |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-AC-1/2/4/5/6/7 | ✅     | `templateAccessibility` 0 errores; `alt`; `prefers-reduced-motion`; `aria-live` en toasts, chip "En vivo" y stepper; axe en E2E sin violaciones graves (R-E-25) |
| R-AC-3 modales   | ✅     | `focus-trap.directive` (foco atrapado y devuelto) + `role="dialog"`/`aria-modal`, Escape y botones (alta de clientes, confirmación de estado)                   |
| R-UX-1/2/3/4/5   | ✅     | Estados de carga/error/vacío con esqueletos en todas las páginas del vendedor; responsive, dark mode, textos en español                                         |
| R-UX-6 SEO/PWA   | ✅     | `SeoService` en todas las páginas (con `reset()` al salir, incl. vendor) + manifest + SW + `theme-color`                                                        |

### Seguridad (`R-SE`)

| Regla                  | Estado | Evidencia                                                                                                           |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| R-SE-1 JWT en cabecera | ✅     | Access en memoria; refresh en `sessionStorage`; purga del `localStorage` heredado                                   |
| R-SE-2/4               | ✅     | Sin secretos en el bundle ni datos sensibles en consola                                                             |
| R-SE-3                 | ✅     | **0** `innerHTML`/`bypassSecurityTrust` (resaltado por interpolación)                                               |
| R-SE-5 / R-QA-6        | ✅     | `npm audit` → 0                                                                                                     |
| R-SE-6/7/8             | ✅     | Guard de rol del vendedor, validación de formularios (matriz R-CP-8), `rel="noopener"`, solo al backend configurado |
| R-SE-9 CSP             | ✅     | CSP en `index.html` **y** cabecera en `nginx.conf`                                                                  |

### Testing (`R-U`, `R-CP`, `R-E`, `R-C`, `R-RB`, `R-QA`, `G-*`)

| Regla             | Estado | Evidencia                                                                                                                             |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| R-U-1..14 unit    | ✅     | Adapters (todos los shapes), stores, servicios, guard, interceptor, directiva (+ vendedor)                                            |
| R-QA-1 crítica    | ✅     | `auth.store` 96/81 · `product.store` 98/85 · `cart.store` 96/92 · servicios ≥ 96 · stores del vendedor ≥ 90                           |
| R-CP-1..8 comps   | ✅     | Specs de todos los componentes con lógica; estados carga/error/vacío; `data-testid` (R-CP-2); matriz de formulario del alta (R-CP-8)  |
| R-C-1..8 contrato | ✅     | Fixtures versionados por adapter + tests de contrato (incl. `stores`); `vendor` con contrato asumido y adapters tolerantes (R-C)      |
| R-E-1..25 E2E     | ✅     | **26 flujos**: storefront, IA y vendedor; **axe** sin violaciones serious/critical en home/catálogo/login (desktop y Pixel 5, R-E-25) |
| R-FL-3 TZ         | ✅     | `src/test-setup.ts` fija `TZ`                                                                                                         |
| R-REG-1/3         | ✅     | Regresiones marcadas (`regression: 71`): catálogo en el paso 3 y carrito de vendedor                                                  |
| R-RB-3 robustez   | ✅     | Los stores no propagan el error; `localStorage` tolerante; fechas vacías/inválidas degradan                                           |
| R-QA-4 edge cases | ✅     | 400/403/404/409/500, respuesta malformada y red caída degradan con mensaje de dominio                                                 |
| R-COV-1 ratchet   | ✅     | Umbrales **94/88/93/95** en `angular.json` + diff coverage **80%** (`R-COV-5`)                                                        |
| R-QA-2/5          | ✅     | Tests sin red e independientes                                                                                                        |

### Git / CI / CD

| Regla                   | Estado | Evidencia                                                                               |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- |
| R-GB-1 `main` protegida | ✅     | PR obligatorio + **14 checks** + estricto, sin force, `enforce_admins`                  |
| R-GB-2/3/4 tags         | ✅     | Trunk-based, historial lineal, tag `v1.25.2` sobre `main` validado por `release.yml`    |
| R-GB-7 higiene de ramas | ✅     | Solo `main` en `origin`                                                                 |
| R-GA/GC/GP              | ✅     | Stage explícito, Conventional Commits en español, `--rebase`                            |
| R-PR-1/2/4/6/7/8        | ✅     | PRs atómicas con evidencia y CHECKLIST, checks en la cabeza, merge `--rebase`           |
| R-CI-1..6 / R-EN-1..4   | ✅     | `ci.yml` (jobs + `release-readiness` informativo) + `release.yml` (tag gate), artifacts |
| R-CD-1/2/3/9            | ✅     | `release-check.mjs` + `release.yml`; `Dockerfile`/`nginx.conf`; sin secretos; smoke     |

### Documentación / IA

| Regla        | Estado | Evidencia                                                                                        |
| ------------ | ------ | ------------------------------------------------------------------------------------------------ |
| R-DO-1/2/6/8 | ✅     | README al día, tabla E2E con R-E-1…R-E-25, ADRs (ADR-01…ADR-34), plantillas y docs-sync por área |
| R-IA-1..6    | ✅     | Trabajo por PRs atómicas con evidencia y regression-first                                        |

## Gates de CI

| Gate                                                                        | Estado             |
| --------------------------------------------------------------------------- | ------------------ |
| G-1 Unit + componentes · G-2 Cobertura · G-3 Build · G-4 Formato · G-5 Lint | ✅ efectivos en CI |
| G-6 E2E                                                                     | ✅ efectivo en CI  |
| R-QA-6 Security gate                                                        | ✅                 |

**Total: 6 ✅ + R-QA-6 ✅ · 0 ❌.**

## Deudas abiertas

- **Ninguna.** El segundo `ADR-18` (provisión de infraestructura por feature en
  rutas lazy) quedó renumerado a **`ADR-21`** —primer número libre tras
  `ADR-20`, sin tocar los ADRs que ya tenían referencias— y todas sus menciones
  quedaron al día (R-DO-2, R-IA-6).

La **auditoría del módulo `vendor`** (12ª, ADR-20) construyó y verificó el panel
del vendedor: shell con sidebar y rutas lazy bajo guard de rol (R-AR-12, R-LZ-1,
R-SE-6), POS con cartera, catálogo, borrador con IVA 15 % y "Pedidos recientes"
en vivo por sondeo con `timer` —sin `setInterval` (R-PF-6)—, pedidos con filtro
por estado y detalle con transiciones, clientes con búsqueda `debounce` y alta
con matriz de formulario (R-CP-8), inicio con KPIs derivados (R-ST-3) y SEO con
restauración en todas las páginas (R-UX-6). La tabla de reglas E2E quedó
completa: se registraron los flujos del feature IA (R-E-16/17) y se añadieron los
del vendedor (R-E-18/19). El contrato de pedidos/clientes/stock del backend aún
no existe: el módulo opera con modo `mock` y adapters tolerantes (frontera del
backend, abajo).

Los hallazgos de la auditoría del módulo `stores` quedaron cerrados por PRs
atómicas (UX/SEO, arquitectura/DTO/`rxMethod`, tests de robustez y
documentación), el presupuesto inicial volvió a estar dentro de `budget`
(R-PF-1) y el umbral de cobertura se elevó (R-COV-1). La **segunda pasada**
(contrato backend, accesibilidad, cobertura por archivo, arquitectura y
validación de entrada) también cerró todos sus hallazgos: envelope `{ data }` y
`mensaje` del backend (R-C-1/2), fixture de contrato de `stores` (R-C-8), ramas
del servicio al 95% (R-QA-1), nombre accesible del stepper y región viva de carga
(R-AC-1/7) y **ADR-21** para la provisión por feature (R-AR-3).

La **auditoría del módulo `cart`** (9ª) cerró sus 18 hallazgos: diálogos
accesibles con Escape (R-AC-3), estados de carga/error y SEO (R-UX-1/6), DTOs +
envelope + fixture de contrato (R-C-1/8, R-NC-9), cobertura de la lógica crítica
≥ 80% (R-QA-1), `rxMethod` y `CartUiStore` (R-ST-5/6), persistencia en
`withHooks` (R-ST-7), endpoints sin hardcode y errores traducidos (R-AR-9/11) y
el drawer como contenedor diferido (`@defer`, R-AR-6/R-LZ-1/R-SO-8) — lo que bajó
el inicial a **483.45 kB**.

La **auditoría del módulo `account`** (11ª) cerró sus 8 hallazgos: suscripciones
liberadas con `takeUntilDestroyed` y SEO restaurado (R-AR-10, R-UX-6), error de
contraseña traducido y estados de carga como región viva (R-AR-9, R-UX-1,
R-AC-7), e iconos accesibles, `data-testid` y sin funciones en la plantilla
(R-AC-1, R-CP-2, R-PF-4).

La **auditoría del módulo `products`** (10ª) cerró sus 15 hallazgos: DTOs de
oferta/tienda y errores traducidos (R-NC-9, R-AR-9), `loadStore` con `rxMethod`
(R-ST-5), el buscador como contenedor (R-SO-8), el enlace `/shop` corregido
(R-DO-1), sin `bind` en plantilla y SEO restaurado (R-PF-4, R-UX-6), buscador con
`NgOptimizedImage` (R-PF-2), iconos accesibles y `data-testid` (R-AC-1, R-CP-2) y
los stores secundarios al 100% (R-U-8, R-RB-4).

### Frontera del backend (fuera del alcance del frontend)

- Core Engine **no** expone un directorio público `GET /tiendas`, por lo que la
  raíz `/` es una entrada por URL (ADR-15).
- Core Engine **no** expone aún los endpoints de pedidos, clientes ni stock del
  vendedor; el feature `vendor` (ADR-20) consume un contrato asumido con modo
  `mock` mientras tanto.
- Los productos del catálogo **no** traen imágenes; se usa una imagen de
  fallback.
- CORS debe permitir el origen del frontend en producción (config de despliegue).

## Cómo re-auditar

```bash
npm ci && npm run build            # G-3 (budgets) + SW
npm test -- --watch=false          # G-1 / G-2
npm run coverage:diff              # R-COV-5 (diff coverage)
npx prettier --check .             # G-4
npm run lint                       # G-5
npm run typecheck                  # G-3
npm run rules:check                # R-DO-9 (motor de reglas)
npm run test:engine                # suites del motor
npm audit --audit-level=high       # R-QA-6
npm run e2e                        # G-6 (incluye axe, R-E-25)
npm run lighthouse                 # R-PF-8
gh api repos/<owner>/<repo>/branches/main/protection   # R-GB-1
```

Al terminar: **reescribir este snapshot** y **agregar una entrada nueva** al
final de `AUDIT-HISTORY.md` (`R-COV-3`).

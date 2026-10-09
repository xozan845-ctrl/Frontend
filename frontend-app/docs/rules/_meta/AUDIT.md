# AUDIT — Estado actual del frontend vs `rules/`

> **Snapshot** reescrito completo en cada auditoría (`R-COV-3`): describe el
> estado **presente** de `frontend-ecomerce`. El histórico vive en
> [`AUDIT-HISTORY.md`](./AUDIT-HISTORY.md).

- **Última auditoría:** 2026-10-09 — **9ª de frontend-ecomerce**: auditoría del
  módulo **`cart`** (contrato, accesibilidad, cobertura, store, arquitectura) y
  cierre de todos sus hallazgos.
- **Estado global:** 🟢 **CUMPLE** — gates **G-1…G-6** + `R-QA-6` verdes,
  presupuesto inicial **dentro de budget**, cobertura con umbral elevado
  (`R-COV-1`) y **sin deudas abiertas**.

## Evidencia ejecutada (2026-10-09)

| Verificación       | Comando                        | Resultado                                                            |
| ------------------ | ------------------------------ | -------------------------------------------------------------------- |
| Build (G-3)        | `npm run build`                | ✅ initial **485.16 kB** (< 500 kB) · SW generado (`ngsw-worker.js`) |
| Tests (G-1)        | `npm test -- --watch=false`    | ✅ **71 archivos / 410 tests**                                       |
| Cobertura (G-2)    | idem                           | ✅ 93.81 / 90.55 / 93.47 / 93.92 (umbral **85/75/85/85**, `R-COV-1`) |
| E2E (G-6)          | `npm run e2e`                  | ✅ **9 flujos Playwright · 0 errores/warnings**                      |
| Formato (G-4)      | `npx prettier --check .`       | ✅                                                                   |
| Lint (G-5)         | `npm run lint`                 | ✅ **0 errores / 0 warnings** (con `templateAccessibility`)          |
| Seguridad (R-QA-6) | `npm audit --audit-level=high` | ✅ **0 vulnerabilidades**                                            |
| CI                 | `gh pr checks`                 | ✅ 6/6 jobs requeridos, en verde                                     |
| `main` protegida   | `gh api .../protection`        | ✅ PR obligatorio + 6 checks, sin force, `enforce_admins: true`      |
| Release            | `git tag`                      | ✅ `v1.14.0` sobre `main`                                            |

## Cumplimiento por área

### Arquitectura y naming (`R-AR`, `R-NC`)

| Regla                       | Estado | Evidencia                                                                                            |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| R-AR-1/2 estructura         | ✅     | `core/`, `shared/`, `layout/`, `features/`; `core`/`shared`/`layout` no importan features            |
| R-AR-3 puertos + DI         | ✅     | Stores dependen **solo** de `InjectionToken`; `stores` provee sus puertos en su ruta lazy            |
| R-AR-4/5/7/8/9/11           | ✅     | Adapters, signal stores, reactive forms, sin HTTP en componentes, errores traducidos, entorno        |
| R-AR-6/12 rutas             | ✅     | `<feature>.routes.ts`; `stores` con `loadChildren`; páginas lazy                                     |
| R-AR-10 ciclo de vida       | ✅     | `rxMethod` (se libera con el store) + `takeUntilDestroyed` + listeners liberados                     |
| R-AR-13 frontera de `core/` | ✅     | `core/{config,constants,models,services}` sin UI ni features                                         |
| R-NC-1 sufijo `.component`  | ✅     | **0** componentes sin sufijo                                                                         |
| R-NC-2 plantillas/estilos   | ✅     | Plantillas y estilos en archivos hermanos; sin `styles: []` en el decorador                          |
| R-NC-9/10 DTO vs modelo     | ✅     | `models/*.dto.ts` con `Backend...DTO` (`product.dto`, `store.dto`); `strict` + `unknown` + narrowing |
| R-NC-11 claves `ecom_`      | ✅     | `ecom_theme`, `ecom_cart_items`, `ecom_refresh_token`, …                                             |
| R-NC-12 rutas               | ✅     | `kebab-case`; idioma por tipo de término (ADR-17); `**` → `not-found`                                |

### Ingeniería frontend (`R-CX`, `R-SO`, `R-SH`, `R-LZ`, `R-ST`, `R-PF`, `R-HI`)

| Regla                       | Estado | Evidencia                                                                            |
| --------------------------- | ------ | ------------------------------------------------------------------------------------ |
| R-CX-1..5/7                 | ✅     | Capas, adapters, casos de uso con nombre de dominio; lógica fuera de componentes     |
| R-CX-6 fronteras de feature | ✅     | Entrypoints públicos (`public-api.ts`/`public-ui.ts`); sin imports internos cruzados |
| R-SO-1/4/5                  | ✅     | DIP + ISP: `StoreRepository` y `CatalogRepository` separados; puertos inyectados     |
| R-SO-6/8 presentacionales   | ✅     | Presentacionales por `input`/`output`; contenedores en `pages/`                      |
| R-SH-1..6                   | ✅     | `shared/` sin dependencias a features; ≥2 consumidores                               |
| R-LZ-1..6                   | ✅     | Rutas lazy + `@defer (on idle)`; mocks fuera del bundle inicial; sin preloading      |
| R-ST-1..7                   | ✅     | 7 stores con `withState/Computed/Methods/Hooks` + `rxMethod`; una fuente de verdad   |
| R-PF-1/3/5                  | ✅     | Build **485.16 kB** (< 500 kB); rutas lazy; sin preloading                           |
| R-PF-2 imágenes             | ✅     | `aspect-square`, `priority` estático para LCP y preconnect; **0** `NG0295x`          |
| R-PF-4/6/7                  | ✅     | Derivados en `computed`; sin `setTimeout`/`setInterval` en dominios; **zoneless**    |
| R-HI-\*                     | N/A    | Sin SSR (diferido, ADR-09)                                                           |

### UI (`R-AC`, `R-UX`)

| Regla            | Estado | Evidencia                                                                                                                                                |
| ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-AC-1/2/4/5/6/7 | ✅     | `templateAccessibility` 0 errores; `alt`; `prefers-reduced-motion`; `aria-live` en toasts; stepper con nombre accesible (R-AC-1) y carga `role="status"` |
| R-AC-3 modales   | ✅     | `focus-trap.directive` (foco atrapado y devuelto) + `role="dialog"`/`aria-modal`                                                                         |
| R-UX-1/2/3/4/5   | ✅     | Estados de carga/error/vacío (incluido el asistente), responsive, dark mode, textos en español                                                           |
| R-UX-6 SEO/PWA   | ✅     | `SeoService` en todas las páginas (con `reset()` al salir) + manifest + SW + `theme-color`                                                               |

### Seguridad (`R-SE`)

| Regla                  | Estado | Evidencia                                                                         |
| ---------------------- | ------ | --------------------------------------------------------------------------------- |
| R-SE-1 JWT en cabecera | ✅     | Access en memoria; refresh en `sessionStorage`; purga del `localStorage` heredado |
| R-SE-2/4               | ✅     | Sin secretos en el bundle ni datos sensibles en consola                           |
| R-SE-3                 | ✅     | **0** `innerHTML`/`bypassSecurityTrust` (resaltado por interpolación)             |
| R-SE-5 / R-QA-6        | ✅     | `npm audit` → 0                                                                   |
| R-SE-6/7/8             | ✅     | Validación, `rel="noopener"`, solo al backend configurado                         |
| R-SE-9 CSP             | ✅     | CSP en `index.html` **y** cabecera en `nginx.conf`                                |

### Testing (`R-U`, `R-CP`, `R-E`, `R-C`, `R-RB`, `R-QA`, `G-*`)

| Regla             | Estado | Evidencia                                                                                             |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| R-U-1..14 unit    | ✅     | Adapters (todos los shapes), stores, servicios, guard, interceptor, directiva                         |
| R-QA-1 crítica    | ✅     | `auth.store` 96/81 · `product.store` 98/85 · `cart.store` 96/92 · servicios ≥ 96                      |
| R-CP-1..8 comps   | ✅     | Specs de todos los componentes con lógica; estados carga/error/vacío; `data-testid` (R-CP-2)          |
| R-C-1..8 contrato | ✅     | Fixtures versionados por adapter + tests de contrato (incl. `stores`, R-C-1/2/6/8)                    |
| R-E-1..15 E2E     | ✅     | **9 flujos**; el fixture falla ante **error y warning** de consola (`R-E-9`); alta de tienda `R-E-15` |
| R-FL-3 TZ         | ✅     | `src/test-setup.ts` fija `TZ`                                                                         |
| R-REG-1/3         | ✅     | Regresiones marcadas (`regression: 71`): catálogo en el paso 3 y carrito de vendedor                  |
| R-RB-3 robustez   | ✅     | Los stores no propagan el error; `localStorage` tolerante                                             |
| R-QA-4 edge cases | ✅     | 400/403/404/409/500, respuesta malformada y red caída degradan con mensaje de dominio                 |
| R-COV-1 ratchet   | ✅     | Umbral elevado a **85/75/85/85** en `angular.json`                                                    |
| R-QA-2/5          | ✅     | Tests sin red e independientes                                                                        |

### Git / CI / CD

| Regla                   | Estado | Evidencia                                                                     |
| ----------------------- | ------ | ----------------------------------------------------------------------------- |
| R-GB-1 `main` protegida | ✅     | PR obligatorio + 6 checks + sin force + `enforce_admins`                      |
| R-GB-2/3/4 tags         | ✅     | Trunk-based, historial lineal, tag `v1.14.0`                                  |
| R-GB-7 higiene de ramas | ✅     | Solo `main` en `origin`                                                       |
| R-GA/GC/GP              | ✅     | Stage explícito, Conventional Commits en español, `--rebase`                  |
| R-PR-1/2/4/6/7/8        | ✅     | PRs atómicas con evidencia y CHECKLIST, checks en la cabeza, merge `--rebase` |
| R-CI-1..6 / R-EN-1..4   | ✅     | `ci.yml` (6 jobs), concurrencia, cache, artifacts                             |
| R-CD-1/2/9              | ✅     | `Dockerfile` + `nginx.conf`, sin secretos, smoke verificado                   |

### Documentación / IA

| Regla      | Estado | Evidencia                                                                                   |
| ---------- | ------ | ------------------------------------------------------------------------------------------- |
| R-DO-1/2/6 | ✅     | README (rutas y features al día), reglas, API pública entre dominios y ADRs (ADR-01…ADR-18) |
| R-IA-1..6  | ✅     | Trabajo por PRs atómicas con evidencia y regression-first                                   |

## Gates de CI

| Gate                                                                        | Estado             |
| --------------------------------------------------------------------------- | ------------------ |
| G-1 Unit + componentes · G-2 Cobertura · G-3 Build · G-4 Formato · G-5 Lint | ✅ efectivos en CI |
| G-6 E2E                                                                     | ✅ efectivo en CI  |
| R-QA-6 Security gate                                                        | ✅                 |

**Total: 6 ✅ + R-QA-6 ✅ · 0 ❌.**

## Deudas abiertas

Ninguna. Los hallazgos de la auditoría del módulo `stores` quedaron cerrados por
PRs atómicas (UX/SEO, arquitectura/DTO/`rxMethod`, tests de robustez y
documentación), el presupuesto inicial volvió a estar dentro de `budget`
(R-PF-1) y el umbral de cobertura se elevó (R-COV-1). La **segunda pasada**
(contrato backend, accesibilidad, cobertura por archivo, arquitectura y
validación de entrada) también cerró todos sus hallazgos: envelope `{ data }` y
`mensaje` del backend (R-C-1/2), fixture de contrato de `stores` (R-C-8), ramas
del servicio al 95% (R-QA-1), nombre accesible del stepper y región viva de carga
(R-AC-1/7) y **ADR-18** para la provisión por feature (R-AR-3).

La **auditoría del módulo `cart`** (9ª) cerró sus 18 hallazgos: diálogos
accesibles con Escape (R-AC-3), estados de carga/error y SEO (R-UX-1/6), DTOs +
envelope + fixture de contrato (R-C-1/8, R-NC-9), cobertura de la lógica crítica
≥ 80% (R-QA-1), `rxMethod` y `CartUiStore` (R-ST-5/6), persistencia en
`withHooks` (R-ST-7), endpoints sin hardcode y errores traducidos (R-AR-9/11) y
el drawer como contenedor diferido (`@defer`, R-AR-6/R-LZ-1/R-SO-8) — lo que bajó
el inicial a **485.16 kB**.

### Deudas de backend (fuera del alcance del frontend)

- Core Engine **no** expone un directorio público `GET /tiendas`, por lo que la
  raíz `/` es una entrada por URL (ADR-15).
- Los productos del catálogo **no** traen imágenes; se usa una imagen de
  fallback.
- CORS debe permitir el origen del frontend en producción (config de despliegue).

## Cómo re-auditar

```bash
npm ci && npm run build            # G-3 (budgets) + SW
npm test -- --watch=false          # G-1 / G-2
npx prettier --check .             # G-4
npm run lint                       # G-5
npm audit --audit-level=high       # R-QA-6
npm run e2e                        # G-6
gh api repos/<owner>/<repo>/branches/main/protection   # R-GB-1
```

Al terminar: **reescribir este snapshot** y **agregar una entrada nueva** al
final de `AUDIT-HISTORY.md` (`R-COV-3`).

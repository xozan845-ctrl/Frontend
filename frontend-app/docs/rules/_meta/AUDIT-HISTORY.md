# AUDIT-HISTORY — Histórico de auditorías

> Log **cronológico append-only** de las auditorías contra `rules/`. El estado
> consolidado vive en [`AUDIT.md`](./AUDIT.md); este archivo nunca se reescribe,
> solo se le agrega una entrada por auditoría (`R-COV-3`).
>
> ⚠️ **Procedencia:** la documentación de reglas se heredó del proyecto backend
> **Core Engine**. Las auditorías de ese proyecto **no** se arrastran a este log:
> la primera entrada de aquí en adelante es la de este frontend. El histórico
> previo pertenece a otro repositorio.

---

## Auditoría 0 — Adaptación de reglas al frontend (2026-10-06)

- **Alcance:** reescritura de `docs/rules/**` y `docs/decisiones.md` para una SPA
  Angular 22 (NgRx Signals + Tailwind + Vitest), sustituyendo el contenido
  backend (NestJS, microservicios, Postgres, RabbitMQ, Dockploy multi-entorno).
- **Decisiones registradas:** ADR-01 (trunk-based), ADR-02 (Dockploy), ADR-03
  (Angular feature-first + señales), ADR-04 (puertos + adapters), ADR-05 (estado
  local), ADR-06 (Vitest) — ver [`../../decisiones.md`](../../decisiones.md).
- **Áreas creadas:** `architecture/`, `ui/`, `security/`, `test/`, `git/`,
  `ci/`, `cd/`, `ai/`, `documentation/`, `_meta/`.
- **Estado global:** 🔴 INICIAL. El repo arranca con 3 specs smoke, sin cobertura,
  sin ESLint, sin CI y sin pipeline de despliegue. La arquitectura base sí está
  implementada (feature-first, puertos + DI, adapters, signal stores, reactive
  forms, accesibilidad básica).
- **Evidencia:** inspección completa del repo; no se ejecutaron `npm test` ni
  `npm run build` (dependencias no instaladas). Sin CI, ningún gate se marca ✅.
- **Snapshot:** [`AUDIT.md`](./AUDIT.md).

---

## Auditoría 1 — Primera auditoría ejecutada (2026-10-06)

- **Alcance:** contraste de todo el repo contra `rules/` con dependencias
  instaladas y comandos reales.
- **Comandos:** `npm ci`, `npm run build`, `npm test -- --watch=false`,
  `npx prettier --check .`, `npm audit --audit-level=high`, `npm audit`,
  greps de reglas.
- **Resultado:**
  - ✅ `npm run build` exit 0 — initial **441.00 kB** (< 500 kB); lazy chunks por
    dominio; 1 warning CSS `.md\:section-py`.
  - ✅ `npm test` — **3 archivos / 4 tests** (smoke).
  - ❌ `prettier --check` — **146 archivos** con problemas.
  - ❌ `npm audit` — **41 vulnerabilidades** (3 critical, 22 high, 13 moderate,
    3 low); críticas `piscina`, `proxy-addr`, `tar`.
  - ❌ Sin CI (`.github/`), sin ESLint, sin `coverageThreshold`, sin SSR.
  - 🟡 Arquitectura base correcta; deudas de `R-AR-2`/`R-SH-4` (13 imports
    `shared → domains`), `@defer` ausente, `setInterval` en `product-detail`,
    token en `localStorage`, 5 componentes sin sufijo `.component`, 3 `any`.
- **Estado global:** 🟡 **CUMPLE PARCIAL** (0 gates ✅ efectivos en CI; 2 verdes en
  local; 5 ❌).
- **Snapshot:** [`AUDIT.md`](./AUDIT.md).

---

## Auditoría 2 — Cierre de las etapas de mejora (2026-10-06)

- **Alcance:** ejecución de las etapas 1–11 (dependencias, Tailwind 4, formato,
  CI+ESLint, tests, cobertura, sesión, arquitectura/naming, diferido, a11y/PWA/CSP
  y CD), una por PR con checks verdes.
- **Resultado:**
  - ✅ `npm run build` — initial **481.90 kB**; SW `ngsw-worker.js` generado.
  - ✅ `npm test` — **22 archivos / 110 tests**; cobertura 81.09/82.07/81.64/80.09.
  - ✅ `npm run lint` — **0 errores / 0 warnings** (con `templateAccessibility`).
  - ✅ `npm audit --audit-level=high` — **0 vulnerabilidades**.
  - ✅ CI — 5/5 jobs verdes en `main`; CD verificado con `docker build` + smoke
    (`/`, `/shop`, `/ngsw-worker.js` → 200; CSP presente).
  - ✅ `shared → domains` = 0; `setInterval` en dominios = 0; componentes con
    sufijo `.component`; claves `ecom_`; `@defer` en 2 plantillas.
- **Estado global:** 🟢 **CUMPLE** (G-1…G-5 y R-QA-6 efectivos en CI).
- **Deudas:** E2E (`G-6`), contrato (`R-C-*`), componentes con lógica (`R-CP-*`),
  fronteras entre dominios (`R-CX-6`), refresh en 401, operación Dockploy, branch
  protection e higiene de ramas.
- **Snapshot:** [`AUDIT.md`](./AUDIT.md).

---

## Auditoría 3 — Suite E2E (G-6) (2026-10-06)

- **Alcance:** cierre de `G-6` con Playwright.
- **Resultado:**
  - ✅ `npm run e2e` — **8 flujos** (catálogo/filtro, detalle, carrito, guard,
    login+checkout, wishlist, búsqueda, 404) + fixture de cero errores de consola
    (`R-E-9`).
  - ✅ Job **E2E (Playwright)** en CI: **6/6 jobs verdes** en `main` (`4dde21a`).
  - 🐞 Los E2E detectaron un **bug real**: bucle infinito en el `effect` de
    `product-detail` (`addProduct` leía y escribía el mismo signal), corregido
    con `untracked()`.
- **Estado global:** 🟢 **CUMPLE** — **G-1…G-6** + `R-QA-6` efectivos en CI.
- **Deudas:** contrato (`R-C-*`), componentes con lógica (`R-CP-*`), fronteras
  entre dominios (`R-CX-6`), refresh en 401 y operación Dockploy.
- **Snapshot:** [`AUDIT.md`](./AUDIT.md).

---

## Auditoría 4 — Cierre de hallazgos por PRs atómicas (2026-10-07)

- **Alcance:** corrección de los hallazgos de la 3ª auditoría (y los detectados
  en esta revisión) mediante **11 PRs atómicas** con checks en verde y merge
  `--rebase`.
- **Corregido:**
  - `R-SE-3/R-SE-9` — resaltado del buscador sin `innerHTML`.
  - `R-AR-10` — `takeUntilDestroyed` en `checkout`.
  - `R-DO-1/R-COV-3` — README, reglas de `test/`, `ci/` y `CHECKLIST` sincronizados.
  - `R-UX-6` — `SeoService` en todas las páginas.
  - `R-NC-10` — `"strict": true` en TypeScript.
  - `R-PF-4/R-PF-6` — derivados en `computed`; sin `setTimeout` en dominios.
  - `R-C-8` — fixtures de contrato versionados por adapter.
  - `R-QA-1` — cobertura de la lógica crítica ≥ 80 % de líneas y ramas.
  - `R-RB-3/R-REG-1` — los stores sobreviven a un error de API (bug detectado:
    el `rxMethod` moría tras el primer fallo y propagaba un error no controlado).
- **Operativo:** `main` protegida (`R-GB-1`), tag `v1.2.2` (`R-GB-3`) y ramas
  obsoletas cerradas (`R-GB-7`).
- **Resultado:**
  - ✅ `npm run build` — initial **475.65 kB**; SW generado.
  - ✅ `npm test` — **25 archivos / 147 tests**; cobertura **94.35 / 92.17 / 96.83 / 93.57**.
  - ✅ `npm run lint` 0/0; `prettier --check` ✅; `npm audit` 0; E2E 8/8.
  - ✅ CI 6/6 jobs requeridos en verde.
- **Estado global:** 🟢 **CUMPLE**.
- **Deudas:** presentacionales con stores (`R-SO-6`), fronteras entre dominios
  (`R-CX-6`), componentes con lógica (`R-CP-*`), focus trap en modales
  (`R-AC-3`) y warnings `NG02952`/`R-E-9`.
- **Snapshot:** [`AUDIT.md`](./AUDIT.md).

---

## Auditoría 5 — Cierre de las deudas de la 4ª (2026-10-07)

- **Alcance:** corregir las deudas registradas en la 4ª auditoría mediante PRs
  atómicas adicionales, todas con checks en verde y merge `--rebase`.
- **Corregido:**
  - `R-SO-6` — `product-card`/`quick-view-modal` pasan a presentacionales puros
    (input/output, sin stores de dominio); los contenedores aportan los datos.
  - `R-CX-6` — entrypoints públicos por dominio (`public-api.ts`/`public-ui.ts`);
    **0** imports a `components/`, `state/` o `models/` de otro dominio.
  - `R-PF-4/R-PF-6` — derivados en `computed` y temporizadores reactivos.
  - `R-AC-3` — `focus-trap.directive` reutilizable en `quick-view-modal` y
    `cart-sidebar`.
  - `R-PF-2/R-E-9` — `aspect-square` + `priority` estático para LCP + preconnect;
    E2E falla ante **error o warning** de consola; **0** `NG0295x`.
  - `R-AR-3/R-SO-5` — stores y `checkout` dependen solo del puerto (sin fallback
    a la clase concreta).
  - `R-CP-*` — specs de todos los componentes con lógica (dominios y
    `shared/ui`, incluido el banner PWA).
  - `R-NC-2` — retirados los `styles: []` vacíos de los componentes.
  - `R-AR-10` — el banner PWA retira sus listeners de `window` en `ngOnDestroy`.
- **Resultado:**
  - ✅ `npm run build` — initial **477.07 kB**; SW generado.
  - ✅ `npm test` — **50 archivos / 243 tests**; cobertura **94.94 / 91.58 / 97.46 / 94.25**.
  - ✅ `npm run lint` 0/0; `prettier --check` ✅; `npm audit` 0; **E2E 8/8 sin warnings**.
  - ✅ CI 6/6 jobs requeridos en verde.
- **Estado global:** 🟢 **CUMPLE**.
- **Deudas:** ninguna.
- **Snapshot:** [`AUDIT.md`](./AUDIT.md).

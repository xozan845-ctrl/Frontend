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

# AUDIT — Estado actual del frontend vs `rules/`

> **Snapshot** reescrito completo en cada auditoría (`R-COV-3`): describe el
> estado **presente** de `frontend-ecomerce`. El histórico vive en
> [`AUDIT-HISTORY.md`](./AUDIT-HISTORY.md).

- **Última auditoría:** 2026-10-07 — **5ª de frontend-ecomerce** (cierre de las
  deudas de la 4ª auditoría por PRs atómicas).
- **Estado global:** 🟢 **CUMPLE** — los gates **G-1…G-6** y la seguridad
  (`R-QA-6`) son efectivos en CI; `main` protegida; fronteras de dominio
  explícitas, presentacionales sin stores, cobertura de componentes y
  cero warnings en E2E. Quedan solo detalles cosméticos.

## Evidencia ejecutada (2026-10-07)

| Verificación       | Comando                        | Resultado                                                            |
| ------------------ | ------------------------------ | -------------------------------------------------------------------- |
| Build (G-3)        | `npm run build`                | ✅ initial **477.07 kB** (< 500 kB) · SW generado (`ngsw-worker.js`) |
| Tests (G-1)        | `npm test -- --watch=false`    | ✅ **50 archivos / 243 tests**                                       |
| Cobertura (G-2)    | idem                           | ✅ 94.94 / 91.58 / 97.46 / 94.25 (umbral 80/70/80/80)                |
| E2E (G-6)          | `npm run e2e`                  | ✅ **8 flujos Playwright · 0 errores/warnings**                      |
| Formato (G-4)      | `npx prettier --check .`       | ✅                                                                   |
| Lint (G-5)         | `npm run lint`                 | ✅ **0 errores / 0 warnings** (con `templateAccessibility`)          |
| Seguridad (R-QA-6) | `npm audit --audit-level=high` | ✅ **0 vulnerabilidades**                                            |
| CI                 | `gh pr checks`                 | ✅ 6/6 jobs requeridos, en verde                                     |
| `main` protegida   | `gh api .../protection`        | ✅ PR obligatorio + 6 checks, sin force, `enforce_admins: true`      |
| Release            | `git tag`                      | ✅ `v1.2.2` sobre `main`                                             |

## Cumplimiento por área

### Arquitectura y naming (`R-AR`, `R-NC`)

| Regla                      | Estado | Evidencia                                                                            |
| -------------------------- | ------ | ------------------------------------------------------------------------------------ |
| R-AR-1/2/4/5/6/7/8/9/11    | ✅     | Feature-first, `shared→domains` = 0, adapters, signal stores, lazy, forms            |
| R-AR-3 puertos + DI        | ✅     | Stores y `checkout` dependen **solo** del `InjectionToken` (sin fallback a la clase) |
| R-AR-10 ciclo de vida      | ✅     | `takeUntilDestroyed` en `product-list` y `checkout`                                  |
| R-NC-1 sufijo `.component` | ✅     | **0** componentes sin sufijo                                                         |
| R-NC-2 plantillas/estilos  | ✅     | Plantillas y estilos en archivos hermanos; sin `styles: []` en el decorador          |
| R-NC-10 sin `any`          | ✅     | `"strict": true` + adapters con `unknown` + narrowing                                |
| R-NC-11 claves `ecom_`     | ✅     | `ecom_theme`, `ecom_pwa_dismissed`, …                                                |

### Ingeniería frontend (`R-CX`, `R-SO`, `R-SH`, `R-LZ`, `R-ST`, `R-PF`, `R-HI`)

| Regla                       | Estado | Evidencia                                                                                |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| R-CX-1..5/7                 | ✅     | Capas, adapters, casos de uso; lógica testeable                                          |
| R-CX-6 fronteras de feature | ✅     | Entrypoints públicos (`public-api.ts`/`public-ui.ts`); sin imports internos cruzados     |
| R-SO-1/5                    | ✅     | DIP: puertos inyectados sin conocer la implementación                                    |
| R-SO-6 presentacionales     | ✅     | `product-card`/`quick-view-modal` reciben `input`/emiten `output`; sin stores de dominio |
| R-SH-1..6                   | ✅     | `shared/` sin dependencias a dominios; ≥2 consumidores                                   |
| R-LZ-1..6                   | ✅     | Rutas lazy + `@defer` con placeholder; sin preloading                                    |
| R-ST-1..7                   | ✅     | 6 stores con `withState/Computed/Methods/Hooks` + `rxMethod`                             |
| R-PF-1/3/5                  | ✅     | Build bajo budget; rutas lazy; sin preloading                                            |
| R-PF-2 imágenes             | ✅     | `aspect-square`, `priority` estático para LCP y preconnect; **0** `NG0295x`              |
| R-PF-4/6/7                  | ✅     | Derivados en `computed`; sin `setTimeout`/`setInterval` en dominios; **zoneless**        |
| R-HI-\*                     | N/A    | Sin SSR (diferido, ADR-09)                                                               |

### UI (`R-AC`, `R-UX`)

| Regla            | Estado | Evidencia                                                                                 |
| ---------------- | ------ | ----------------------------------------------------------------------------------------- |
| R-AC-1/2/4/5/6/7 | ✅     | `templateAccessibility` 0 errores; `alt`; `prefers-reduced-motion`; `aria-live` en toasts |
| R-AC-3 modales   | ✅     | `focus-trap.directive` (foco atrapado y devuelto) + `role="dialog"`/`aria-modal`          |
| R-UX-1/2/3/4/5   | ✅     | Estados de carga/error/vacío, responsive, dark mode, tokens, textos en español            |
| R-UX-6 SEO/PWA   | ✅     | `SeoService` en todas las páginas + manifest + SW + `theme-color`                         |

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
| R-U-1..14 unit    | ✅     | Adapters, stores, servicios, guard, interceptor, directiva                                            |
| R-QA-1 crítica    | ✅     | `auth.store` 96/81 · `product.store` 98/85 · `cart.store` 96/92 · servicios ≥ 96                      |
| R-CP-1..8 comps   | ✅     | Specs de todos los componentes con lógica (dominios + `shared/ui`); PWA fuera de alcance por decisión |
| R-C-1..8 contrato | ✅     | Fixtures versionados por adapter (`adapters/fixtures/*.fixture.ts`) + tests de contrato               |
| R-E-1..14 E2E     | ✅     | 8 flujos; el fixture falla ante **error y warning** de consola (`R-E-9`)                              |
| R-FL-3 TZ         | ✅     | `src/test-setup.ts` fija `TZ`                                                                         |
| R-RB-3 robustez   | ✅     | Los stores no propagan el error (regresión cubierta); `localStorage` tolerante                        |
| R-QA-2/5          | ✅     | Tests sin red e independientes                                                                        |

### Git / CI / CD

| Regla                   | Estado | Evidencia                                                         |
| ----------------------- | ------ | ----------------------------------------------------------------- |
| R-GB-1 `main` protegida | ✅     | PR obligatorio + 6 checks + sin force + `enforce_admins`          |
| R-GB-2/3/4 tags         | ✅     | Trunk-based, historial lineal, tag `v1.2.2`                       |
| R-GB-7 higiene de ramas | ✅     | Solo `main` en `origin`                                           |
| R-GA/GC/GP              | ✅     | Stage explícito, Conventional Commits en español, `--rebase`      |
| R-PR-1/2/4/6/7/8        | ✅     | PRs atómicas con evidencia, checks en la cabeza, merge `--rebase` |
| R-CI-1..6 / R-EN-1..4   | ✅     | `ci.yml` (6 jobs), concurrencia, cache, artifacts                 |
| R-CD-1/2/9              | ✅     | `Dockerfile` + `nginx.conf`, sin secretos, smoke verificado       |

### Documentación / IA

| Regla      | Estado | Evidencia                                                 |
| ---------- | ------ | --------------------------------------------------------- |
| R-DO-1/2/6 | ✅     | README, reglas, API pública entre dominios y ADRs al día  |
| R-IA-1..6  | ✅     | Trabajo por PRs atómicas con evidencia y regression-first |

## Gates de CI

| Gate                                                                        | Estado             |
| --------------------------------------------------------------------------- | ------------------ |
| G-1 Unit + componentes · G-2 Cobertura · G-3 Build · G-4 Formato · G-5 Lint | ✅ efectivos en CI |
| G-6 E2E                                                                     | ✅ efectivo en CI  |
| R-QA-6 Security gate                                                        | ✅                 |

**Total: 6 ✅ + R-QA-6 ✅ · 0 ❌.**

## Deudas abiertas

1. **`pwa-install-banner`**: sin spec de componente (fuera del alcance por
   decisión). No hay otras deudas funcionales.

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

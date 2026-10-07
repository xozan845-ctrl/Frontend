# AUDIT — Estado actual del frontend vs `rules/`

> **Snapshot** reescrito completo en cada auditoría (`R-COV-3`): describe el
> estado **presente** de `frontend-ecomerce`. El histórico vive en
> [`AUDIT-HISTORY.md`](./AUDIT-HISTORY.md).

- **Última auditoría:** 2026-10-07 — **4ª de frontend-ecomerce** (cierre por PRs
  atómicas de los hallazgos de la 3ª auditoría).
- **Estado global:** 🟢 **CUMPLE** — los gates **G-1…G-6** y la seguridad
  (`R-QA-6`) son efectivos en CI; `main` está **protegida** (PR + 6 checks);
  arquitectura, naming, sesión, rendimiento, UI/a11y, PWA, E2E y CD alineados.
  Quedan deudas acotadas (presentacionales con stores, fronteras entre dominios,
  componentes con lógica y foco en modales).

## Evidencia ejecutada (2026-10-07)

| Verificación       | Comando                        | Resultado                                                            |
| ------------------ | ------------------------------ | -------------------------------------------------------------------- |
| Build (G-3)        | `npm run build`                | ✅ initial **475.65 kB** (< 500 kB) · SW generado (`ngsw-worker.js`) |
| Tests (G-1)        | `npm test -- --watch=false`    | ✅ **25 archivos / 147 tests**                                       |
| Cobertura (G-2)    | idem                           | ✅ 94.35 / 92.17 / 96.83 / 93.57 (umbral 80/70/80/80)                |
| E2E (G-6)          | `npm run e2e`                  | ✅ **8 flujos Playwright**                                           |
| Formato (G-4)      | `npx prettier --check .`       | ✅                                                                   |
| Lint (G-5)         | `npm run lint`                 | ✅ **0 errores / 0 warnings** (con `templateAccessibility`)          |
| Seguridad (R-QA-6) | `npm audit --audit-level=high` | ✅ **0 vulnerabilidades**                                            |
| CI                 | `gh pr checks`                 | ✅ 6/6 jobs requeridos, en verde                                     |
| `main` protegida   | `gh api .../protection`        | ✅ PR obligatorio + 6 checks, sin force, `enforce_admins: true`      |
| Docker/CD          | `Dockerfile` + `nginx.conf`    | ✅ artefacto + CSP (verificado en auditorías previas)                |
| Release            | `git tag`                      | ✅ `v1.2.2` sobre `main`                                             |

## Cumplimiento por área

### Arquitectura y naming (`R-AR`, `R-NC`)

| Regla                            | Estado | Evidencia                                                                  |
| -------------------------------- | ------ | -------------------------------------------------------------------------- |
| R-AR-1/3/4/5/6/7/8/9/11          | ✅     | Feature-first, puertos + DI, adapters, signal stores, lazy, reactive forms |
| R-AR-2 dirección de dependencias | ✅     | **0** imports `shared → domains`                                           |
| R-AR-10 ciclo de vida            | ✅     | `takeUntilDestroyed` en `product-list` y `checkout`                        |
| R-NC-1 sufijo `.component`       | ✅     | **0** componentes sin sufijo                                               |
| R-NC-10 sin `any`                | ✅     | `"strict": true` + adapters con `unknown` + narrowing                      |
| R-NC-11 claves `ecom_`           | ✅     | `ecom_theme`, `ecom_pwa_dismissed`, …                                      |

### Ingeniería frontend (`R-CX`, `R-SO`, `R-SH`, `R-LZ`, `R-ST`, `R-PF`, `R-HI`)

| Regla                       | Estado | Evidencia                                                                                                          |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| R-CX-1..5/7                 | ✅     | Capas, adapters, casos de uso; lógica testeable                                                                    |
| R-CX-6 fronteras de feature | 🟡     | Imports cruzados entre dominios (`home/wishlist → products`, `layout → …`), incluido algún componente interno      |
| R-SO-1/5                    | ✅     | Componentes que inyectan stores fuera de `shared/`                                                                 |
| R-SO-6 presentacionales     | 🟡     | `product-card`/`quick-view-modal` reciben `input`/emiten `output` pero aún inyectan `WishlistStore`/`ReviewsStore` |
| R-SH-1..6                   | ✅     | `shared/` sin dependencias a dominios; ≥2 consumidores                                                             |
| R-LZ-1..5                   | ✅     | Rutas lazy + `@defer` con placeholder (product-detail, home)                                                       |
| R-ST-1..7                   | ✅     | 6 stores con `withState/Computed/Methods/Hooks` + `rxMethod`                                                       |
| R-PF-1/3/5                  | ✅     | Build bajo budget; rutas lazy; sin preloading                                                                      |
| R-PF-2 imágenes             | 🟡     | E2E registra warnings `NG02952` (contenedor `fill` de altura 0 en algún caso)                                      |
| R-PF-4/6/7                  | ✅     | Derivados en `computed`; sin `setTimeout`/`setInterval` en dominios; **zoneless**                                  |
| R-HI-\*                     | N/A    | Sin SSR (diferido, ADR-09)                                                                                         |

### UI (`R-AC`, `R-UX`)

| Regla            | Estado | Evidencia                                                                                         |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------- |
| R-AC-1/2/4/5/6/7 | ✅     | `templateAccessibility` con **0** errores; `alt`; `prefers-reduced-motion`; `aria-live` en toasts |
| R-AC-3 modales   | 🟡     | `role="dialog"`/`aria-modal`/Escape presentes; falta **focus trap**/retorno de foco               |
| R-UX-1/2/3/4/5   | ✅     | Estados de carga/error/vacío, responsive, dark mode, tokens, textos en español                    |
| R-UX-6 SEO/PWA   | ✅     | `SeoService` en **todas** las páginas + manifest + SW + `theme-color`                             |

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

| Regla              | Estado | Evidencia                                                                                                      |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| R-U-1..14 unit     | ✅     | Adapters, stores, servicios, guard, interceptor, directiva (147 tests)                                         |
| R-QA-1 crítica     | ✅     | `auth.store` 96/81 · `product.store` 98/85 · `cart.store` 96/92 · `product.service` 97/97 · `auth.service` 100 |
| R-RB-3 robustez    | ✅     | Los stores no propagan el error (regresión cubierta); `localStorage` tolerante                                 |
| R-CP-* componentes | 🟡     | Smoke de `app`/`navbar`/`footer`; falta cubrir componentes con lógica                                          |
| R-C-1..8 contrato  | ✅     | Fixtures versionados por adapter (`adapters/fixtures/*.fixture.ts`) + tests de contrato                        |
| R-E-* E2E          | ✅     | 8 flujos en `e2e/storefront.spec.ts`; job de CI (`G-6`)                                                        |
| R-E-9 warnings     | 🟡     | El fixture falla con `console.error` pero **no** con `warning` de Angular                                      |
| R-FL-3 TZ          | ✅     | `src/test-setup.ts` fija `TZ`                                                                                  |
| R-QA-2/5           | ✅     | Tests sin red e independientes                                                                                 |

### Git / CI / CD

| Regla                   | Estado | Evidencia                                                                               |
| ----------------------- | ------ | --------------------------------------------------------------------------------------- |
| R-GB-1 `main` protegida | ✅     | PR obligatorio + 6 checks + sin force + `enforce_admins`                                |
| R-GB-2/3/4 tags         | ✅     | Trunk-based, historial lineal, tag `v1.2.2`                                             |
| R-GB-7 higiene de ramas | ✅     | Solo `main` en `origin` (ramas obsoletas cerradas)                                      |
| R-GA/GC/GP              | ✅     | PRs con stage explícito, Conventional Commits en español, `--rebase`                    |
| R-PR-1/2/4/6/7/8        | ✅     | PRs atómicas, tabla de evidencia, checks en la cabeza, merge `--rebase`, rama eliminada |
| R-CI-1..6 / R-EN-1..4   | ✅     | `ci.yml` (6 jobs), concurrencia, cache, artifacts                                       |
| R-CD-1/2/9              | ✅     | `Dockerfile` + `nginx.conf`, sin secretos, smoke verificado                             |

### Documentación / IA

| Regla      | Estado | Evidencia                                                  |
| ---------- | ------ | ---------------------------------------------------------- |
| R-DO-1/2/6 | ✅     | README, reglas y ADRs sincronizados; derivados en `_meta/` |
| R-IA-1..6  | ✅     | Trabajo por PRs atómicas con evidencia y regression-first  |

## Gates de CI

| Gate                                                                        | Estado             |
| --------------------------------------------------------------------------- | ------------------ |
| G-1 Unit + componentes · G-2 Cobertura · G-3 Build · G-4 Formato · G-5 Lint | ✅ efectivos en CI |
| G-6 E2E                                                                     | ✅ efectivo en CI  |
| R-QA-6 Security gate                                                        | ✅                 |

**Total: 6 ✅ + R-QA-6 ✅ · 0 ❌.**

## Deudas abiertas (orden de ataque)

1. **Presentacionales con stores (`R-SO-6`)**: `product-card`/`quick-view-modal`
   inyectan `WishlistStore`/`ReviewsStore`; deben recibir los datos por `input` y
   emitir por `output`.
2. **Fronteras entre dominios (`R-CX-6`)**: reducir imports cruzados
   (`home/wishlist → products`, `layout → …`), evitando componentes internos.
3. **Componentes con lógica (`R-CP-*`)**: `checkout`, `product-detail`,
   `search-autocomplete`, `cart-sidebar`, formularios, `product-card`.
4. **UI/A11y (`R-AC-3`, `R-PF-2`, `R-E-9`)**: focus trap en modales; investigar y
   eliminar los warnings `NG02952` de `NgOptimizedImage fill` y hacer que el
   fixture E2E falle también ante `warning`.
5. **Menores**: `R-AR-3`/`R-SO-5` (fallback a la clase concreta en stores),
   `R-NC-2` (`styles: []` vacíos en 4 componentes).

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

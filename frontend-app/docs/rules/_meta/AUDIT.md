# AUDIT — Estado actual del frontend vs `rules/`

> **Snapshot** reescrito completo en cada auditoría (`R-COV-3`): describe el
> estado **presente** de `frontend-ecomerce`. El histórico vive en
> [`AUDIT-HISTORY.md`](./AUDIT-HISTORY.md).

- **Última auditoría:** 2026-10-06 — **2ª de frontend-ecomerce**.
- **Estado global:** 🟢 **CUMPLE** — los gates **G-1…G-5** y la seguridad
  (`R-QA-6`) son **efectivos en CI**; arquitectura, naming, sesión, rendimiento,
  UI/a11y, PWA y CD alineados. Quedan deudas acotadas (E2E `G-6`, contrato,
  comunicación entre dominios y pasos operativos de despliegue).

## Evidencia ejecutada (2026-10-06)

| Verificación       | Comando                        | Resultado                                                            |
| ------------------ | ------------------------------ | -------------------------------------------------------------------- |
| Build (G-3)        | `npm run build`                | ✅ initial **481.90 kB** (< 500 kB) · SW generado (`ngsw-worker.js`) |
| Tests (G-1)        | `npm test -- --watch=false`    | ✅ **22 archivos / 110 tests**                                       |
| Cobertura (G-2)    | idem                           | ✅ 81.09 / 82.07 / 81.64 / 80.09 (umbral 80/70/80/80)                |
| Formato (G-4)      | `npx prettier --check .`       | ✅                                                                   |
| Lint (G-5)         | `npm run lint`                 | ✅ **0 errores / 0 warnings** (con `templateAccessibility`)          |
| Seguridad (R-QA-6) | `npm audit --audit-level=high` | ✅ **0 vulnerabilidades**                                            |
| CI                 | `gh run list --branch main`    | ✅ 5/5 jobs en verde                                                 |
| Docker/CD          | `docker build` + smoke         | ✅ `/`, `/shop`, `/ngsw-worker.js` → 200; CSP presente               |

## Cumplimiento por área

### Arquitectura y naming (`R-AR`, `R-NC`)

| Regla                            | Estado | Evidencia                                                                  |
| -------------------------------- | ------ | -------------------------------------------------------------------------- |
| R-AR-1/3/4/5/6/7/8/9/11          | ✅     | Feature-first, puertos + DI, adapters, signal stores, lazy, reactive forms |
| R-AR-2 dirección de dependencias | ✅     | **0** imports `shared → domains`                                           |
| R-AR-10 ciclo de vida            | ✅     | `takeUntilDestroyed` en `product-list`                                     |
| R-NC-1 sufijo `.component`       | ✅     | **0** componentes sin sufijo                                               |
| R-NC-10 sin `any`                | ✅     | adapters con `unknown` + narrowing                                         |
| R-NC-11 claves `ecom_`           | ✅     | `ecom_theme`, `ecom_pwa_dismissed`, …                                      |

### Ingeniería frontend (`R-CX`, `R-SO`, `R-SH`, `R-LZ`, `R-ST`, `R-PF`, `R-HI`)

| Regla                       | Estado | Evidencia                                                                                |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| R-CX-1..5/7                 | ✅     | Capas, adapters, casos de uso; lógica testeable                                          |
| R-CX-6 fronteras de feature | 🟡     | Imports cruzados entre dominios (`home → products`, `wishlist → products`, `layout → …`) |
| R-SO-1/5/6                  | ✅     | Componentes que inyectan stores fuera de `shared/`                                       |
| R-SH-1..6                   | ✅     | `shared/` sin dependencias a dominios; ≥2 consumidores                                   |
| R-LZ-1/2/3                  | ✅     | Rutas lazy + `@defer` con placeholder (product-detail, home)                             |
| R-LZ-4/5                    | ✅     | Sin prefetch indiscriminado ni preloading                                                |
| R-ST-1..7                   | ✅     | 6 stores con `withState/Computed/Methods/Hooks` + `rxMethod`                             |
| R-PF-1..7                   | ✅     | Build bajo budget; `NgOptimizedImage`; **sin** `setInterval`; **zoneless**               |
| R-HI-*                      | N/A    | Sin SSR (diferido, ADR-09)                                                               |

### UI (`R-AC`, `R-UX`)

| Regla          | Estado | Evidencia                                                                                  |
| -------------- | ------ | ------------------------------------------------------------------------------------------ |
| R-AC-1..7      | ✅     | `templateAccessibility` con **0** errores; `prefers-reduced-motion`; `aria-live` en toasts |
| R-UX-1/2/3/4/5 | ✅     | Estados de carga/error/vacío, responsive, dark mode, tokens, textos en español             |
| R-UX-6 SEO/PWA | ✅     | `SeoService` + **manifest** + **service worker** + `theme-color`                           |

### Seguridad (`R-SE`)

| Regla                  | Estado | Evidencia                                                                         |
| ---------------------- | ------ | --------------------------------------------------------------------------------- |
| R-SE-1 JWT en cabecera | ✅     | Access en memoria; refresh en `sessionStorage`; purga del `localStorage` heredado |
| R-SE-2/4               | ✅     | Sin secretos en el bundle ni datos sensibles en consola                           |
| R-SE-3                 | ✅     | `[innerHTML]` con contenido propio (Angular sanitiza); sin `bypassSecurityTrust`  |
| R-SE-5 / R-QA-6        | ✅     | `npm audit` → 0                                                                   |
| R-SE-6/7/8             | ✅     | Validación, `rel="noopener"`, solo al backend configurado                         |
| R-SE-9 CSP             | ✅     | CSP en `index.html` **y** cabecera en `nginx.conf`                                |

### Testing (`R-U`, `R-CP`, `R-E`, `R-C`, `R-FL`, `R-QA`, `G-*`)

| Regla              | Estado | Evidencia                                                              |
| ------------------ | ------ | ---------------------------------------------------------------------- |
| R-U-* unit         | ✅     | Adapters, stores, servicios, guard, interceptor, directiva (110 tests) |
| R-CP-* componentes | 🟡     | Smoke de `app`/`navbar`/`footer`; falta cubrir componentes con lógica  |
| R-C-* contrato     | 🟡     | Adapters tolerantes probados; **sin** fixtures versionados (`G-5`)     |
| R-E-* E2E          | ❌     | Sin suite Playwright (`G-6`)                                           |
| R-FL-3 TZ          | ✅     | `src/test-setup.ts` fija `TZ`                                          |
| R-COV-1/2/4        | ✅     | Umbral global; lógica con spec; alcance documentado                    |
| R-QA-2/5           | ✅     | Tests sin red e independientes                                         |

### Git / CI / CD

| Regla                      | Estado | Evidencia                                                             |
| -------------------------- | ------ | --------------------------------------------------------------------- |
| R-GB-2/3/4/6               | ✅     | Trunk-based, tags, historial lineal en el trabajo nuevo               |
| R-PR-1/2/4/6/7/8           | ✅     | PRs con checks verdes y merge `--rebase`; runs de `main` verificados  |
| R-CI-1..6 / R-EN-1..4      | ✅     | `ci.yml` (5 jobs), concurrencia, cache, artifact de cobertura         |
| R-CD-1/2/9                 | ✅     | `Dockerfile` + `nginx.conf`, sin secretos, smoke verificado           |
| R-GB-1 branch protection   | 🟡     | `main` sin proteger en GitHub (ajuste operativo)                      |
| R-GB-7 higiene de ramas    | 🟡     | Ramas heredadas `cuba`, `hansmini`, `reestructura` siguen en `origin` |
| R-PR-7 historial de `main` | 🟡     | 2 merge commits históricos (no se reescribe sin ADR)                  |

### Documentación / IA

| Regla      | Estado | Evidencia                                   |
| ---------- | ------ | ------------------------------------------- |
| R-DO-1/2/6 | ✅     | README y ADRs al día; derivados en `_meta/` |
| R-IA-*     | ✅     | Trabajo por PRs atómicas con evidencia      |

## Gates de CI

| Gate                                                                        | Estado             |
| --------------------------------------------------------------------------- | ------------------ |
| G-1 Unit + componentes · G-2 Cobertura · G-3 Build · G-4 Formato · G-5 Lint | ✅ efectivos en CI |
| G-6 E2E                                                                     | ❌ sin suite       |
| R-QA-6 Security gate                                                        | ✅                 |

**Total: 5 ✅ + R-QA-6 ✅ · 1 ❌ (G-6).**

## Deudas abiertas (orden de ataque)

1. **E2E (`G-6`, `R-E-*`)**: suite Playwright de los flujos críticos.
2. **Contrato (`R-C-*`)**: fixtures de respuesta del backend versionados.
3. **Componentes con lógica (`R-CP-*`)**: `checkout`, `product-detail`, `search-autocomplete`, formularios.
4. **Fronteras entre dominios (`R-CX-6`)**: reducir imports cruzados (`home/wishlist → products`, `layout → …`).
5. **Sesión**: renovación automática **en 401** (hoy la renovación ocurre al iniciar/recargar).
6. **Operación**: `apiUrl` de producción + proyecto Dockploy (`docs/dockploy-setup.md`).
7. **Git**: proteger `main`, cerrar ramas obsoletas; los 2 merge commits históricos no se reescriben.

## Cómo re-auditar

```bash
npm ci && npm run build            # G-3 (budgets) + SW
npm test -- --watch=false          # G-1 / G-2
npx prettier --check .             # G-4
npm run lint                       # G-5
npm audit --audit-level=high       # R-QA-6
docker build -t frontend-ecomerce:test . && docker run -p 8081:80 frontend-ecomerce:test   # R-CD smoke
```

Al terminar: **reescribir este snapshot** y **agregar una entrada nueva** al
final de `AUDIT-HISTORY.md` (`R-COV-3`).

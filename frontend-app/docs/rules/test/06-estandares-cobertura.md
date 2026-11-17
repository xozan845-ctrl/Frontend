# 06 — Estándares de Cobertura y Gates de CI

## Matriz de capas obligatorias por tipo de cambio

Todo PR incluye las capas marcadas con ✅ para el tipo de cambio tocado.

| Tipo de cambio              | Unit puro           | Componentes      | Contrato            | E2E              |
| --------------------------- | ------------------- | ---------------- | ------------------- | ---------------- |
| Adapter / utilidad / modelo | ✅                  | —                | ✅ (si toca borde)  | —                |
| Store / servicio HTTP       | ✅                  | —                | ✅ (si consume API) | —                |
| Componente con lógica       | —                   | ✅               | —                   | —                |
| Formulario                  | ✅ (validación)     | ✅ (interacción) | —                   | ✅ (si es flujo) |
| Flujo de usuario nuevo      | ✅ (lo que aplique) | ✅               | —                   | ✅               |
| **Bug en producción**       | ✅ regression       | ✅ si es de UI   | si aplica           | si es visible    |
| Seguridad / sesión          | ✅                  | ✅               | —                   | ✅ (auth)        |

## Umbrales de cobertura

| Métrica   | Mínimo global (objetivo) |
| --------- | ------------------------ |
| Lines     | ≥ 80%                    |
| Branches  | ≥ 70%                    |
| Functions | ≥ 80%                    |

- Se miden sobre **lógica ejecutable** (`R-COV-4`): `adapters/`, `state/`,
  `services/`, `repositories/` (interfaces y tokens), `guards`, `interceptors`,
  `core/models`, `core/services`. La capa **presentacional** (plantillas y
  componentes puramente visuales) se excluye del umbral duro, pero se cubre con
  `R-CP-*`.
- Cobertura medida con `npm test -- --coverage`; los números se registran en
  `AUDIT.md` en cada auditoría (`R-COV-3`).
- **Ratchet (`R-COV-1`)**: el baseline se mide al configurar cobertura, se
  redondea a la baja (1 pt de margen) y **sube +5 puntos por release** hasta el
  objetivo. Nunca baja.

## Gates de CI (bloquean el merge)

La CI vive en `.github/workflows/ci.yml` ([`../ci/README.md`](../ci/README.md)).
La tabla describe la implementación de cada gate; sus resultados medidos,
fecha, SHA y límites viven en [`../_meta/AUDIT.md`](../_meta/AUDIT.md).
La presencia de un job no demuestra una ejecución aprobada ni protección remota.

| Gate | Condición                                                                     | Estado                                    |
| ---- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| G-1  | Suite unit + componentes en verde (`npm test`), 100 %.                        | Job `test`; evidencia en `AUDIT.md`       |
| G-2  | Cobertura ≥ umbral vigente (`R-COV-1`, `R-COV-4`): **94/88/93/95**.           | ✅ `coverageThresholds` en `angular.json` |
| G-3  | `npm run typecheck` + `npm run build` en verde (tipos + budgets de `R-PF-1`). | ✅ job `typecheck` + `build`              |
| G-4  | Formato conforme: `prettier --check .`.                                       | ✅                                        |
| G-5  | Lint en verde y sin warnings (`eslint . --max-warnings=0`).                   | ✅ `eslint.config.mjs`                    |
| G-6  | E2E de flujos críticos en verde antes de release.                             | Job `e2e`; evidencia en `AUDIT.md`        |

> El **security gate** (`npm audit --audit-level=high`) no es un `G-*`: es la
> regla `R-QA-6`.

## Anti-regresión de cobertura

| ID      | Regla                                                                                                                                                                                                                                                                                           |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-COV-1 | Ningún PR puede **bajar** la cobertura global respecto a `main` (comparar reportes, no solo el absoluto). El umbral configurado solo sube.                                                                                                                                                      |
| R-COV-2 | Todo archivo de lógica (alcance de `R-COV-4`) tocado por el PR tiene su `*.spec.ts`. Un archivo nuevo sin spec bloquea el merge. Verificado por la suite `coverage-guards` (services, adapters y stores).                                                                                       |
| R-COV-3 | `AUDIT.md` se actualiza en cada release con: cobertura actual, nº de tests por capa, deudas abiertas. Un gate solo se marca ✅ con evidencia de un **run verde**. Verificado por la suite `audit-freshness` (fecha de auditoría + versión vigente).                                             |
| R-COV-4 | **Alcance del gate**: la cobertura se mide solo sobre lógica ejecutable (adapters, stores, servicios, guards, interceptors, utilidades). Exclusiones (`mocks/`, `*.model.ts` sin lógica, `main.ts`, `environments/`) se declaran en la configuración de coverage y se documentan en `AUDIT.md`. |
| R-COV-5 | **Diff coverage**: las líneas añadidas/modificadas en `src/app` deben estar cubiertas al menos al **80%** (`npm run coverage:diff`, `scripts/commands/check-diff-coverage.mjs`); solo cuentan las líneas instrumentadas. Un cambio sin test bloquea el merge.                                   |

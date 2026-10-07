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

Estado verificado contra el repo: la CI vive en `.github/workflows/ci.yml`
([`../ci/README.md`](../ci/README.md)) y los gates **G-1…G-6 + R-QA-6** están
efectivos. ✅ = existe y bloquea · ⏸ = regla vigente, paso no configurado (deuda)
· N/A = no aplica.

| Gate | Condición                                                   | Estado                                    |
| ---- | ----------------------------------------------------------- | ----------------------------------------- |
| G-1  | Suite unit + componentes en verde (`npm test`), 100 %.      | ✅ `npm test` (22 archivos / 110 tests)   |
| G-2  | Cobertura ≥ umbral vigente (`R-COV-1`, `R-COV-4`).          | ✅ `coverageThresholds` en `angular.json` |
| G-3  | `npm run build` en verde (typecheck + budgets de `R-PF-1`). | ✅                                        |
| G-4  | Formato conforme: `prettier --check .`.                     | ✅                                        |
| G-5  | Lint en verde (`eslint`).                                   | ✅ `eslint.config.mjs`                    |
| G-6  | E2E de flujos críticos en verde antes de release.           | ✅ Playwright, 8 flujos                   |

> El **security gate** (`npm audit --audit-level=high`) no es un `G-*`: es la
> regla `R-QA-6`.

## Anti-regresión de cobertura

| ID      | Regla                                                                                                                                                                                                                                                                                           |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-COV-1 | Ningún PR puede **bajar** la cobertura global respecto a `main` (comparar reportes, no solo el absoluto). El umbral configurado solo sube.                                                                                                                                                      |
| R-COV-2 | Todo archivo de lógica (alcance de `R-COV-4`) tocado por el PR tiene su `*.spec.ts`. Un archivo nuevo sin spec bloquea el merge.                                                                                                                                                                |
| R-COV-3 | `AUDIT.md` se actualiza en cada release con: cobertura actual, nº de tests por capa, deudas abiertas. Un gate solo se marca ✅ con evidencia de un **run verde**.                                                                                                                               |
| R-COV-4 | **Alcance del gate**: la cobertura se mide solo sobre lógica ejecutable (adapters, stores, servicios, guards, interceptors, utilidades). Exclusiones (`mocks/`, `*.model.ts` sin lógica, `main.ts`, `environments/`) se declaran en la configuración de coverage y se documentan en `AUDIT.md`. |

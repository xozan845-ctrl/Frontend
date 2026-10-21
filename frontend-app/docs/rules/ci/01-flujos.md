# 01 — Flujos de CI (gatillos y ejecución)

Aplica a: cuándo y cómo se ejecutan los jobs de integración
(`.github/workflows/ci.yml`).

| ID     | Regla                                                                                                                                                                                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CI-1 | **Gatillos**: la CI completa corre en todo **push a `main`** y en **todo PR, cualquiera que sea su base** (incluidos los PRs apilados), además de `workflow_dispatch` manual. Cambiar este reparto exige enmienda explícita de esta regla.                                                                                                        |
| R-CI-2 | **Concurrencia**: el workflow declara un grupo por ref con `cancel-in-progress: true`; un push nuevo cancela el run anterior de la misma rama. Prohibido apilar runs obsoletos.                                                                                                                                                                   |
| R-CI-3 | **Sin filtros `paths`**: todo push/PR ejecuta la CI completa, aunque el cambio sea solo de docs (decisión deliberada: nada pasa desapercibido). Introducir filtrado = enmienda de esta regla.                                                                                                                                                     |
| R-CI-4 | **Pipeline único**: `.github/workflows/ci.yml` es el único pipeline de integración. Un workflow adicional solo se acepta con un caso de uso que este archivo no cubra, documentado aquí antes de existir.                                                                                                                                         |
| R-CI-5 | Los cambios en `.github/workflows/**` se revisan como código: stage con rutas explícitas (`R-GA-1`), sin secretos (`R-GA-4`), comandos idénticos a los verificables en local, y el commit cita las reglas tocadas (`R-GC-4`).                                                                                                                     |
| R-CI-6 | **Verificación con `gh`**: tras cada push, el resultado se comprueba con `gh run list` y `gh run view <id>`; mientras corre, `gh run watch <id>`; si falla, `gh run view <id> --log-failed`. Un trabajo no se da por terminado hasta ver `completed success` en el run del commit (`R-GP-6`). Run rojo ⇒ fix-forward con commit nuevo (`R-GP-3`). |
| R-CI-7 | **Gates obligatorios en `main`**: la protección de rama exige PR con **al menos una aprobación** y los checks `Security Gate`, `Format (Prettier)`, `ESLint`, `Typecheck`, `Governance Rules`, `Unit Tests + Coverage`, `Build` y `E2E (Playwright)` en verde sobre la cabeza. Squash y merge commit deshabilitados; solo `--rebase` (`R-PR-7`).  |

## Jobs esperados (contrato)

| Job         | Comando                                          | Gate         |
| ----------- | ------------------------------------------------ | ------------ |
| `build`     | `npm ci` → `npm run build`                       | `G-3`        |
| `test`      | `npm ci` → `npm test -- --watch=false`           | `G-1`, `G-2` |
| `format`    | `npm ci` → `npm run format:check`                | `G-4`        |
| `lint`      | `npm ci` → `npm run lint` (`--max-warnings=0`)   | `G-5`        |
| `typecheck` | `npm ci` → `npm run typecheck`                   | `G-3`        |
| `rules`     | `npm ci` → `npm run rules:check` + `test:engine` | `R-DO-9`     |
| `security`  | `npm ci` → `npm audit --audit-level=high`        | `R-QA-6`     |

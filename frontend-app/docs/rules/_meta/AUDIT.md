# AUDIT — Estado actual del frontend vs `rules/`

> Snapshot de evidencia ejecutada (`R-COV-3`). El histórico es
> [`AUDIT-HISTORY.md`](./AUDIT-HISTORY.md); las reglas normativas siguen en las áreas.

- **Última auditoría:** 2026-11-17.
- **Versión de trabajo:** `1.27.0`.
- **Código auditado:** `31e3b3ffda199db140ce8b67e9c322a26c28f6f4`, rama
  `fix/pwa-unificar-version-aplicacion` ([PR #434](https://github.com/xozan845-ctrl/Frontend/pull/434)).
- **Base de comparación:** `be17d3e434a53c2bc048a1db2831e364f27e9e0d` (`main` al iniciar).
- **Entorno:** Windows, Node `24.16.0`, npm `11.13.0`. CI declara Node 22;
  los resultados locales no equivalen a un run de CI en Linux.
- **Estado global:** **NO APTO PARA MERGE/RELEASE**: security gate en rojo,
  formato global pendiente y regresión visual sin baselines de Windows.

## Evidencia ejecutada

| Ámbito                    | Comando                                                  | Resultado local                                                                                                 |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Instalación               | `npm ci --prefer-offline`                                | Instalación del lockfile completada; el aviso inicial no sustituye el informe explícito de auditoría            |
| Tipos                     | `npm run typecheck`                                      | Correcto en app y specs                                                                                         |
| Unit + componentes        | `npm test -- --watch=false`                              | **360 archivos / 1.944 tests**, todos aprobados; cobertura activada                                             |
| Build                     | `npm run build`                                          | Correcto; initial **545,93 kB**, producción y HTML de invitación generados                                      |
| Budget                    | `node scripts/commands/check-budget.mjs`                 | Correcto sobre la salida capturada del build anterior en `build.log`                                            |
| Lint                      | `npm run lint`                                           | Correcto, sin warnings de ESLint                                                                                |
| CSS                       | `npm run lint:css`                                       | Correcto                                                                                                        |
| Motor + comandos          | `npm run test:engine`                                    | **62 tests**, todos aprobados                                                                                   |
| Reglas                    | `npm run rules:check`                                    | **46 checks / 24 suites** aprobados; **53/259 IDs** verificados                                                 |
| Glass                     | `node scripts/cli.mjs rules --only ui`                   | **35 raíces**, backlog **0**, **15/15 requisitos** Glass cubiertos                                              |
| E2E completo              | `npm run e2e`                                            | **61 aprobados / 6 fallidos**, total 67; los seis fallos son snapshots `chromium-win32` ausentes                |
| Formato global de la base | `npm run format:check`                                   | Falló en **1.426 archivos** antes de las correcciones; no se reformateó el repositorio completo                 |
| Formato del cambio        | Prettier sobre archivos modificados + `git diff --check` | Correcto                                                                                                        |
| Seguridad de la base      | `npm audit --audit-level=high --json`                    | Falló: **25 dependencias high / 0 critical** en el informe explícito; no se cambiaron versiones de dependencias |

El build emitió avisos existentes: imports de plantilla sin uso (`DatePipe` y
`FocusTrapDirective`) y dependencia CommonJS de Leaflet. No se presentan como
errores de compilación ni se eliminan dentro de estos PRs.

## Cobertura y comparación con `main`

Orden: statements / branches / functions / lines. Los umbrales de
`angular.json` siguen en **94/88/93/95**, sin cambios.

| Medición                                     | Statements | Branches | Functions | Lines  |
| -------------------------------------------- | ---------- | -------- | --------- | ------ |
| Base `be17d3e`, ejecutada en esta sesión     | 94.51%     | 88.05%   | 94.33%    | 96.11% |
| Código `31e3b3f`, con regresiones de versión | 94.51%     | 88.09%   | 94.33%    | 96.11% |

`main` ejecutó 1.940 tests; el cambio de versión añade cuatro casos TestBed,
además de tres tests del generador en `test:engine`. La cobertura no baja frente
a la base medida. El alcance instrumentado y las exclusiones son los de
`coverageInclude`/`coverageExclude` en `angular.json`; esta medición no afirma
cobertura global de plantillas ni de todos los archivos `shared/`.

La evaluación directa de `parseUnifiedDiff` + `parseLcov` + `computeDiffCoverage`
(`scripts/commands/check-diff-coverage.mjs`) contra `origin/main...HEAD` devolvió
**0 líneas instrumentadas cambiadas** en `src/app`: el cambio allí es de specs.
No se presenta el resultado como porcentaje de cobertura del generador; este
tiene sus propias pruebas Node. El comando npm no imprimió un resumen en este
entorno Windows, por lo que se verificó su API exportada explícitamente.

Archivos spec por tipo (inventario Git, no cantidad de casos): componentes 167,
servicios 43, stores 54, adapters 41, contratos 22, guards 11, pipes 5,
interceptores 2, directivas 2 y otras unidades 13. Total: 360 archivos.

## CI y operación remota

- El run de `ci.yml` [44143719700](https://github.com/xozan845-ctrl/Frontend/actions/runs/44143719700)
  del PR #431 tiene **Security Gate fallido**; sus dependientes se omitieron.
  CodeQL y Dependency Review aparecieron aprobados en la consulta del PR.
  Esta evidencia corresponde a ese run, no certifica las cabezas de otros PRs.
- La consulta de protección de `main` devolvió HTTP **404** con la identidad
  disponible: **protección y aprobaciones requeridas no verificadas**. No se
  infiere ausencia ni cumplimiento a partir de ese error.
- Los PRs #431–#434 permanecen en borrador. Este snapshot describe una rama de
  trabajo, no afirma que sus cambios estén integrados en `main` o desplegados.
- Lighthouse, smoke live, deploy, rollback y validación de tags no se
  reejecutaron en esta auditoría; no se heredan sus verdes históricos.

## Deudas y límites abiertos

| Regla/ámbito        | Evidencia y trabajo pendiente                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R-SE-5` / `R-QA-6` | Resolver las dependencias high con un PR específico de dependencias y volver a ejecutar auditoría y CI; el informe incluye `picomatch` y su propagación transitiva                                         |
| `G-4`               | Revisar diferencias de formato global de la base; los archivos de estos PRs se formatearon por ámbito                                                                                                      |
| `G-6` / `R-UX-7`    | Revalidar snapshots en Linux, plataforma de los baselines versionados. En Windows se generaron 18 capturas, conservadas fuera del stage en `tmp/windows-snapshots/`; no se aceptaron como nuevos baselines |
| `R-QA-1`            | Aunque el umbral global pasa, `domains/session/state/auth/auth.store.ts` tiene 72.09% de ramas, por debajo del mínimo crítico del 80%; requiere pruebas adicionales en otro PR                             |
| `R-CI-7` / `R-PR-6` | Verificar protección remota y checks de cada cabeza con acceso suficiente; no dar por cumplido desde documentación                                                                                         |
| Frontera backend    | Persistencia real, RLS y pendientes de integración se revalidan contra el contrato/entorno backend; los mocks E2E no certifican producción                                                                 |

## Cómo reauditar

Preparar un checkout limpio con `npm ci`, ejecutar tipos, lint, CSS, reglas,
motor, tests con cobertura, build y E2E en la plataforma correspondiente.
Comparar cobertura con `main`, capturar el log real para `check-budget`,
consultar auditoría npm y CI del SHA exacto. Reescribir este snapshot y
agregar una entrada al histórico con resultados y límites realmente medidos.

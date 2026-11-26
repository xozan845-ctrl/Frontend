# AUDIT — Estado actual del frontend vs `rules/`

> Snapshot reescrito en cada auditoría (`R-COV-3`). Aquí se separan tres cosas
> que antes estaban mezcladas: el histórico cronológico, los controles de
> ingeniería ejecutados y la aceptación funcional de los módulos.

- **Última auditoría:** 2026-11-26 — F36: reconciliación documental, inventario
  de arquitectura agnóstica y matriz de aceptación.
- **Versión de trabajo:** `1.27.0`. **Tag publicado:** `v1.26.0` sobre `main`.
- **Estado global:** 🟡 **PARCIAL** — los controles de ingeniería están en verde,
  pero quedan 15 módulos sin aceptación funcional y la re-prueba de backend no
  está ejecutada. No se declara 100 % de agnosticismo ni de aceptación.

## 1. Resultados históricos

El detalle cronológico de las auditorías 0 a 26 vive en
[`AUDIT-HISTORY.md`](./AUDIT-HISTORY.md) y no se reescribe. Este archivo solo
conserva el estado vigente; las cifras antiguas (contadores de archivos/tests,
ADRs citados por número, tamaños del bundle y estados de CI) son históricas y no
se usan como evidencia actual.

## 2. Controles de ingeniería ejecutados (2026-11-26)

| Verificación                          | Comando                                                    | Resultado                                                                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Motor de reglas (`R-DO-9`)            | `node scripts/cli.mjs rules`                               | ✅ 46 tests / 24 suites / 0 fallos; 53/259 IDs con check real; sin hallazgos de frontera                                                                          |
| Unit + componentes (`G-1`)            | `npm test -- --watch=false`                                | ✅ **360 archivos / 1.940 tests**                                                                                                                                 |
| Cobertura (`G-2`, `R-COV-1`)          | mismo comando                                              | ✅ 94,49 / 88,04 / 94,33 / 96,09 % (umbral 94/88/93/95)                                                                                                           |
| Typecheck (`G-3`)                     | `npm run typecheck`                                        | ✅ app y specs                                                                                                                                                    |
| Lint (`G-5`)                          | `npm run lint`                                             | ✅ 0 errores / 0 warnings                                                                                                                                         |
| Formato (`G-4`)                       | `npx prettier --check docs/mvp/*.md`                       | ✅ 0 archivos; 2 tablas realineadas. El check estándar pasa en CI y en la rama `build/config-forzar-lf` (PR #464), que corrige el CRLF local con `.gitattributes` |
| Build y presupuesto (`G-3`, `R-PF-1`) | `npm run build` + `node scripts/commands/check-budget.mjs` | ✅ initial **545,98 kB** dentro del aviso de 555 kB y del error de 560 kB; 3 warnings no bloqueantes (2 `NG8113`, 1 CommonJS de `leaflet`)                        |
| Seguridad (`R-QA-6`)                  | `npm audit --audit-level=high`                             | ✅ 0 vulnerabilidades                                                                                                                                             |
| E2E (`G-6`, `R-E-25`)                 | `npm run e2e`                                              | ⚠️ **61/67**: 6 snapshots visuales `R-UX-7` fallan por baselines `*-chromium-win32.png` no versionados                                                            |
| Flujos funcionales E2E                | `npx playwright test --grep-invert "R-UX-7"`               | ✅ **61/61** sin los snapshots de plataforma                                                                                                                      |
| Smoke de hosting (`R-CD-9`)           | `node scripts/commands/hosting-smoke.mjs`                  | ✅ ejecutado con exit 0 (sin salida)                                                                                                                              |
| Config de hosting                     | `firebase.json` / `.firebaserc`                            | ✅ Firebase Hosting es el destino actual; Dockploy queda como referencia futura                                                                                   |

El inventario de 45 unidades estructurales y los 40 puertos con sus pruebas de
sustitución están en
[`../../mvp/arquitectura-agnostica.md`](../../mvp/arquitectura-agnostica.md).

## 3. Aceptación funcional

La tabla única y vigente de los 55 módulos navegables está en
[`../../mvp/aceptacion-frontend.md`](../../mvp/aceptacion-frontend.md). Resumen:

- **40 listos(funcional)** con evidencia E2E o Vitest ejecutada.
- **15 pendientes**: 9 declarados `soon` y 6 declarados `ready` que en el árbol
  de rutas siguen mostrando `shared/ui/coming-soon`. Todos tienen dueño y
  criterio de cierre en la tabla.
- El cierre del QA de productos/servicios contra Core Engine continúa pendiente
  en [`../../qa/productos-servicios-resolucion.md`](../../qa/productos-servicios-resolucion.md).

## 4. Deudas y violaciones abiertas

1. **Estado declarado vs. estado funcional:** `store.roles`, `logistics.map`,
   `logistics.orders`, `logistics.zones`, `logistics.reports` y
   `logistics.settings` están `ready` en `WORKSPACE_MODULES`, pero no tienen una
   pantalla funcional. Mientras no se corrijan, no se declara 100 % de
   agnosticismo ni de aceptación.
2. **Módulos `soon`:** `company.payroll`, `company.quotes`, `company.taxes`,
   `company.analytics`, `company.notifications`, `company.help`,
   `store.inventory`, `store.settings` y `store.help`.
3. **Aceptación de backend:** los E2E consumen `api-mock`; no hay evidencia de
   integración real con Core Engine, migraciones ni RLS.
4. **Snapshots visuales:** faltan 6 baselines `chromium-win32`; los flujos
   funcionales pasan, pero `npm run e2e` completo no está en verde en Windows.
5. **Presupuesto:** el actual queda a 545,98 kB del techo de aviso de 555 kB;
   cualquier crecimiento debe reducirse o justificarse con ADR antes de subir el
   techo (`R-PF-1`).

## 5. Cómo re-auditar

```bash
npm run build && node scripts/commands/check-budget.mjs  # G-3 / R-PF-1
npm test -- --watch=false                                # G-1 / G-2
npm run typecheck                                        # G-3
npx prettier --check .                                   # G-4
npm run lint                                             # G-5
node scripts/cli.mjs rules                               # R-DO-9
npm audit --audit-level=high                             # R-QA-6
npm run e2e                                              # G-6 / R-E-25
node scripts/commands/hosting-smoke.mjs                  # R-CD-9
```

Al terminar: reescribir este snapshot y **agregar una entrada nueva** al final
de `AUDIT-HISTORY.md` (`R-COV-3`). Los contadores y estados de módulos no se
copian a otros documentos: se referencia la tabla de aceptación.

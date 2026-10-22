<!--
  Plantilla de PR (R-PR-2, R-PR-4). Un PR = una unidad revisable.
  Copia el CHECKLIST de docs/rules/_meta/CHECKLIST.md y marca solo lo aplicable.
-->

## Qué cambia

<!-- Qué y por qué, en 1–3 frases. Si es un bug: síntoma + causa. -->

## Tipo de cambio

- [ ] `feat` · [ ] `fix` · [ ] `refactor` · [ ] `perf` · [ ] `docs` · [ ] `test` · [ ] `ci` · [ ] `build` · [ ] `chore`

## Reglas tocadas

<!-- IDs de regla, p. ej. R-AR-15, R-COV-5. Si no toca ninguna, dilo. -->

## Checklist (marcar solo lo aplicable)

- [ ] **R-GC-5** — `npx prettier --check .`, `npm run typecheck`, `npm run build`, `npm test` y `npm run lint` en verde.
- [ ] **R-PR-2** — El PR es una sola unidad temática (si dice “y además”, se parte).
- [ ] **R-PR-4** — Este cuerpo incluye la evidencia ejecutada (tabla de abajo).
- [ ] **R-PR-7** — Merge con `--rebase`; sin squash ni merge commit.
- [ ] **R-DO-8** — Si el cambio toca lógica/CI/motor, actualiza la documentación del área.
- [ ] **R-DO-9** — Si añades o quitas reglas, actualiza `rules`/`cites` y `COVERAGE_MIN_VERIFIED`.
- [ ] Reglas específicas del área (`R-AR`, `R-ST`, `R-SE`, `R-UX`, `R-E`, …).

## Verificación ejecutada

| Comando                                          | Resultado |
| ------------------------------------------------ | --------- |
| `npm run rules:check`                            |           |
| `npm run test:engine`                            |           |
| `npx ng test --watch=false`                      |           |
| `npm run typecheck`                              |           |
| `npm run build`                                  |           |
| `npm run lint`                                   |           |
| `npx prettier --check .`                         |           |
| `npm run coverage:diff`                          |           |
| `npm run e2e` / `npm run lighthouse` (si aplica) |           |

## Notas para el revisor

<!-- Riesgos, deuda aceptada, seguimiento. -->

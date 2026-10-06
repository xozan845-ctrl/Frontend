# 02 — Commit: `git commit -m`

| ID     | Regla                                                                                                                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-GC-1 | Mensaje en Conventional Commits: `<tipo>(<ámbito>): <resumen en imperativo, español>`. Tipos admitidos: `feat, fix, docs, test, refactor, perf, style, ci, build, chore`; ámbitos reales (`catalog`, `cart`, `auth`, `ui`, `rules`, `ci`, …). Ejemplo: `feat(cart): validar cupon de descuento (R-U-9)`. |
| R-GC-2 | El asunto dice QUÉ cambia y POR QUÉ importa, en una línea; prohibidos `wip`, `fix`, `update`, `changes`, `add stuff` y repetir el nombre del archivo.                                                                                                                                                    |
| R-GC-3 | Un commit = una unidad temática resumible en una frase; prohibido mezclar feature + fix + formato + dependencias.                                                                                                                                                                                        |
| R-GC-4 | Si el cambio implementa, corrige o verifica una regla, citar su ID completo al final del asunto o en el cuerpo (`(R-AR-4)`); si viene de una deuda de auditoría, citar el ítem.                                                                                                                          |
| R-GC-5 | Antes de commitear, la verificación del ámbito debe estar en verde (`npx prettier --check .`, `npm run build` y, si aplica, `npm test`); commitear roto está prohibido.                                                                                                                                  |
| R-GC-6 | Cuando el asunto no alcanza, usar el cuerpo del commit: bug (síntoma + causa), refactor (motivo), cambio rompente (cómo migrar). Formato: `git commit -m "asunto" -m "cuerpo"`.                                                                                                                          |
| R-GC-7 | No reescribir commits ya publicados: `--amend`/rebase solo sobre commits locales que **nunca** subieron a `origin`; sobre `origin`, las correcciones van como commit nuevo.                                                                                                                              |

## Verificación

```bash
# asuntos conformes a Conventional Commits (debe imprimir vacío)
git log origin/main..HEAD --pretty=%s \
  | grep -vE '^(feat|fix|docs|test|refactor|perf|style|ci|build|chore)(\([a-z-]+\))?: .+'

# unidad temática: qué toca el commit
git show --stat HEAD
```

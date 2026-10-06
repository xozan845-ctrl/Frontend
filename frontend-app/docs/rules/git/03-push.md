# 03 — Push: `git push`

| ID     | Regla                                                                                                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-GP-1 | Antes de pushear: `git status` limpio (0 cambios sin commitear) y `git log origin/main..HEAD --oneline` leído commit por commit: si no coincide con lo que se quiere subir, no pushear.                                        |
| R-GP-2 | Subir solo con la verificación local en verde (`R-GC-5`) y, cuando exista CI, con los checks del último commit en verde; un push con CI roja se corrige con commit nuevo, nunca con force.                                     |
| R-GP-3 | **Prohibido `git push --force` y `--force-with-lease` sobre `main`** o cualquier rama compartida: el historial publicado no se reescribe (`R-GC-7`).                                                                           |
| R-GP-4 | `origin` solo recibe trabajo terminado y verificado: el WIP vive en el árbol local o en una rama local nunca publicada; prohibido subir "respaldos" (`chore: wip`).                                                            |
| R-GP-5 | Si `origin/main` avanzó respecto a local: `git pull --rebase` antes del push (historial lineal, `R-GB-4`); prohibido el merge de sincronización y prohibido resolverlo con force.                                              |
| R-GP-6 | Tras el push: `git status -sb` debe reportar la rama al día y, cuando exista CI, el run del commit en verde verificado con `gh run list`/`gh run view` (`R-CI-6`); el verde de un run anterior no prueba nada sobre el actual. |
| R-GP-7 | Verificar que el push contiene SOLO los commits propios (`git log origin/main..HEAD`): nunca subir commits ajenos arrastrados por un rebase mal resuelto.                                                                      |

## Verificación

```bash
git status -sb                        # rama al día tras el push
git log origin/main..HEAD --oneline   # vacío tras el push; antes = lo previsto
gh run list --limit 5                 # cuando exista CI (R-CI-6)
```

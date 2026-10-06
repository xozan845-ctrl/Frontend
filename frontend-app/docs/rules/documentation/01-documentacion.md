# 01 — Documentación como código

| ID     | Regla                                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-DO-1 | **El README describe la realidad**: el `README.md` de la app mantiene al día stack, scripts y estructura. Si un PR cambia la estructura de carpetas o los comandos, actualiza el README en el mismo PR. Prohibido documentar rutas o scripts que ya no existen.                                     |
| R-DO-2 | **ADRs para decisiones**: toda decisión que se aparta de lo obvio o cambia una regla se registra en [`../../decisiones.md`](../../decisiones.md) como `ADR-XX` con fecha, estado, contexto y consecuencias. Las reglas no se cambian sin un ADR que lo respalde.                                    |
| R-DO-3 | **Variables y configuración**: cualquier variable de configuración (`environment`, endpoints, flags) queda documentada junto a su valor por defecto y su efecto. Los secretos **no** se documentan con su valor (`R-SE-2`).                                                                         |
| R-DO-4 | **Comentarios con el porqué, no el qué**: los comentarios explican decisiones no evidentes (por qué se tolera un shape, por qué se difiere un cálculo). Prohibido comentar lo que el código ya dice.                                                                                                |
| R-DO-5 | **Docs dentro del repo**: la documentación vive en `docs/` o junto al código; prohibido depender de enlaces externos o documentos en `/tmp` que no se versionan.                                                                                                                                    |
| R-DO-6 | **Documentación y reglas viven juntas**: las reglas normativas en `docs/rules/`; los derivados (audit, checklist) en `docs/rules/_meta/`; el guion operativo (`dockploy-setup.md`) fuera de `rules/` pero en `docs/`. Un cambio de regla actualiza el índice del área y el `CHECKLIST` (`R-COV-3`). |

## Verificación

```bash
git grep -n "src/app/d/" -- README.md docs && echo "ruta obsoleta"   # R-DO-1: no debe aparecer
ls docs/rules/_meta                                # R-DO-6
```

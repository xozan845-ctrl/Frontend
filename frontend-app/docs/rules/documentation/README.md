# documentation/ — Reglas de documentación como código

Reglas sobre cómo se documenta el proyecto: READMEs, decisiones de arquitectura
(ADRs), variables de entorno y comentarios. La documentación es parte del
entregable, no un extra.

## Índice

| Archivo                                        | Sufijo ID | Contenido                            |
| ---------------------------------------------- | --------- | ------------------------------------ |
| [`01-documentacion.md`](./01-documentacion.md) | `R-DO`    | READMEs, ADRs, entorno y comentarios |

> `R-DO-7` exige un `README.md` por directorio importante. La lista canónica
> vive en `REQUIRED_READMES` (`scripts/config/project.mjs`) y la valida la
> suite `docs-readmes` del motor de gobernanza.
>
> `R-DO-8` exige que los PRs que cambian lógica/contratos o CI actualicen la
> documentación necesaria; lo valida la suite `docs-sync` (`origin/main...HEAD`).

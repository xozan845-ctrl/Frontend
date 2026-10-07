# Reglas de CI — frontend-ecomerce

Mecánica de la integración continua: cuándo se ejecuta qué, concurrencia,
entorno del runner y evidencia. **Los gates de calidad (`G-1…G-6`) no viven
aquí**: son reglas de testing y siguen en
[`../test/06-estandares-cobertura.md`](../test/06-estandares-cobertura.md).

> **Estado:** el repo **no tiene `.github/workflows/`**; todo este documento es el
> **contrato a implementar** la primera vez que se añada CI. Hasta entonces, las
> verificaciones equivalentes se ejecutan en local antes de cada PR
> (`R-GC-5`).

## Archivos

| Archivo         | Contenido                                                                                                 | IDs          |
| --------------- | --------------------------------------------------------------------------------------------------------- | ------------ |
| `01-flujos.md`  | Gatillos push/PR, concurrencia, sin `paths`, pipeline único, revisión de workflows, verificación con `gh` | `R-CI` (1–6) |
| `02-entorno.md` | Runner/Node/npm, evidencia (artifacts), secretos                                                          | `R-EN` (1–4) |

> El **despliegue** vive en [`../cd/`](../cd/README.md) (Dockploy). CI integra;
> CD despliega.

## Mapa de IDs

| Prefijo  | Rango | Archivo         | Ámbito                                 |
| -------- | ----- | --------------- | -------------------------------------- |
| `R-CI-*` | 1–6   | `01-flujos.md`  | Flujos, ejecución y verificación de CI |
| `R-EN-*` | 1–4   | `02-entorno.md` | Entorno y evidencia en CI              |

## Reglas de otras áreas que exige CI (cross-refs)

| ID         | Exigencia en CI                                                                 |
| ---------- | ------------------------------------------------------------------------------- |
| `G-1…G-6`  | Gates de testing (estado en [`../test/06`](../test/06-estandares-cobertura.md)) |
| `R-COV-3`  | Un gate ✅ solo con run verde de CI                                             |
| `R-FL-1`   | Tests intermitentes → quarantine con fecha                                      |
| `R-GP-2/6` | Push con checks verdes; rojo ⇒ fix-forward con commit nuevo                     |
| `R-PF-1`   | El job de build no debe superar los budgets                                     |

## GitHub CLI (`gh`) — uso e importancia

`gh` es la **única forma verificable desde terminal** de ver el estado real de la
CI después de crear el workflow:

| Comando                            | Cuándo y qué aporta                                                        |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `gh run list --limit 5`            | ¿El push ya corrió?, ¿verde o rojo?                                        |
| `gh run view <id>`                 | Jobs concretos: qué gate se rompió                                         |
| `gh run watch <id>`                | Seguir en vivo un run en curso                                             |
| `gh run view <id> --log-failed`    | Log del job fallido → punto de partida del fix-forward                     |
| `gh auth status` / `gh auth login` | Estado / autenticación (una vez por máquina)                               |
| `gh release list`                  | ¿Hay ya una release para este tag? Un tag publicado no se mueve (`R-GB-3`) |

La importancia es cerrar la evidencia: un cambio "terminado" es un commit con
`completed success` en **su** run (`R-CI-6`). Todo lo demás es opinión.

## Pendientes

- Estado de cumplimiento y deudas en [`../_meta/AUDIT.md`](../_meta/AUDIT.md)
  (`R-COV-3`). La CI implementada cumple gatillos, concurrencia y artifact de
  cobertura (`R-CI-1..6`, `R-EN-3`).

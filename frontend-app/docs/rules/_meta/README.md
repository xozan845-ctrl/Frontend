# _meta/ — Documentos derivados (NO son reglas)

Carpeta marcada con `_` = **no normativa**. Nada de aquí obliga: todo se deriva
de las reglas de las áreas (`../architecture/`, `../frontend/`, `../ui/`,
`../security/`, `../test/`, `../git/`, `../ci/`, `../cd/`, `../ai/`,
`../documentation/`) y se actualiza cuando éstas cambian.

| Archivo            | Qué es                                                                 | Cuándo se actualiza                                 |
| ------------------ | ---------------------------------------------------------------------- | --------------------------------------------------- |
| `CHECKLIST.md`     | Herramienta de revisión de PR derivada de las reglas (remite a IDs)    | Cuando cambian reglas que afecten revisión          |
| `AUDIT.md`         | **Snapshot** del estado actual de cumplimiento — se reescribe completo | En cada auditoría (antes de cada release, R-COV-3)  |
| `AUDIT-HISTORY.md` | Log **append-only** del histórico de auditorías                        | Nunca se reescribe: solo se agrega la entrada nueva |

> **Procedencia:** estos derivados heredaron el modelo del proyecto backend Core
> Engine. Se reescribieron para el frontend en la auditoría 0 (2026-10-06): el
> histórico anterior (auditorías de otro proyecto) **no** se arrastra.

## Reglas de estructura

1. Los documentos de esta carpeta **jamás** contienen reglas propias: solo
   resumen, estado o historial de las reglas que viven en las áreas.
2. Si un archivo derivado y su regla de origen discrepan, **manda la regla** (y se
   corrige el derivado).
3. Prohibido mover un audit/checklist dentro de un área: el área es 100% reglas.

# 01 — Contribuciones de IA

Asegura que los agentes de IA no diluyan, ignoren ni rompan el diseño por
contratos y reglas del proyecto.

| ID     | Regla                                                                                                                                                                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-IA-1 | **Lectura de contexto obligatoria**: antes de proponer o aplicar cambios, la IA mapea el estado leyendo `docs/rules/README.md`. Si va a tocar código, lee las áreas relevantes (`architecture/`, `ui/`, `security/`, `test/`) y se apoya en `_meta/AUDIT.md` para conocer las deudas abiertas. |
| R-IA-2 | **Uso adecuado de herramientas**: la IA respeta sus instrucciones y usa las herramientas nativas de edición/búsqueda en lugar de `cat`, `sed` o scripts que reescriben archivos a ciegas. Prohibido manipular archivos sin revisar el resultado.                                               |
| R-IA-3 | **Atomicidad y Git estricto**: la IA está sujeta al estándar de [`../git/`](../git/README.md). Cada hallazgo u objetivo es un commit atómico con Conventional Commits en español citando el ID de regla (`fix(cart): corregir total con cupon (R-U-9)`). Nada de "arreglé varias cosas".       |
| R-IA-4 | **Sin pases libres**: todo código emitido por IA se somete a la verificación (`R-GC-5`) y a los gates (`G-*`). Debe aportar tests que asienten el requisito real (R0), no su propia implementación, y no puede bajar la cobertura (`R-COV-1`).                                                 |
| R-IA-5 | **PRs como entregable final**: la IA no commitea directo a `main`; su trabajo vive en una rama semántica (`R-GB-2`) y se entrega por PR con el [`CHECKLIST`](../_meta/CHECKLIST.md) marcado y tablas reales de evidencia (comandos y salidas).                                                 |
| R-IA-6 | **Refactorizaciones consensuadas**: si la IA detecta una mejora estructural ajena al task, la registra como deuda en `_meta/AUDIT.md`; prohibidos los refactors silenciosos u "oportunistas" no solicitados que ensucian el PR.                                                                |

## Verificación

- El historial de la rama de la IA refleja un delta atómico (`git log --oneline`).
- En el PR aparece la tabla de "reglas consultadas".
- `npm run build` y (cuando exista config) `npm test` son exigibles en todos sus
  PRs (`R-GC-5`).

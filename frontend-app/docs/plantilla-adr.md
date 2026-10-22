# Plantilla de ADR (`R-DO-2`)

Copia este bloque al final de [`decisiones.md`](./decisiones.md), renumera
`ADR-XX` con el siguiente número libre y elimina las notas entre paréntesis.

> Una decisión merece ADR cuando **se aparta de lo obvio**, **cambia una regla**
> o **introduce deuda deliberada**. Si no, no hace falta.

---

## ADR-XX: (título corto, en imperativo o sustantivo)

- **Fecha**: YYYY-MM-DD
- **Estado**: Propuesto | Aceptado | Reemplazado por ADR-YY | Obsoleto
- **Contexto**: (qué situación obliga a decidir; restricciones, alternativas
  consideradas y por qué no bastan).
- **Decisión**: (qué se decide, en presente y sin ambigüedad; incluye el alcance
  — qué queda dentro y qué no).
- **Consecuencias**: (qué se gana, qué se pierde, qué deuda se acepta y cuándo
  se reevalúa; si reemplaza a otro ADR, dilo aquí).

---

## Reglas rápidas

- Un ADR aceptado no se edita para cambiar la decisión: se crea uno nuevo que lo
  reemplaza y se actualiza el estado del anterior.
- Si el ADR cambia una regla, actualiza la regla en `docs/rules/` y el
  `CHECKLIST` en el mismo PR (`R-DO-6`).
- Los ADR viven en `docs/decisiones.md`, no en `docs/rules/`.

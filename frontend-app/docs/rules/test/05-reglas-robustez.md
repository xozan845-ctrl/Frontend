# 05 — Reglas de Robustez y Calidad

Reglas transversales que suben la calidad más allá del happy-path.

## Regression-first (la regla que motivó este documento)

| ID      | Regla                                                                                                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-REG-1 | **Todo bug confirmado**: primero se agrega el test que FALLA con el bug (rojo), luego la fix (verde). El PR no se acepta sin ese test, marcado o comentado como `regression: <id-issue>`. |
| R-REG-2 | El test de regresión asienta el **requisito correcto**, no "el cambio que hicimos" (ver R0).                                                                                              |
| R-REG-3 | Tras un bug de una capa, se evalúa si faltaba otra capa (componente/E2E) que lo hubiera detectado antes; si sí, se agrega al menos un test en esa capa.                                   |

## Robustez de entradas

| ID     | Regla                                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-RB-1 | Los adapters y utilidades se prueban con entradas corruptas: `null`, `undefined`, `''`, `'   '`, `'null'`, arrays vacíos, objetos con campos de más y tipos inesperados. |
| R-RB-2 | Los límites se prueban: listas grandes para filtrado/paginación, strings enormes en búsqueda, `page` fuera de rango y precios extremos.                                  |
| R-RB-3 | Fallo de red/timeout: el sistema **degrada con error controlado** (mensaje + estado) y no propaga una excepción cruda a la UI.                                           |
| R-RB-4 | La lectura de `localStorage` con contenido corrupto (JSON inválido) no rompe el arranque: se captura y se usa el estado por defecto.                                     |

## Anti-flakiness

| ID     | Regla                                                                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-FL-1 | **Cero tolerancia a tests intermitentes**: un test que falla 1/20 se arregla o se marca `quarantine` con issue y fecha máxima de reparación.         |
| R-FL-2 | Prohibido `sleep`/`setTimeout` arbitrario para esperar; usar `whenStable`, `vi.useFakeTimers` + `advanceTimersByTime` o esperas activas con timeout. |
| R-FL-3 | Sin dependencia de orden entre tests ni de la máquina: `TZ` fijada en la configuración de Vitest y datos aislados por test.                          |
| R-FL-4 | Sin dependencia de red externa ni de servicios de terceros: los specs usan mocks/`HttpTestingController`; el E2E usa fixtures controlados.           |

## Notas

- Property-based testing (`fast-check`) y mutation testing **no** están hoy en el
  stack; no son gates. Si se incorporan, se hará con reglas propias (IDs nuevos)
  y una decisión en `decisiones.md`, nunca "para subir cobertura" (`R-QA-1`).

# 01 — Reglas de Unit Tests (lógica pura)

Aplica a: `*.spec.ts` de `adapters/`, utilidades (`shared/models`, `shared/utils`),
`state/*.store.ts`, `services/*.service.ts`, `guards`, `interceptors` y modelos
con lógica. Son pruebas **sin red real** y en milisegundos.

## Semántica del requisito

| ID    | Regla                                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-U-1 | **Assert contra el requisito, no contra la implementación.** Si cambia la implementación pero el requisito no, el test no cambia (y viceversa). Prohibido "actualizar el expected para que pase". |
| R-U-2 | Nombre de test `debe <comportamiento> cuando <condición>` (o `should ... when ...`). Nunca `should work` ni `test 1`.                                                                             |
| R-U-3 | Cada test cubre **una** situación; sin concatenar escenarios con "y" en un solo `it`.                                                                                                             |
| R-U-4 | El test debe poder fallar: si se elimina la lógica bajo prueba, el test falla. Prohibidos los asserts triviales (`expect(true).toBe(true)`, `expect(x).toBeTruthy()` como único assert).          |

## Adapters y normalización (el código más crítico)

| ID    | Regla                                                                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-U-5 | Todo adapter `adapt*FromBackend` probado contra **todos** los shapes que declara soportar: `camelCase`, `snake_case`, `{ data }`, `{ items }`, `{ results }`, array plano, `null`/`undefined` y objetos vacíos. |
| R-U-6 | Probar el **fallback** cuando el dato falta (id/name/price/imagen por defecto) y que el resultado cumple el modelo de dominio (`R-AR-4`).                                                                       |
| R-U-7 | Tipos numéricos: probar `number`, string numérico (`"19.99"`), `0`, negativos, `NaN`, `Infinity` y `null`. Para dinero, redondeo a 2 decimales.                                                                 |

## Stores (NgRx Signals)

| ID     | Regla                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-U-8  | Probar las transiciones de `withMethods`: agregar, actualizar, eliminar, limpiar; y que no mutan el estado anterior (inmutabilidad).                     |
| R-U-9  | Probar los derivados de `withComputed`: totales, descuentos, paginación y filtros con casos boundary (carrito vacío, cantidad 0, página fuera de rango). |
| R-U-10 | Aislar la persistencia: `localStorage` se limpia/stubea en `beforeEach`; ningún test depende de una clave previa.                                        |

## Servicios HTTP y guards

| ID     | Regla                                                                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-U-11 | Los `services` que usan `HttpClient` se prueban con `HttpTestingController`: asertar **método, URL y payload** enviados y la adaptación de la respuesta. Prohibido un test que solo verifica que "se llamó". |
| R-U-12 | Probar el camino de error (error HTTP → mensaje controlado) sin lanzar excepción cruda (`R-RB-3`).                                                                                                           |
| R-U-13 | Guards/interceptors: probar cada rama (token/no token, `bearer`/`cookie`, `withCredentials`). En el guard, verificar la redirección a `/login`.                                                              |
| R-U-14 | Todo adapter, utilidad, store o servicio **nuevo** agrega su spec en el mismo PR (`R-COV-2`).                                                                                                                |

## Notas

- Los specs no deben importar símbolos inexistentes ni usar APIs privadas de la
  implementación.
- Fechas: fijar `TZ` en la configuración de Vitest y probar boundary local vs UTC
  (`R-FL-3`); formatear con `Intl`/`toLocaleDateString` es de UI, no del dominio.

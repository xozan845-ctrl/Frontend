# 04 — Reglas de Contrato (frontend ↔ backend)

Aplica al borde entre esta SPA y el API del backend del e-commerce (gateway de
Core Engine, `/api/v1/**`). Los adapters (`R-AR-4`) absorben la forma del
backend; el contrato fija qué se soporta y cómo se prueba.

## Shapes soportados

| ID    | Regla                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-C-1 | Los adapters soportan el **envelope del backend**: respuesta de éxito `{ data: T, meta: {…} }` y listas anidadas en `data`; además de los formatos tolerantes (`items`, `results`, array plano) ya implementados. Un cambio de envelope actualiza el adapter **y** su test en el mismo PR. |
| R-C-2 | Los **errores** del backend (`{ codigo, mensaje, detalles }`) se traducen a un mensaje de dominio antes de llegar a la UI (`R-AR-9`); ningún componente inspecciona el shape de error crudo.                                                                                               |
| R-C-3 | Toda respuesta se normaliza a un **modelo de dominio**; prohibido exponer al componente un DTO de backend o campos sensibles (`password`, datos de tarjeta completos).                                                                                                                     |
| R-C-4 | Las **fechas** del backend son ISO 8601 UTC con `Z`; la conversión a hora local se hace en la UI con `Intl`/`Date`. El test de contrato rechaza formatos no normalizados.                                                                                                                  |

## Versionado y cambios

| ID    | Regla                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-C-5 | Un cambio de shape del backend (renombrar/eliminar campo, cambiar tipo) se aísla en el adapter y se prueba con un fixture nuevo; el resto de la app no se toca. |
| R-C-6 | Si se consume un campo nuevo, el PR incluye: campo en el DTO (`R-NC-9`) + mapeo en el adapter + test de contrato + actualización de quien lo muestra.           |
| R-C-7 | Los cambios incompatibles del backend se negocian por versión del API; el frontend no encadena parches de compatibilidad ad-hoc fuera del adapter.              |

## Automatización y evidencia

| ID    | Regla                                                                                                                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-C-8 | Existe al menos un test de contrato por adapter que valida el shape **contra un fixture de respuesta real versionado en el repo** (`*.fixture.json` o constante), no contra el backend en vivo. Si el fixture se desactualiza, el test lo detecta. |

## Notas

- Deuda actual (`G-5`): no hay fixtures de contrato ni tests de adapter; los
  adapters existen y son tolerantes pero no están cubiertos (`R-U-5/R-U-6`).
- El endpoint base y los paths viven en `environment` + `DEFAULT_API_CONFIG`
  (`R-AR-11`); el contrato no hardcodea hosts.

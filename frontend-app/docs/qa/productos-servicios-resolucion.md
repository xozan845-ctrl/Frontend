# Productos / Servicios — estado de resolución del QA

Fecha: 2026-10-30 · Actualizado: 2026-11-26 (F36)

Este documento complementa `productos-servicios-qa.md`. El informe original
describe el estado encontrado durante el QA; este registra qué se corrigió y qué
queda pendiente de re-prueba contra el entorno real. El cierre frontend y la
aceptación de operación backend se declaran por separado: la matriz vigente de
módulos y su evidencia ejecutada está en
[`../mvp/aceptacion-frontend.md`](../mvp/aceptacion-frontend.md), mientras que
este documento mantiene **pendiente** la re-prueba formal contra Core Engine. No
se interpreta el despliegue de Firebase ni los E2E con `api-mock` como
aceptación del backend.

## Cambios entregados

| PR      | Alcance                                                                                 |
| ------- | --------------------------------------------------------------------------------------- |
| #326    | Productos, servicios y operaciones del catálogo contra el backend real                  |
| #327    | Cobertura E2E de configuración, escaneo, combos, promociones, movimientos e importación |
| #328    | Versionado y formateo del informe original de QA                                        |
| este PR | Documento de resolución y checklist de re-prueba                                        |

Frontend desplegado en Firebase Hosting el 2026-10-30 a las 17:05 UTC.

## Estado por hallazgo

| Hallazgo                                 | Estado en código                                                                                                                                                                                       | Verificación pendiente                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| R-PS-01: costo y metadatos no persistían | Resuelto: producto envía y recibe costo, marca, código de barras, unidad, stock mínimo/máximo, garantía, materia prima, ubicación y estado operativo. Se eliminó `localStorage` como fuente de verdad. | Crear/editar, cerrar sesión, limpiar storage y validar el GET real.                         |
| R-PS-02: servicios solo locales          | Resuelto: `GET/POST/PATCH/DELETE /catalog/servicios`, listado paginado, edición y baja lógica.                                                                                                         | Crear/editar/dar de baja y repetir en sesión nueva.                                         |
| R-PS-03: estado operativo local          | Resuelto: se usa `estado_operativo` (`activo`/`inactivo`) separado de `estado` (`disponible`/`agotado`).                                                                                               | Confirmar que el catálogo público y Ventas reflejan la misma semántica.                     |
| R-PS-04: acciones sin operación          | Resuelto: configuración de inventario, importación CSV, escaneo, combos, promociones y movimientos tienen contrato y UI. La cámara del modal de producto sigue marcada como próxima fase.              | Probar cada flujo contra el backend desplegado.                                             |
| R-PS-05: marca/proveedor sin alta libre  | Resuelto en código: el modal de producto usa un `<input>` con `datalist` y acepta texto nuevo (`company-product-modal.component.html`).                                                                | Confirmar en el despliegue re-probado que una marca nueva se guarda y se muestra al editar. |

## Funciones implementadas

- Configuración de inventario: `GET/PUT /catalog/configuracion-inventario`.
- Importación CSV con validación por fila, vista previa y confirmación: `POST /catalog/productos/importar`.
- Escaneo por código/SKU: `GET /catalog/escanear`.
- Combos: listado, alta, edición y baja en `/catalog/combos`.
- Promociones: listado, alta, edición y baja en `/catalog/promociones`.
- Movimientos: entrada, salida, ajuste y traslado en `/catalog/inventario/movimientos`.

## Límites conocidos

- La importación implementada es CSV; `.xlsx` requeriría un parser adicional.
- El escaneo con cámara dentro del modal de producto no está implementado; el
  escaneo por código desde el catálogo sí funciona.
- Los E2E del repositorio usan `api-mock`; no sustituyen una prueba de
  integración real con Core Engine.

## Antecedentes posteriores al informe original

| Antecedente                                                                | Cierre en este documento                                                                                                                | Estado       |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Firebase servía el bundle anterior (sin `/catalog/servicios` ni metadatos) | Subsanado por el despliegue del 2026-10-30 17:05 UTC; la corrección en código se verifica en la re-prueba, no por el despliegue en sí.  | ⏳ re-prueba |
| `R-PS-01`/`R-PS-02` bloqueantes en sesión nueva                            | Código corregido (ADR-74); siguen abiertos en integración real hasta validar `GET`/`POST` y persistencia cross-session con Core Engine. | ⏳ re-prueba |
| `R-PS-04` actions “NO IMPLEMENTADAS” en el despliegue                      | Implementadas en código y cubiertas por `E2E-CAT`; pendiente ejecutar los mismos flujos contra el backend desplegado.                   | ⏳ re-prueba |
| `R-PS-05` Marca/Proveedor sin alta libre                                   | Implementado en el modal con `input` + `datalist`; pendiente de comprobación en el entorno re-probado.                                  | ⏳ re-prueba |
| Fallo transitorio de login en el primer intento                            | El reintento con credenciales confirmadas terminó la ronda completa; se conserva solo como trazabilidad, no como resultado final.       | ✅ cerrado   |
| Arnés bloqueado al abrir un segundo modal                                  | Limitación de sincronización del script; los subflujos se repitieron aislados y pasaron. No es un fallo funcional del producto.         | ✅ cerrado   |
| Producto de QA conservado para reproducción                                | Se mantiene hasta la re-prueba; se elimina como último paso del checklist una vez registradas las respuestas HTTP reales.               | ⏳ re-prueba |
| “Sin regresiones observadas” de la segunda ronda                           | Válido solo para esa ronda sobre el bundle anterior; no se usa como aceptación del bundle actual ni del backend.                        | ✅ acotado   |

Ninguno de estos cierres declara aceptación de Core Engine: la operación backend
sigue pendiente hasta ejecutar el checklist completo y registrar las respuestas
HTTP reales.

## Checklist de re-prueba

1. Desplegar backend con migración y RLS aplicadas.
2. Confirmar que Firebase Hosting sirve el bundle nuevo.
3. Crear producto con costo, marca, stock mínimo, unidad y estado.
4. Crear servicio con costo, precio, duración y unidad.
5. Cerrar sesión, limpiar `localStorage` e iniciar sesión de nuevo.
6. Verificar producto y servicio desde el GET real.
7. Editar costo, precio, stock, estado y duración; repetir sesión nueva.
8. Probar configuración de inventario, escaneo, combo, promoción, movimiento e
   importación CSV.
9. Confirmar aislamiento entre empresa A y empresa B.
10. Forzar un 4xx/5xx y comprobar que no queda una fila falsa como guardada.
11. Revisar el catálogo público y la semántica de estado acordada.

## Criterio de cierre

El QA puede cerrarse cuando los pasos anteriores pasen contra el entorno
desplegado y se registren las respuestas HTTP reales. Hasta entonces, el estado
correcto es: **implementado y desplegado en frontend, pendiente de re-prueba
formal de QA**.

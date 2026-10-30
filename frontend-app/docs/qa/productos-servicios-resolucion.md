# Productos / Servicios — estado de resolución del QA

Fecha: 2026-10-30

Este documento complementa `productos-servicios-qa.md`. El informe original
describe el estado encontrado durante el QA; este registra qué se corrigió y qué
queda pendiente de re-prueba contra el entorno real.

## Cambios entregados

| PR      | Alcance                                                                                 |
| ------- | --------------------------------------------------------------------------------------- |
| #326    | Productos, servicios y operaciones del catálogo contra el backend real                  |
| #327    | Cobertura E2E de configuración, escaneo, combos, promociones, movimientos e importación |
| #328    | Versionado y formateo del informe original de QA                                        |
| este PR | Documento de resolución y checklist de re-prueba                                        |

Frontend desplegado en Firebase Hosting el 2026-10-30 a las 17:05 UTC.

## Estado por hallazgo

| Hallazgo                                 | Estado en código                                                                                                                                                                                       | Verificación pendiente                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| R-PS-01: costo y metadatos no persistían | Resuelto: producto envía y recibe costo, marca, código de barras, unidad, stock mínimo/máximo, garantía, materia prima, ubicación y estado operativo. Se eliminó `localStorage` como fuente de verdad. | Crear/editar, cerrar sesión, limpiar storage y validar el GET real.     |
| R-PS-02: servicios solo locales          | Resuelto: `GET/POST/PATCH/DELETE /catalog/servicios`, listado paginado, edición y baja lógica.                                                                                                         | Crear/editar/dar de baja y repetir en sesión nueva.                     |
| R-PS-03: estado operativo local          | Resuelto: se usa `estado_operativo` (`activo`/`inactivo`) separado de `estado` (`disponible`/`agotado`).                                                                                               | Confirmar que el catálogo público y Ventas reflejan la misma semántica. |
| R-PS-04: acciones sin operación          | Resuelto: configuración de inventario, importación CSV, escaneo, combos, promociones y movimientos tienen contrato y UI. La cámara del modal de producto sigue marcada como próxima fase.              | Probar cada flujo contra el backend desplegado.                         |

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

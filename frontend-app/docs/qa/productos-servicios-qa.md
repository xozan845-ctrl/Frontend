# QA del módulo Productos / Servicios

## Resumen ejecutivo

Se ejecutó una prueba funcional sobre Firebase Hosting con una sesión real de
propietario de empresa. El módulo carga y permite crear/editar productos,
filtrar, ordenar, cambiar el estado visible, descargar CSV y validar formularios.

La integración del código fuente actual ya incorpora correcciones importantes,
pero el despliegue que se probó en Firebase no corresponde todavía a esa
versión:

- Los datos básicos del producto usan `GET`, `POST` y `PATCH` de
  `/api/v1/catalog/productos`.
- En el código fuente, el costo y los metadatos operativos del producto ya se
  envían y leen desde el API, sin `localStorage` como fuente de verdad.
- En el código fuente, los servicios ya tienen `CompanyServiceApiService` y
  consumen `/catalog/servicios`.
- En el código fuente, configuración, importación, escaneo, combos,
  promociones y movimientos ya tienen endpoints configurados; la cámara del
  modal permanece fuera de alcance.
- En Firebase, la prueba HTTP todavía observó la versión anterior: no hubo
  llamadas a `/catalog/servicios` y el producto no devolvió los metadatos nuevos.

Antes de declarar el módulo conectado completamente al backend real hay que
desplegar el frontend actualizado junto con el backend/migración y repetir la
validación cross-session contra las respuestas HTTP reales.

## Actualización QA — 2026-10-30

La segunda ronda agregó evidencia de los flujos que faltaban y deja el estado
actual así:

- **Pasaron:** actualización del catálogo, bloqueo de SKU/tipo al editar,
  validación de duración, bloqueo de códigos duplicados de servicios, cancelar
  y confirmar borrado local, cierre de modales y límites de paginación con un
  registro.
- **Hallazgo nuevo:** Marca / Proveedor solo ofrece `Sin marca / proveedor`; no
  permite introducir una opción nueva desde el formulario (`R-PS-05`).
- **Se mantiene bloqueante en Firebase:** costo/metadatos de productos y
  servicios no persisten después de una sesión nueva (`R-PS-01` y `R-PS-02`),
  aunque el código fuente ya contiene la corrección.
- **Sin regresiones observadas:** la ronda terminó sin errores de consola,
  Angular ni peticiones fallidas.

Los datos de servicio usados para probar eliminación fueron creados como QA y
se eliminaron desde la interfaz. El producto de QA original permanece para
reproducir la pérdida de costo sin modificar información real del usuario.

## Intento de repetición completa — 2026-10-30

La primera tentativa de esta repetición quedó bloqueada temporalmente en el
login con `Correo o contraseña incorrectos`. Al reintentar con las
credenciales confirmadas por el usuario, el acceso sí funcionó y la ronda
completa se ejecutó. La nota inicial se conserva para dejar trazabilidad del
problema de sesión, pero no representa el resultado final de la ronda.

## Ronda completa de repetición — 2026-10-30

Se volvió a ejecutar el alcance completo del módulo Productos / Servicios en
Firebase Hosting con una sesión real de propietario de empresa.

| Área repetida                  | Resultado          | Evidencia de esta ronda                                                                                                                      |
| ------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Login, panel y ruta del módulo | OK                 | Entró al panel de empresa y a `/empresa/productos`, sin errores de consola ni peticiones fallidas.                                           |
| Alta de producto               | OK                 | Se creó `QA Owner 1793378090874` con SKU `QA-OWNER-1793378090874`.                                                                           |
| Edición de precio y stock      | OK en sesión       | La fila reflejó precio `C$1,600.00` y stock `5`.                                                                                             |
| Persistencia del costo         | FALLO reproducido  | En una sesión nueva el mismo producto mostró costo `C$0.00`, inventario `C$0.00` y margen `100%`. Confirma `R-PS-01`.                        |
| Filtros, ordenación y estados  | OK visual          | Pasaron los 7 ordenamientos, búsqueda por SKU, búsqueda vacía, limpieza, Todos/Activos/Inactivos/Stock bajo y Materia Prima.                 |
| Validación de producto         | OK                 | El formulario bloqueó el alta inválida y mostró controles inválidos; la validación funcional existe aunque no usa atributos HTML `required`. |
| Importación/exportación        | Parcial esperado   | Descargó `plantilla-productos.csv` e `inventario.csv`; la importación informó que queda para una próxima fase.                               |
| Acciones futuras               | NO IMPLEMENTADAS   | Combos, promociones, configuración, movimientos, traslados y barcode continuaron mostrando próxima fase.                                     |
| Alta de servicio               | OK inmediato/local | El contador y el toast se actualizaron en la sesión de creación.                                                                             |
| Persistencia del servicio      | FALLO reproducido  | El servicio no apareció al abrir una sesión nueva; confirma `R-PS-02`.                                                                       |
| Ciclo de servicio              | OK local           | Código duplicado bloqueado, duración inválida bloqueada, cancelar/Escape conservaron la fila y confirmar la eliminó.                         |
| Modales y Marca/Proveedor      | OK / HALLAZGO      | Escape, X y fondo cerraron los modales; Marca/Proveedor siguió ofreciendo solo `Sin marca / proveedor`, confirma `R-PS-05`.                  |

El script combinado de flujos faltantes se detuvo al intentar abrir un segundo
modal mientras el modal de edición seguía visible; es una limitación de
sincronización del arnés, no un fallo funcional observado. Los subflujos
afectados se repitieron con scripts aislados y terminaron correctamente. No se
detectaron errores nuevos de consola, errores de Angular ni respuestas HTTP
fallidas.

Los servicios QA usados en el ciclo de eliminación fueron eliminados desde la
interfaz. El producto QA creado permanece para reproducir la pérdida del costo;
no se eliminaron productos del usuario.

## Estado de implementación frente al despliegue — 2026-10-30

La revisión del código fuente confirmó que los hallazgos R-PS-01, R-PS-02,
R-PS-03 y R-PS-04 tienen implementación nueva en frontend:

- `CatalogProductService` agrega costo, marca, código de barras, unidades,
  stock mínimo/máximo, materia prima, ubicación y `estado_operativo` a los
  payloads de `POST`/`PATCH`, y el adapter los lee desde la respuesta.
- `CompanyServiceApiService` implementa `GET`, `POST`, `PATCH` y `DELETE` para
  `/catalog/servicios`; el store remoto ya no usa `localStorage` como fuente de
  verdad.
- El estado operativo se modela separado del estado de inventario.
- La configuración, importación, escaneo, combos, promociones y movimientos
  tienen rutas configuradas en `api.config.ts`.

Sin embargo, la evidencia de la aplicación publicada no coincide con ese
código fuente. En una sesión nueva sobre Firebase se observó:

1. `GET /catalog/productos?limite=100` respondió `200`, pero el producto no
   incluyó costo, marca, código de barras, stock mínimo ni `estado_operativo`.
2. Al crear un servicio no se generó ninguna petición `GET` ni `POST`
   `/catalog/servicios`; el contador cambió solo durante esa sesión.
3. En la siguiente sesión el contador de servicios volvió a cero y el costo del
   producto volvió a `C$0.00`.

Conclusión: los hallazgos están **resueltos en el código fuente** y el build
actualizado ya está publicado, pero siguen **abiertos en la integración real**
hasta verificar que la migración 11_catalogo_productos_servicios.sql, RLS,
permisos del rol `empresario` y el contrato completo del backend estén activos.
El problema actual está en la integración backend/permisos, no en la ausencia de
implementación del frontend fuente.

## Ronda de re-prueba con build actualizado — 2026-10-30

Se repitió la prueba con la misma cuenta de propietario de empresa. Esta vez el
build nuevo sí llegó a Firebase: la aplicación llamó a `/catalog/servicios`,
configuración, combos, promociones y movimientos. La conclusión cambió de
“frontend antiguo” a “frontend conectado, pero backend sin permisos/contrato
completo para este rol”.

| Flujo                             | Resultado                 | Evidencia HTTP/UI                                                                                                     |
| --------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Login y entrada al módulo         | OK                        | Acceso a `/empresa/productos`; sin errores de consola ni `requestfailed`.                                             |
| Alta de producto                  | OK parcial                | `POST /catalog/productos` respondió `201`, pero la respuesta omitió costo y metadatos; la tabla mostró costo `—`.     |
| Edición de precio y stock         | OK parcial                | `PATCH` actualizó precio y stock; costo continuó en `—`.                                                              |
| Lectura de producto               | FALLO de contrato/backend | `GET /catalog/productos` respondió `200`, pero no devolvió costo, marca, barcode, stock mínimo ni `estado_operativo`. |
| Servicios                         | BLOQUEADO por permisos    | `GET` y `POST /catalog/servicios` respondieron `403 ACCESO_DENEGADO`: rol `empresario` sin acceso.                    |
| Combos, promociones y movimientos | BLOQUEADOS por permisos   | Las rutas respondieron `403`; la UI mostró el mensaje de backend.                                                     |
| Configuración de inventario       | BLOQUEADA por permisos    | La UI abrió el modal, pero la carga/guardado recibió `403`.                                                           |
| Importación CSV                   | FALLO de endpoint         | La vista previa funcionó; al confirmar, `POST /catalog/productos/importar` respondió `404 Cannot POST`.               |
| Filtros y ordenación              | OK                        | Pasaron búsquedas, limpieza, estados, stock bajo, materia prima y los 7 ordenamientos.                                |
| Validación de formularios         | OK                        | El alta inválida quedó bloqueada y mostró cuatro controles inválidos.                                                 |
| Plantilla y exportación           | OK                        | Descargó `plantilla-productos.csv` e `inventario.csv`.                                                                |

### Reclasificación de hallazgos

- **R-PS-01:** frontend corregido, backend aún no devuelve ni persiste todos
  los metadatos del contrato.
- **R-PS-02:** frontend corregido y llamando al endpoint; backend/RLS bloquea al
  rol `empresario` con `403`.
- **R-PS-03:** frontend corregido con `estado_operativo`; queda pendiente
  comprobar que el backend lo devuelva y persista.
- **R-PS-04:** frontend corregido y con endpoints configurados; backend tiene
  permisos incompletos (`403`) y el endpoint de importación está ausente (`404`).
- **R-PS-05:** sigue pendiente; el selector continúa mostrando únicamente
  `Sin marca / proveedor`.

Se crearon productos QA para verificar `POST`/`PATCH`; no se eliminaron
productos existentes. No se creó ningún servicio porque el backend rechazó el
`POST` con `403`.

## Alcance y condiciones

- Entorno: `https://kb-coleccion-internacional-ni.web.app`.
- Fecha de la primera ronda: 2026-10-29.
- Ronda complementaria y repetición completa: 2026-10-30.
- Navegador: Google Chrome automatizado con Playwright.
- Perfil: usuario autenticado con rol `empresario` y empresa activa.
- Alcance: únicamente Productos / Servicios y sus acciones visibles.
- No se documentan credenciales.
- Se dejó un producto de QA creado para no borrar datos sin confirmación.

## Matriz de pruebas ejecutadas

| Flujo                                                                | Resultado                             | Evidencia                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Login y entrada al panel                                             | OK                                    | Acceso a `/empresa/productos`.                                                                      |
| Carga del catálogo                                                   | OK                                    | Sin errores de aplicación ni fallos de API.                                                         |
| Crear producto                                                       | OK inmediato                          | Fila, KPI y toast actualizados.                                                                     |
| Editar precio y stock                                                | OK inmediato                          | La fila reflejó los cambios.                                                                        |
| Persistir costo                                                      | FALLO en despliegue; fuente corregida | La versión publicada volvió a `C$0.00`; el código fuente nuevo ya envía/lee el campo.               |
| Estado activo/inactivo                                               | FALLO en despliegue; fuente corregida | La versión publicada solo mostró el ciclo visual; el código fuente nuevo separa `estado_operativo`. |
| Búsqueda, estados y stock bajo                                       | OK visual                             | Búsqueda positiva, búsqueda vacía y filtros respondieron.                                           |
| Ordenación                                                           | OK                                    | Se probaron nombre, precio, stock y fecha, en ambos sentidos cuando aplica.                         |
| Limpiar filtros                                                      | OK                                    | Restableció el listado.                                                                             |
| Materia Prima                                                        | OK visual                             | La pestaña abrió.                                                                                   |
| Validación de alta vacía                                             | OK                                    | Bloqueó envío y mostró cuatro controles inválidos.                                                  |
| Crear servicio                                                       | OK inmediato                          | Contador y toast se actualizaron.                                                                   |
| Persistir servicio                                                   | FALLO en despliegue; fuente corregida | Firebase no llamó `/catalog/servicios`; el código fuente nuevo sí tiene repository HTTP.            |
| Descargar plantilla / exportar                                       | OK                                    | Descargó `plantilla-productos.csv` e `inventario.csv`.                                              |
| Importar Excel/CSV                                                   | NO IMPLEMENTADO                       | La UI informa “disponible en una próxima fase”.                                                     |
| Combos, promociones, configuración, movimientos, traslados y barcode | NO IMPLEMENTADO                       | Cada acción muestra mensaje de próxima fase.                                                        |

No se observaron errores de consola, errores de Angular ni respuestas fallidas
del backend durante los flujos del módulo.

## Ronda complementaria de pruebas

Se revisaron los controles visibles contra el código y se ejecutaron casos que
no estaban en la primera matriz:

| Caso adicional                          | Resultado    | Evidencia                                                                                                                                         |
| --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Botón Actualizar en Productos           | OK           | Disparó un nuevo `GET /api/v1/catalog/productos`.                                                                                                 |
| SKU durante edición                     | OK           | El control quedó deshabilitado.                                                                                                                   |
| Cambio de tipo durante edición          | OK           | Producto y Servicio quedaron deshabilitados.                                                                                                      |
| Edición de metadatos visibles           | OK inmediato | El formulario aceptó barcode, unidad, fracciones, contenido, escalas, garantía y ubicación durante la sesión. Persistencia server-side pendiente. |
| Crear servicio con código duplicado     | OK           | La UI bloqueó la operación con “Ya existe un servicio con ese código”.                                                                            |
| Duración inválida de servicio           | OK           | El formulario mantuvo abierto el modal y bloqueó el guardado.                                                                                     |
| Cancelar borrado de servicio            | OK           | El registro permaneció en la tabla.                                                                                                               |
| Escape en borrado de servicio           | OK           | Cerró el diálogo con el diálogo enfocado.                                                                                                         |
| Confirmar borrado de servicio           | OK local     | La fila desapareció; no generó mutación HTTP porque el store es local.                                                                            |
| Escape, X y fondo del modal de producto | OK           | Las tres formas cerraron el diálogo sin crear datos.                                                                                              |
| Límite de paginación con un registro    | OK           | Anterior y Siguiente aparecen deshabilitados. No se probó una página real con más de 10 registros.                                                |
| Opciones de Marca / Proveedor           | HALLAZGO     | En la sesión solo apareció `Sin marca / proveedor`; no hay entrada libre para registrar una marca nueva.                                          |

La ronda complementaria terminó sin errores de consola, errores de Angular ni
peticiones fallidas.

## Hallazgos y acciones correctivas

### R-PS-01 — El costo del producto no persiste en el despliegue publicado

**Prioridad: alta.**

Reproducción: crear/editar un producto con costo `1000.00`, confirmar que la
tabla muestra `C$1,000.00`, cerrar sesión, volver a entrar y abrir el módulo. El
costo aparece como `C$0.00`; margen y KPI de inventario quedan distorsionados.

Evidencia de Firebase:

- La respuesta real de `GET /catalog/productos?limite=100` no incluyó costo,
  marca, código de barras, stock mínimo ni `estado_operativo`.
- Tras una sesión nueva, la tabla mostró costo `C$0.00`, inventario `C$0.00` y
  margen `100%`.

Estado del código fuente:

- `CatalogProductService` ya construye payloads con esos metadatos y el adapter
  ya los lee desde la respuesta.
- `CompanyProductsStore` ya no usa `localStorage` como fuente de verdad.

Backend/despliegue debe:

- desplegar la migración y el contrato de producto con costo, marca, código de
  barras, unidad, stock mínimo/máximo, tipo de precio/costo, materia prima,
  ubicación y estado operativo;
- devolver esos campos en listado/detalle y guardarlos en `POST`/`PATCH`;
- aplicar aislamiento por empresa/tenant y autorización de empresario/admin;
- documentar decimales, nulos, unidades, rangos y conversión a centavos.
- publicar el build frontend que contiene los DTOs, adapters y servicio nuevos;
- verificar que el backend desplegado devuelve los metadatos en listado/detalle;
- no aceptar como cerrado el hallazgo hasta repetir la prueba con
  `localStorage` limpio.

### R-PS-02 — El despliegue publicado todavía no consume servicios remotos

**Prioridad: alta.**

Reproducción: abrir Servicios, crear un servicio con nombre, código, costo,
precio, unidad y duración; confirmar la fila; abrir una sesión nueva. El
servicio desaparece y el listado muestra cero.

Evidencia de Firebase:

- Al crear un servicio no se observó ninguna petición `GET` ni `POST` a
  `/catalog/servicios`.
- El contador cambió durante la sesión, pero en la siguiente sesión volvió a
  cero.

Estado del código fuente:

- `CompanyServiceApiService` ya implementa `GET`, `POST`, `PATCH` y `DELETE`
  sobre `/catalog/servicios`.
- `CompanyServicesStore` ya deriva filtros, orden y paginación del estado
  remoto y usa la respuesta del API después de las mutaciones.

Backend/despliegue debe:

- desplegar el recurso por empresa con listado, alta, edición y baja/estado;
- confirmar persistencia de id, empresa, código, nombre, descripción, categoría,
  marca/proveedor, barcode, costo, precio, unidad, duración, estado y fechas;
- confirmar unicidad de código por empresa, validaciones, permisos y RLS;
- cubrir aislamiento entre empresas y lectura posterior a una nueva sesión;
- publicar el build frontend nuevo;
- confirmar que el endpoint y la migración estén disponibles en el entorno;
- repetir la prueba de alta, edición, baja y lectura posterior con una sesión
  nueva.

### R-PS-03 — Estado operativo corregido en fuente, pendiente de despliegue

**Prioridad: media-alta; requiere confirmación de integración.**

El código fuente nuevo usa `estado_operativo` (`activo`/`inactivo`) separado de
`estado` (`disponible`/`agotado`). La versión publicada no expuso ese campo en
la respuesta inspeccionada, por lo que la integración todavía no queda
verificada en Firebase.

El contrato ya está acordado en el código fuente; falta desplegarlo y verificarlo
tras nueva sesión y en el catálogo público.

### R-PS-04 — Acciones corregidas en fuente, pendiente de despliegue

**Prioridad: media, según alcance.**

El código fuente nuevo ya tiene endpoints configurados para configuración de
inventario, importación, escaneo, combos, promociones y movimientos. La prueba
de Firebase sigue mostrando la versión anterior con mensajes de próxima fase;
por tanto, el hallazgo continúa abierto solo para el entorno publicado.

Debe publicarse el build actualizado y verificar cada flujo con respuestas HTTP
reales. La cámara del modal puede seguir marcada como próxima fase.

### R-PS-05 — Marca / Proveedor no permite alta de una opción nueva

**Prioridad: media.**

El campo del modal se presenta como “Marca / Proveedor”, pero en la prueba
apareció únicamente la opción `Sin marca / proveedor`. El control es un
`select`, no un input libre; por tanto, una empresa que no tenga una marca
previamente cargada no puede escribir una nueva desde este flujo.

Debe definirse una de estas alternativas:

- aceptar texto libre y persistirlo en el producto;
- cargar un catálogo de marcas/proveedores desde backend y añadir un flujo de
  alta;
- renombrar el campo para dejar claro que solo permite seleccionar opciones
  existentes.

La decisión debe reflejarse en DTO, validación, filtros y pruebas de nueva
sesión.

## Trabajo backend pendiente

1. Desplegar la migración `11_catalogo_productos_servicios.sql` y el contrato
   actualizado de productos/servicios.
2. Garantizar tenancy, autorización y validación server-side; no confiar en
   `empresa_id` enviado por el navegador.
3. Verificar que los endpoints nuevos están activos en el entorno publicado.
4. Verificar estados y transiciones de producto, incluyendo efecto en ventas,
   inventario y catálogo público.
5. Rechazar códigos duplicados, importes inválidos, duración fuera de rango,
   stock negativo y payloads de otra empresa con errores estables.
6. Añadir pruebas de contrato/integración para alta, lectura posterior, edición,
   aislamiento, autorización, estados y concurrencia.
7. Verificar endpoints, permisos y persistencia de importación, combos,
   promociones, traslados y códigos de barras antes de habilitarlos en producción.

## Trabajo frontend pendiente

1. Publicar el build que ya sustituye stores locales de metadatos y servicios
   por repositories HTTP.
2. Verificar DTOs/adapters sin perder campos en la normalización snake/camel.
3. Usar la respuesta server-side después de cada mutación y no confirmar una
   operación solo con un toast.
4. Hidratar el modal con costo, mínimos, estado y datos completos del servicio.
5. Añadir E2E con cierre de sesión, limpieza de `localStorage` y nueva sesión.
6. Mostrar una diferencia clara entre acciones operativas y funciones futuras.
7. Implementar importación solo cuando exista parser, validación por fila,
   preview, confirmación y persistencia remota.
8. Resolver Marca / Proveedor como texto libre o catálogo remoto; no dejar un
   selector vacío que impida registrar una opción nueva.

## Criterios de aceptación

- Producto y servicio creados conservan todos sus campos después de cerrar
  sesión, limpiar almacenamiento local y volver a consultar el API.
- Editar costo, precio, stock, estado o duración se refleja tras nueva sesión.
- La empresa A no puede leer ni modificar datos de la empresa B.
- Los errores 4xx/5xx no dejan filas falsas ni muestran éxito engañoso.
- Toda acción habilitada tiene endpoint real o una indicación explícita de que
  aún no está disponible.
- Las pruebas E2E cubren alta, detalle, edición, filtros, orden, validación,
  estado, exportación y persistencia cross-session.

## Cobertura que aún falta ejecutar

Estos casos se identificaron durante la revisión, pero no se marcaron como
pasados porque requieren datos adicionales, otra identidad o un contrato de
backend que todavía no existe:

- Crear dos productos con el mismo SKU y verificar el rechazo server-side.
- Consultar el detalle `GET /catalog/productos/:id` desde una acción real del
  panel; actualmente la UI solo ofrece editar desde la tabla.
- Probar paginación real con más de 10 productos y conservar filtros al cambiar
  de página.
- Validar stock negativo, `stock mínimo > máximo`, precio menor que costo,
  decimales de más de dos posiciones y límites máximos de texto.
- Verificar que un producto marcado como materia prima, sus metadatos y su
  estado sobrevivan a una nueva sesión.
- Probar aislamiento y autorización con una segunda empresa: lectura,
  modificación y acceso directo por id.
- Simular respuestas 400, 401, 403, 404 y 500 en alta, edición y listado para
  confirmar mensajes, reintentos y que no quede una fila falsa.
- Probar responsive móvil, navegación completa por teclado y lectores de
  pantalla en tabla, filtros, modal y confirmación.
- Probar importación real `.xlsx`; actualmente la UI no procesa archivos y solo
  informa que la función estará disponible después.

## Re-prueba recomendada

1. Desplegar migraciones y contrato backend.
2. Usar una empresa de prueba o borrar únicamente los datos QA identificados.
3. Crear producto y servicio con todos los campos.
4. Verificar peticiones HTTP, payloads, status y respuestas, no solo toasts.
5. Cerrar sesión, limpiar `localStorage`, iniciar sesión y comprobar los mismos
   registros.
6. Editar costo, precio, stock, estado y duración; repetir la comprobación.
7. Probar aislamiento con otra empresa y revisar el catálogo público.

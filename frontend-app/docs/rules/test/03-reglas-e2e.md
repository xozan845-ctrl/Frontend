# 03 — Reglas de Tests E2E

Aplica a: pruebas que recorren la aplicación completa en un **navegador real**.
Las suites viven en `e2e/storefront.spec.ts` (tienda) y `e2e/vendor.spec.ts`
(panel del vendedor, ADR-20) — Playwright, `npm run e2e` — y corren en el job
`G-6` de la CI; estas reglas fijan el contrato que esas suites cumplen.

## Flujos críticos (obligatorios antes de cada release)

| ID     | Regla                                                                                                                                                                      | Flujo      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| R-E-1  | El **catálogo** carga productos y permite filtrar por categoría y ordenar; el conteo mostrado coincide con las tarjetas.                                                   | catálogo   |
| R-E-2  | **Detalle de producto**: navegar desde una tarjeta muestra el nombre, precio e imágenes correctos.                                                                         | catálogo   |
| R-E-3  | **Agregar al carrito**: cambia el contador del navbar, abre el sidebar y suma el total correcto.                                                                           | carrito    |
| R-E-4  | **Checkout protegido**: sin sesión redirige a `/login`; con sesión permite completar y llega a `/checkout/confirmation`.                                                   | checkout   |
| R-E-5  | **Login/registro**: credenciales válidas autentican y permiten acceder al checkout; credenciales inválidas muestran el error sin navegar.                                  | auth       |
| R-E-6  | **Wishlist**: agregar/quitar actualiza el contador y persiste al recargar.                                                                                                 | wishlist   |
| R-E-7  | **Búsqueda autocomplete**: escribir filtra resultados, navega con teclado (flechas + Enter) y cierra con Escape.                                                           | búsqueda   |
| R-E-8  | **Ruta inexistente**: una URL desconocida muestra el `not-found` (404).                                                                                                    | navegación |
| R-E-15 | **Alta de tienda**: un vendedor crea su cuenta y recorre el asistente (cuenta → tienda → productos → listo) en `/crear-tienda`.                                            | tienda     |
| R-E-16 | **Dashboard de IA**: el dashboard del feature IA (`/ia`) muestra el panel de conexión del backend (mockeado).                                                              | IA         |
| R-E-17 | **Enlace de IA**: el enlace "IA" del navbar abre el dashboard del feature (`/ia`).                                                                                         | IA         |
| R-E-18 | **POS del vendedor**: un vendedor autenticado registra un pedido (cliente de la cartera, dos productos y stepper de cantidad) y lo ve al instante en "Pedidos recientes".  | vendedor   |
| R-E-19 | **Pedidos del vendedor**: la lista filtra por estado con conteo y el detalle del pedido carga con sus líneas.                                                              | vendedor   |
| R-E-20 | **Entrada multi-tienda**: la raíz (`/`) sin tienda en la URL muestra el buscador de tienda y el acceso al asistente de alta; un identificador válido resuelve el catálogo. | navegación |

## Calidad de ejecución

| ID     | Regla                                                                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-E-9  | **Cero errores de consola** durante el flujo (excepciones, 5xx, warnings de Angular). Un error = test fallido.                                                                     |
| R-E-10 | Verificación por **datos y URL** (texto, conteos, `location.pathname`), no solo por screenshots; los screenshots son evidencia complementaria.                                     |
| R-E-11 | Selectores estables (`data-testid` preferido; roles/labels como alternativa). Prohibido depender de clases generadas por el build.                                                 |
| R-E-12 | **Suite hermética**: los datos que un test necesita vienen de mocks/fixtures controlados o de una API de prueba; prohibido depender del backend de producción o del estado manual. |
| R-E-13 | Ejecución **headless** en CI, con `TZ` fija, timeout por paso y **retry único** para red.                                                                                          |
| R-E-14 | Los scripts E2E viven en el repo (no en `/tmp`), con su propia configuración y un script npm (`npm run e2e`).                                                                      |

## Mínimo aceptable por release

- Suite E2E ejecutando `R-E-1` … `R-E-8`, `R-E-15`, `R-E-16`, `R-E-17`, `R-E-18`,
  `R-E-19` y `R-E-20` con pass rate 100%.
- Si un flujo crítico no puede automatizarse, se registra en `AUDIT.md` como
  deuda con responsable y fecha.

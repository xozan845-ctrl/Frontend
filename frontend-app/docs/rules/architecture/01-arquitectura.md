# 01 — Arquitectura

Aplica a: organización del código, dependencias entre capas, conexión con el
backend, gestión de estado, navegación, formularios y ciclo de vida de la SPA.

## Organización y dependencias

| ID     | Regla                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-AR-1 | **Feature-first (`domains/` + `shared/`)**: la aplicación se organiza por dominio de negocio en `src/app/domains/<feature>/` (`auth`, `cart`, `home`, `plans`, `products`, `wishlist`) y por código transversal en `src/app/shared/`. Cada dominio agrupa sus `components/`, `state/`, `services/`, `repositories/`, `adapters/`, `models/`, `constants/` y `mocks/`; prohibido crear carpetas por tipo técnico en la raíz de `app/`. |
| R-AR-2 | **Dirección de dependencias**: `shared/` **no** importa de `domains/` (lo transversal no conoce features); un dominio puede consumir a otro solo por su API pública (modelos, stores o servicios), nunca por componentes internos. `app.config.ts` y `app.routes.ts` son el único punto de composición.                                                                                                                               |
| R-AR-3 | **Puertos e inyección de dependencias (DIP)**: toda dependencia a infraestructura (HTTP, almacenamiento, APIs externas) se declara como **interfaz + `InjectionToken`** en `repositories/`, se implementa en `services/` y se cablea en `app.config.ts` (`{ provide: PRODUCT_REPOSITORY, useClass: ProductService }`). Los consumidores dependen del token (`inject(PRODUCT_REPOSITORY)`), no de la clase concreta.                   |
| R-AR-4 | **Adapters / capa anticorrupción (ACL)**: ninguna respuesta externa entra cruda al dominio. Se normaliza en `adapters/` con funciones puras `adapt*FromBackend` (tolerantes a `camelCase`/`snake_case`, envelopes `{ data }`/`{ items }`/`{ results }` y tipos string numéricos). El modelo de dominio (`models/*.model.ts`) es estable y no conoce esos formatos.                                                                    |

## Estado y navegación

| ID     | Regla                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-AR-5 | **Estado con NgRx Signals**: el estado compartido vive en un `signalStore` (`withState`/`withComputed`/`withMethods`/`withHooks`). Los derivados se calculan en `withComputed` (nunca en la plantilla), las mutaciones en `withMethods` con `patchState`, y la persistencia en `withHooks`. Prohibido crear estado de servidor con `BehaviorSubject` o servicios "god". |
| R-AR-6 | **Componentes standalone y rutas lazy**: los componentes son `standalone` con sus dependencias en `imports`; cada ruta de dominio se carga con `loadComponent`/`loadChildren` en `app.routes.ts`. Prohibido importar estáticamente un dominio desde otra ruta o desde `app.ts`.                                                                                         |
| R-AR-7 | **Formularios reactivos tipados**: todo formulario de negocio usa `ReactiveFormsModule` + `FormBuilder` (preferentemente `nonNullable.group`) con `Validators` explícitos. Prohibido `FormsModule`/`ngModel` para lógica de negocio.                                                                                                                                    |

## Acceso a datos y errores

| ID      | Regla                                                                                                                                                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-AR-8  | **Sin acceso a red en componentes**: `HttpClient` se inyecta **solo** en `services/`; los componentes leen y mutan estado a través de stores o servicios. Ningún componente llama a `HttpClient` directamente.                                                              |
| R-AR-9  | **Errores traducidos y notificados**: los errores de API se capturan en el servicio/store, se traducen a un mensaje de dominio y se muestran con `NotificationService`. Prohibido `alert`, `confirm` o `prompt` nativos y prohibido dejar errores sin notificar al usuario. |
| R-AR-10 | **Ciclo de vida de suscripciones**: en componentes, todo `Observable` se libera con `takeUntilDestroyed`/`takeUntil` o se consume en plantilla con `async`/signals. Prohibido un `subscribe` sin estrategia de liberación.                                                  |
| R-AR-11 | **Configuración por entorno**: la URL base y los endpoints viven en `src/environments/` y `DEFAULT_API_CONFIG` (`api.config.ts`); prohibido hardcodear hosts, puertos o rutas de API en componentes o servicios.                                                            |

## Notas

- La regla de precio/dinero del backend (centavos) **no aplica** aquí: el
  frontend recibe y muestra montos ya formateados o `number`; aun así, todo
  cálculo de carrito redondea a 2 decimales antes de mostrarse (`R-U-6`).

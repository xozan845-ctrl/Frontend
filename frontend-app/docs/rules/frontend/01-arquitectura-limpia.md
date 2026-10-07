# 01 — Arquitectura limpia / hexagonal en Angular

Aplica a: cómo se distribuyen las responsabilidades en la SPA y en qué dirección
dependen unas capas de otras. Complementa a
[`../architecture/01-arquitectura.md`](../architecture/01-arquitectura.md)
(estructura por capas `core/shared/layout/features`, ADR-12), profundizando en el
diseño **clean/hexagonal** dentro de cada feature.

## Capas y dependencias

| ID     | Regla                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX-1 | **Regla de dependencia hacia dentro**: dentro de cada feature, el código se organiza en cuatro capas — _dominio_ (`models/*.model.ts` y reglas puras), _aplicación_ (`state/` y `services/`), _infraestructura_ (`adapters/`, `repositories/`, HTTP, `localStorage`) y _presentación_ (`pages/` y `components/`). Una capa solo depende de las interiores; el **dominio no conoce Angular, HTTP ni la UI**. |
| R-CX-2 | **Puertos y adaptadores**: la infraestructura se consume a través de un **puerto** (interfaz + `InjectionToken`) implementado por un **adaptador** (servicio HTTP, adapter de DTO). El núcleo depende del puerto, nunca de la implementación (`R-AR-3`, `R-AR-4`).                                                                                                                                          |
| R-CX-3 | **Lógica de negocio fuera de los componentes**: los componentes orquestan (leen señales, disparan métodos) pero no calculan reglas de negocio. La lógica vive en stores/servicios y debe poder probarse **sin TestBed ni DOM**.                                                                                                                                                                             |
| R-CX-4 | **Modelo de dominio puro**: las entidades y tipos de `models/*.model.ts` no importan Angular ni transportan envelopes; la conversión desde/hacia el backend ocurre **solo** en los adapters (`R-AR-4`).                                                                                                                                                                                                     |
| R-CX-5 | **Casos de uso con nombre del dominio**: cada operación de aplicación es un método explícito (`agregarAlCarrito`, `aplicarCupon`, `loadProducts`) que expresa la intención; prohibido exponer mutaciones genéricas (`set`, `update`) que fuercen al componente a conocer las reglas.                                                                                                                        |
| R-CX-6 | **Fronteras de feature**: un feature no importa las rutas internas de otro (`pages/`, `components/`, `state/`, `models/`). La comunicación es por su **API pública**: `features/<feature>/public-api.ts` (modelos y stores) y `features/<feature>/public-ui.ts` (presentacionales con contrato `input`/`output`), o por `core/`/`shared/`.                                                                  |
| R-CX-7 | **Testeabilidad como criterio de diseño**: si una regla no se puede probar sin renderizar un componente, está en la capa equivocada. Moverla a aplicación/dominio es parte del cambio.                                                                                                                                                                                                                      |

## Notas

- El diseño ya está presente: `ProductService`/`AuthService`/`OrderService`
  implementan puertos; los `adapters/` aíslan el backend; los `signalStore`
  concentran la lógica de aplicación. Hexagonal **no** obliga a más carpetas: se
  expresa con `models/`, `state/`, `services/`, `repositories/` y `adapters/`
  dentro de cada feature.
- `core/` y `shared/` no son capas de negocio: `core/` es infraestructura sin UI
  (`R-AR-13`) y `shared/` es presentación/utilidades reutilizables (`R-SH-*`).
- La separación **Smart/Dumb** se define en
  [`02-solid-srp.md`](./02-solid-srp.md) (`R-SO-8`).

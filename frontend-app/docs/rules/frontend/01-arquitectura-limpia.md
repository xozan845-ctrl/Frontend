# 01 — Arquitectura limpia / hexagonal en Angular

Aplica a: cómo se distribuyen las responsabilidades en la SPA y en qué dirección
dependen unas capas de otras. Complementa a
[`../architecture/01-arquitectura.md`](../architecture/01-arquitectura.md)
(composición por dominios), profundizando en el diseño **clean/hexagonal**.

## Capas y dependencias

| ID     | Regla                                                                                                                                                                                                                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-CX-1 | **Regla de dependencia hacia dentro**: el código se organiza en cuatro capas — _dominio_ (modelos y reglas puras), _aplicación_ (stores y casos de uso/servicios), _infraestructura_ (HTTP, `localStorage`, APIs) y _presentación_ (componentes y plantillas). Una capa solo depende de las interiores; el **dominio no conoce Angular, HTTP ni la UI**. |
| R-CX-2 | **Puertos y adaptadores**: la infraestructura se consume a través de un **puerto** (interfaz + `InjectionToken`) implementado por un **adaptador** (servicio HTTP, adapter de DTO). El núcleo depende del puerto, nunca de la implementación (`R-AR-3`, `R-AR-4`).                                                                                       |
| R-CX-3 | **Lógica de negocio fuera de los componentes**: los componentes orquestan (leen señales, disparan métodos) pero no calculan reglas de negocio. La lógica vive en stores/servicios y debe poder probarse **sin TestBed ni DOM**.                                                                                                                          |
| R-CX-4 | **Modelo de dominio puro**: las entidades y tipos de `models/*.model.ts` no importan Angular ni transportan envelopes; la conversión desde/hacia el backend ocurre **solo** en los adapters (`R-AR-4`).                                                                                                                                                  |

## Casos de uso y fronteras

| ID     | Regla                                                                                                                                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-CX-5 | **Casos de uso con nombre del dominio**: cada operación de aplicación es un método explícito (`agregarAlCarrito`, `aplicarCupon`, `loadProducts`) que expresa la intención; prohibido exponer mutaciones genéricas (`set`, `update`) que fuercen al componente a conocer las reglas. |
| R-CX-6 | **Fronteras de feature**: un dominio no importa las implementaciones internas de otro (componentes, stores privados); la comunicación es por su API pública (modelos, store expuesto o servicio) o por `shared/`.                                                                    |
| R-CX-7 | **Testeabilidad como criterio de diseño**: si una regla no se puede probar sin renderizar un componente, está en la capa equivocada. Moverla a aplicación/dominio es parte del cambio.                                                                                               |

## Notas

- Este diseño ya está presente: `ProductService`/`AuthService`/`OrderService`
  implementan puertos; los `adapters/` aíslan el backend; los `signalStore`
  concentran la lógica de aplicación. Las brechas se registran en AUDIT.
- Hexagonal **no** obliga a más carpetas: se expresa con `models/`, `state/`,
  `services/`, `repositories/` y `adapters/` dentro de cada dominio.

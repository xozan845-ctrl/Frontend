# Reglas de Arquitectura — frontend-ecomerce

Reglas de composición del frontend: cómo se organiza una **SPA Angular** por
dominios, cómo se conectan las dependencias (puertos + `InjectionToken`, adapters
que aíslan el backend) y cómo viven el estado y la navegación. Es el área de la
que cuelgan referencias casi todas las demás.

## Archivos

| Archivo              | Contenido                                                                                                                                                                  | Sufijo        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `01-arquitectura.md` | Feature-first, dirección de dependencias, DIP con `InjectionToken`, adapters/ACL, NgRx Signals, routing lazy, formularios reactivos, errores, ciclo de vida, configuración | `R-AR` (1–11) |
| `02-naming.md`       | Archivos, clases, selectores, tipos, rutas, claves de storage, idioma, commits                                                                                             | `R-NC` (1–12) |

> Los documentos derivados de esta área (**AUDIT, CHECKLIST, historiales**) no
> viven aquí: están en [`../_meta/`](../_meta/README.md). Un área de reglas solo
> contiene `README.md` + archivos `NN-tema.md`.

## Mapa de IDs

| Prefijo  | Rango | Archivo              | Ámbito                                               |
| -------- | ----- | -------------------- | ---------------------------------------------------- |
| `R-AR-*` | 1–11  | `01-arquitectura.md` | Capas, DI, adapters, estado, routing y ciclo de vida |
| `R-NC-*` | 1–12  | `02-naming.md`       | Nomenclatura de código, archivos, tipos y commits    |

## Reglas de otras áreas que exige esta (cross-refs)

| ID        | Exigencia                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| `R-AR-2`  | Dirección de dependencias → deuda registrada en [`../_meta/AUDIT.md`](../_meta/AUDIT.md)                    |
| `R-AR-4`  | Adapters sin `any` → `R-NC-10` (`02-naming.md`) y contrato en [`../test/04`](../test/04-reglas-contrato.md) |
| `R-AR-6`  | Lazy loading por ruta → presupuesto de bundle en `R-PF-1` (`../frontend/07-rendimiento.md`)                 |
| `R-AR-9`  | Ciclo de vida de suscripciones → anti-flakiness `R-FL-*` (`../test/05-reglas-robustez.md`)                  |
| `R-AR-11` | Configuración por entorno → secretos en `R-SE-2` (`../security/01-seguridad.md`)                            |
| `R-NC-8`  | Commits → `R-GC-1..7` (`../git/02-commits.md`)                                                              |

## Pendientes

- Pendiente de auditar: entra en la próxima revisión (`R-COV-3`).
- Deuda conocida: `shared/ui/search-autocomplete` importa `ProductStore` de
  `domains/products`, lo que invierte la dirección de `R-AR-2` (ver AUDIT).

# Reglas de Arquitectura — frontend-ecomerce

Reglas de composición del frontend: cómo se organiza una **SPA Angular** por
capas (`core/` · `shared/` · `layout/` · `features/`, ADR-12), cómo se conectan
las dependencias (puertos + `InjectionToken`, adapters que aíslan el backend) y
cómo viven el estado y la navegación. Es el área de la que cuelgan referencias
casi todas las demás.

## Archivos

| Archivo              | Contenido                                                                                                                                                              | Sufijo        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `01-arquitectura.md` | Capas `core/shared/layout/features`, dirección de dependencias, DIP, adapters/ACL, NgRx Signals, rutas por feature, formularios, errores, ciclo de vida, configuración | `R-AR` (1–13) |
| `02-naming.md`       | Archivos, clases, selectores, tipos, rutas, claves de storage, idioma, commits                                                                                         | `R-NC` (1–12) |

> Los documentos derivados de esta área (**AUDIT, CHECKLIST, historiales**) no
> viven aquí: están en [`../_meta/`](../_meta/README.md). Un área de reglas solo
> contiene `README.md` + archivos `NN-tema.md`.

## Mapa de IDs

| Prefijo  | Rango | Archivo              | Ámbito                                                         |
| -------- | ----- | -------------------- | -------------------------------------------------------------- |
| `R-AR-*` | 1–13  | `01-arquitectura.md` | Capas, DI, adapters, estado, rutas por feature y ciclo de vida |
| `R-NC-*` | 1–12  | `02-naming.md`       | Nomenclatura de código, archivos, tipos y commits              |

## Estructura por capas (ADR-12)

```text
src/app/
├── core/        # infra transversal · SIN UI · NO importa shared/ ni features/
├── shared/      # ui/ directives/ pipes/ constants/ · sin negocio · puede usar core/
├── layout/      # navbar/ footer/ drawers (chrome de la app)
└── features/    # <feature>/{pages,components,state,services,repositories,
                 #           adapters,models,constants,mocks,public-api,
                 #           public-ui,<feature>.routes.ts}
```

## Reglas de otras áreas que exige esta (cross-refs)

| ID        | Exigencia                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| `R-AR-2`  | Dirección de dependencias ↔ fronteras de feature en `R-CX-6` (`../frontend/01-arquitectura-limpia.md`)      |
| `R-AR-4`  | Adapters sin `any` → `R-NC-10` (`02-naming.md`) y contrato en [`../test/04`](../test/04-reglas-contrato.md) |
| `R-AR-6`  | Rutas por feature → `R-AR-12`; presupuesto de bundle en `R-PF-1` (`../frontend/07-rendimiento.md`)          |
| `R-AR-9`  | Ciclo de vida de suscripciones → anti-flakiness `R-FL-*` (`../test/05-reglas-robustez.md`)                  |
| `R-AR-11` | Configuración por entorno → secretos en `R-SE-2` (`../security/01-seguridad.md`)                            |
| `R-NC-8`  | Commits → `R-GC-1..7` (`../git/02-commits.md`)                                                              |

## Pendientes

- Estado de cumplimiento y deudas en [`../_meta/AUDIT.md`](../_meta/AUDIT.md)
  (`R-COV-3`).

## API pública entre features

Los consumidores importan contratos por `features/<feature>/public-api.ts`;
componentes presentacionales exportados intencionalmente usan `public-ui.ts` y
solo se comunican por inputs/outputs. No importar archivos internos (`pages/`,
`components/`, `state/`, `models/`) desde otro feature (`R-CX-6`).

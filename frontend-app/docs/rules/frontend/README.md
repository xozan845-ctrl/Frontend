# Reglas de Ingeniería Frontend — frontend-ecomerce

Principios de **ingeniería de la SPA Angular**: arquitectura limpia/hexagonal,
SOLID y responsabilidad única, código compartido, carga diferida, hidratación
incremental, estado con signal store y rendimiento.

## Alcance (para no duplicar)

| Área                                            | De qué es canónica                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`../architecture/`](../architecture/README.md) | Composición del proyecto: feature-first, dirección de dependencias, puertos + DI, adapters y naming                |
| **`frontend/`** (esta)                          | **Ingeniería Angular**: clean/hexagonal, SOLID/SRP, `shared/`, lazy/defer, hidratación, signal store y rendimiento |
| [`../ui/`](../ui/README.md)                     | Presentación: accesibilidad y experiencia/diseño (UX/UI)                                                           |

## Archivos

| Archivo                         | Contenido                                                                                                | Sufijo       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------ |
| `01-arquitectura-limpia.md`     | Clean/Hexagonal en Angular: capas, regla de dependencia, puertos/adaptadores, dominio puro, casos de uso | `R-CX` (1–7) |
| `02-solid-srp.md`               | SOLID y responsabilidad única aplicados a componentes, servicios y stores                                | `R-SO` (1–7) |
| `03-shared.md`                  | Qué va en `shared/` (componentes, utilidades, servicios), reutilización y API estable                    | `R-SH` (1–6) |
| `04-carga-diferida.md`          | Lazy loading de rutas, `@defer`, placeholders, prefetch y preloading                                     | `R-LZ` (1–6) |
| `05-hidratacion-incremental.md` | SSR/SSG e hidratación incremental (`withIncrementalHydration`)                                           | `R-HI` (1–6) |
| `06-estado-signal-store.md`     | NgRx Signals `signalStore`: features, derivados, mutaciones, alcance y persistencia                      | `R-ST` (1–7) |
| `07-rendimiento.md`             | Presupuestos, imágenes, trabajo en plantilla, zoneless y sondeo                                          | `R-PF` (1–7) |

> Los derivados (AUDIT, CHECKLIST, historiales) viven en
> [`../_meta/`](../_meta/README.md).

## Mapa de IDs

| Prefijo  | Rango | Archivo                         | Ámbito                               |
| -------- | ----- | ------------------------------- | ------------------------------------ |
| `R-CX-*` | 1–7   | `01-arquitectura-limpia.md`     | Arquitectura limpia/hexagonal        |
| `R-SO-*` | 1–7   | `02-solid-srp.md`               | SOLID y responsabilidad única        |
| `R-SH-*` | 1–6   | `03-shared.md`                  | Código compartido                    |
| `R-LZ-*` | 1–6   | `04-carga-diferida.md`          | Lazy loading y `@defer`              |
| `R-HI-*` | 1–6   | `05-hidratacion-incremental.md` | SSR e hidratación incremental        |
| `R-ST-*` | 1–7   | `06-estado-signal-store.md`     | NgRx Signal Store                    |
| `R-PF-*` | 1–7   | `07-rendimiento.md`             | Rendimiento (trasladado desde `ui/`) |

## Reglas de otras áreas que exige esta (cross-refs)

| ID       | Exigencia                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `R-CX-2` | Puertos + `InjectionToken` → `R-AR-3` (`../architecture/01-arquitectura.md`)                                      |
| `R-SO-5` | DIP → `R-AR-3` (`../architecture/01-arquitectura.md`)                                                             |
| `R-SH-4` | `shared/` no importa dominios → `R-AR-2` (`../architecture/01-arquitectura.md`)                                   |
| `R-LZ-1` | Rutas lazy → `R-AR-6` (`../architecture/01-arquitectura.md`)                                                      |
| `R-ST-3` | Derivados en `withComputed` → `R-AR-5` (`../architecture/01-arquitectura.md`)                                     |
| `R-PF-1` | Presupuestos de build → gate `G-3` (`../test/06-estandares-cobertura.md`)                                         |
| `R-PF-7` | Zoneless → `computed`/signals, `R-ST-3`                                                                           |
| `R-HI-3` | Acceso a `window`/storage → `R-RB-4` (`../test/05-reglas-robustez.md`) y `R-SE-1` (`../security/01-seguridad.md`) |

## Estado y pendientes

- **SSR/hidratación no existen hoy**: `main.ts` hace `bootstrapApplication` sin
  `@angular/ssr` ni `provideClientHydration`. **ADR-09** decidió **diferir** SSR/SSG
  (no es una migración pendiente): las reglas `R-HI-*` son **condicionales** y solo
  aplican si más adelante se adopta render en servidor (con ADR nuevo, `R-DO-2`).
- **La app es zoneless** (no hay `zone.js`): el render se dispara por signals; ver
  `R-PF-7`.
- Estado de cumplimiento y deudas en [`../_meta/AUDIT.md`](../_meta/AUDIT.md)
  (`R-COV-3`).

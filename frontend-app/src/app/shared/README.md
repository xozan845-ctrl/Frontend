# shared/ — Presentación reutilizable

Componentes, directivas y pipes **presentacionales** reutilizables. No contiene
estado de dominio ni reglas de negocio (`R-SH-1`); puede consumir `core/`, pero
nunca `features/`.

| Carpeta       | Contenido                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| `ui/`         | Componentes visuales: spinner, empty-state, skeleton, lightbox, cart-fly… |
| `directives/` | Directivas de comportamiento: scroll-reveal, focus-trap.                  |
| `pipes/`      | Pipes de presentación: moneda del storefront y montos de caja con ISO.    |

## Reglas

- Un elemento entra en `shared/` cuando tiene **≥ 2 consumidores reales**
  (`R-SH-3`).
- Los componentes se comunican por `input()`/`output()`; no inyectan stores de
  dominio (`R-SO-8`).
- Sin lógica de negocio ni acceso a red.

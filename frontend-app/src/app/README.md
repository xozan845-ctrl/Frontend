# src/app — Aplicación Angular

Organización **feature-first por capas** (ADR-12). La app es una SPA Angular
standalone, lazy por feature y zoneless.

| Capa        | Responsabilidad                                                                                 | README                                       |
| ----------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `core/`     | Infraestructura transversal sin UI: configuración, modelos, servicios, tokens.                  | [`core/README.md`](./core/README.md)         |
| `shared/`   | Presentación y utilidades reutilizables sin reglas de negocio.                                  | [`shared/README.md`](./shared/README.md)     |
| `layout/`   | Chrome de la aplicación: navbar, footer y drawers.                                              | [`layout/README.md`](./layout/README.md)     |
| `features/` | Experiencias (`applications/`), dominios reutilizables (`domains/`) y composición (`modules/`). | [`features/README.md`](./features/README.md) |

## Composición

- `app.config.ts` — providers globales, DI de puertos y configuración.
- `app.routes.ts` — rutas raíz; compone los `<feature>.routes.ts`.
- `app.component.ts` — componente raíz standalone.

## Dirección de dependencias

`features/pages|components → state → services → repositories/adapters → models`.
`core/` y `shared/` no importan `features/`; un feature consume a otro solo por
su API pública (`public-api.ts` / `public-ui.ts`). Ver
[`../docs/rules/architecture/01-arquitectura.md`](../../docs/rules/architecture/01-arquitectura.md).

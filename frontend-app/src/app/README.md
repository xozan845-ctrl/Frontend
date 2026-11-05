# src/app — Aplicación Angular

Organización **feature-first por capas** (ADR-12). La app es una SPA Angular
standalone, lazy por feature y zoneless.

| Capa        | Responsabilidad                                                                                 | README                                       |
| ----------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `core/`     | Infraestructura transversal sin UI: configuración, modelos, servicios, tokens.                  | [`core/README.md`](./core/README.md)         |
| `shared/`   | Presentación y utilidades reutilizables sin reglas de negocio.                                  | [`shared/README.md`](./shared/README.md)     |
| `layout/`   | Chrome de la aplicación: header, footer y drawers.                                              | [`layout/README.md`](./layout/README.md)     |
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

## Sistema visual Glass

`src/styles.css` centraliza el lenguaje visual global:

- Tokens `--glass-*` para superficies, bordes, blur, radios y sombras en claro
  y oscuro.
- Utilidades `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-hover`,
  `.glass-card`, `.glass-bar` y `.glass-footer`.
- Primitivos globales `.card`, `.btn-*`, `.input`, `.badge`, `.alert-*` e
  `.icon-btn` heredan el estilo de cristal, por lo que las pantallas existentes
  lo adoptan sin duplicar clases.
- Fondos ambientales con gradientes/orbes y fallback para navegadores sin
  `backdrop-filter`.

La regla `R-UX-7` y la suite `visual-guards` verifican que este sea el único
punto de definición: no redefinas tokens, utilidades ni primitivos en los
estilos de componentes.

### Reglas de uso

- Usa `.glass*`, `.card`, `.btn-*`, `.input`, `.badge` o `.icon-btn`; no
  reimplementes `backdrop-blur` + fondos translúcidos en plantillas.
- Los scrims de modales, controles de baja opacidad y etiquetas sobre imagen
  están permitidos (allowlist de `R-UX-7`).
- Los shells de página usan `app-page-bg`/`app-shell-bg`; no reintroduzcas
  fondos planos.
- La suite falla si aparece una reimplementación nueva; `stylelint`
  (`glass/no-raw-glass`) y la regresión visual de Playwright cubren el mismo
  sistema en editor y CI.

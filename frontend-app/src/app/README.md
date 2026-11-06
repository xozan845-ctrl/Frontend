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

## Workspace unificado

El backoffice tiene una entrada canónica `/app` que resuelve el contexto por la
sesión (`workspaceLanding`):

- `/app/empresa` — workspace de empresa (`empresario`).
- `/app/tienda` — workspace de tienda (`vendedor`).
- `/app/admin` — plataforma (`admin`/`super_admin`).
- `/app/logistica` — logística (empresa, tienda o empresa logística).

Facturación es un submódulo de tienda (`/app/tienda/facturacion`) y comparte el
sidebar/guard del workspace; `/ia` es una herramienta independiente. Solo
existen las rutas canónicas `/app/...`.

Todos comparten `WorkspaceShellComponent` y el registro `WORKSPACE_MODULES`;
el sidebar y los guards filtran por `workspace` + `permission`, no por rutas
duplicadas. Los módulos comerciales compartidos (clientes, bancos, cuentas por
pagar, códigos de barras, créditos y reportes) se montan desde
`features/applications/workspace/constants/commercial.routes.ts` con providers
de scope company/store.

## Sistema visual Glass

`src/styles.css` centraliza el lenguaje visual global:

- Tokens `--glass-*` para superficies, bordes, blur, radios y sombras en claro
  y oscuro.
- Utilidades `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-hover`,
  `.glass-card`, `.glass-bar`, `.glass-footer`, `.glass-drawer` y
  `.glass-dashed`.
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
- Los workspaces de backoffice (`/app/empresa`, `/app/tienda`,
  `/app/admin`, `/app/logistica`, `/ia`) se envuelven en un shell con
  `app-shell-bg` + `glass-bar`; el feature de IA lo hace con
  `ai-scraper-shell`.
- La suite falla si aparece una reimplementación nueva; `stylelint`
  (`glass/no-raw-glass`) y la regresión visual de Playwright cubren el mismo
  sistema en editor y CI.
- `R-UX-8` exige que toda superficie principal use Glass o un primitivo. Todas
  las raíces de presentación de `src/app` están en `GLASS_ADOPTION_ADOPTED`
  (**37 raíces**) y `GLASS_ADOPTION_PENDING_MAX` es **0**; cualquier superficie
  nueva debe nacer con Glass y no puede reabrir el backlog.
- Los controles de acción usan `.btn-*` o `.icon-btn`; los rellenos crudos
  (`bg-accent-600`, `bg-blue-600`, etc.) también hacen fallar `R-UX-8`. Los
  tabs/chips con `role` o `aria-pressed` se validan como estado, no como CTA.

## PWA y actualizaciones

- `app/pwa-notice` es el aviso flotante reutilizable: instalación y
  actualización comparten el mismo componente.
- `public/pwa-install-capture.js` captura `beforeinstallprompt` antes de que
  arranque Angular; evita perder el prompt si el navegador lo emite temprano.
- El descarte de instalación se guarda por versión
  (`ecom_pwa_dismissed_version`), no para siempre.
- `AppUpdateService` escucha `SwUpdate.versionUpdates`; al recibir
  `VERSION_READY` consulta `version.json` y muestra `v{version} · Refrescar`.
- `public/version.json` se genera en `prebuild`/`prestart` y está ignorado por
  Git. Incluye la versión de `package.json` (o `APP_VERSION` en CI, p. ej.
  `1.26.0+123`) y los cambios `feat/fix/perf/refactor` desde el último tag;
  **el modal no se edita a mano**.
- Para publicar una versión nueva: `npm run patch` (o `minor`/`major`) y
  desplegar. El prebuild actualiza versión y novedades automáticamente. En CI,
  el workflow `deploy-firebase.yml` despliega en cada push a `main` después de
  ejecutar los gates.
- El hover/foco del aviso muestra las novedades y explica que los datos y la
  sesión siguen seguros y que hay que refrescar para aplicar los cambios
  visuales. El refresh activa la versión y recarga.

# 03 — Experiencia y diseño

Aplica a: estados de la interfaz, adaptación responsive, tema, tokens de diseño
y metadatos.

| ID     | Regla                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-UX-1 | **Estados explícitos**: toda vista que depende de datos remotos define sus estados de **carga** (`skeleton`/`spinner`), **error** (mensaje + reintento) y **vacío** (`empty-state`). Prohibido mostrar una vista en blanco mientras carga o falla.                                                                                                                                                                                             |
| R-UX-2 | **Responsive mobile-first**: el diseño se construye con breakpoints de Tailwind de menor a mayor; sin scroll horizontal en móvil.                                                                                                                                                                                                                                                                                                              |
| R-UX-3 | **Tema claro/oscuro**: el tema se controla con la clase `dark` en `<html>`, persiste en `localStorage` y se aplica antes del bootstrap (`main.ts`) para evitar FOUC.                                                                                                                                                                                                                                                                           |
| R-UX-4 | **Mensajes en español y sin jerga técnica**: los textos al usuario no exponen códigos de error, nombres de campo del backend ni stack traces.                                                                                                                                                                                                                                                                                                  |
| R-UX-5 | **Tokens de diseño**: colores (`surface`, `accent`), tipografías y animaciones se declaran en `tailwind.config.js`. Prohibido introducir colores arbitrarios fuera de la paleta sin justificación en el PR.                                                                                                                                                                                                                                    |
| R-UX-6 | **SEO y metadatos**: cada página actualiza título y meta descripción con `SeoService` y se restauran al salir; el detalle de producto define además `og:title`/`og:description`/`og:type`.                                                                                                                                                                                                                                                     |
| R-UX-7 | **Sistema visual Glass centralizado**: los tokens `--glass-*`, las utilidades `.glass*` y los primitivos `.card`, `.btn-*`, `.input`, `.badge`, `.alert-*` e `.icon-btn` se definen únicamente en `src/styles.css`, junto con los fondos ambientales y el fallback `@supports not (backdrop-filter: ...)`. Prohibido redefinir tokens/utilidades Glass, duplicar primitivos o usar `backdrop-filter` con valores crudos fuera de `styles.css`. |

## Sistema visual Glass (R-UX-7)

`src/styles.css` es la única fuente de verdad:

- Tokens `--glass-*` en `:root` y `.dark` (paridad derivada).
- Utilidades `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-hover`,
  `.glass-card`, `.glass-bar` y `.glass-footer`.
- Primitivos `.card`, `.btn`, `.input`, `.badge`, `.alert` e `.icon-btn`.
- Fondos ambientales `app-page-bg`/`app-shell-bg` y fallback
  `@supports not (backdrop-filter: ...)`.

La suite `visual-guards` (`scripts/rules/ui/visual.test.mjs`) verifica:

1. Tokens, utilidades y primitivos.
2. Paridad de tokens claro/oscuro.
3. Fallback derivado de todos los selectores con `backdrop-filter`.
4. Ausencia de reimplementaciones en CSS, `@apply`, `style` inline,
   SCSS/SASS/LESS y plantillas.
5. Shells de página con fondo ambiental.
6. Stylelint (`glass/no-raw-glass`) cableado en CI.
7. Regresión visual Playwright en claro, oscuro y fallback sin `backdrop-filter`.

**Cobertura:** `GLASS_MIN_COVERAGE = 100` en `scripts/config/project.mjs`. La
cobertura se calcula sobre hallazgos reales: cada requisito debe estar cubierto
por un check y sin incumplimientos.

**Excepciones permitidas (allowlist):**

- `overlay-scrim` — scrims de modales: `fixed|absolute inset-0` sin fondo claro.
- `low-opacity` — controles de baja opacidad: `bg-white/5`, `bg-white/10`,
  `bg-white/20`.
- `dark-label` — etiquetas sobre imagen: `bg-black/*` + `text-white`.
- Controles con estado dinámico que alternan el fondo por binding
  (`[class.bg-*]`); si añaden un fondo claro estático, deben usar el sistema.

Cualquier otra superficie de cristal debe usar `.glass*` o un primitivo.

## Notas

- `R-UX-1` está implementado en `products` (`skeleton-loader`, `empty-state`) y
  debe replicarse en toda vista nueva que consuma API.
- La app incluye banner PWA (`pwa-install-banner`), manifiesto y service worker
  real, cumpliendo `R-UX-6`.
- El sistema Glass se documenta también en
  [`src/app/README.md`](../../../src/app/README.md#sistema-visual-glass).

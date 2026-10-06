# 03 — Experiencia y diseño

Aplica a: estados de la interfaz, adaptación responsive, tema, tokens de diseño
y metadatos.

| ID     | Regla                                                                                                                                                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-UX-1 | **Estados explícitos**: toda vista que depende de datos remotos define sus estados de **carga** (`skeleton`/`spinner`), **error** (mensaje + reintento) y **vacío** (`empty-state`). Prohibido mostrar una vista en blanco mientras carga o falla. |
| R-UX-2 | **Responsive mobile-first**: el diseño se construye con breakpoints de Tailwind de menor a mayor; sin scroll horizontal en móvil.                                                                                                                  |
| R-UX-3 | **Tema claro/oscuro**: el tema se controla con la clase `dark` en `<html>`, persiste en `localStorage` y se aplica antes del bootstrap (`main.ts`) para evitar FOUC.                                                                               |
| R-UX-4 | **Mensajes en español y sin jerga técnica**: los textos al usuario no exponen códigos de error, nombres de campo del backend ni stack traces.                                                                                                      |
| R-UX-5 | **Tokens de diseño**: colores (`surface`, `accent`), tipografías y animaciones se declaran en `tailwind.config.js`. Prohibido introducir colores arbitrarios fuera de la paleta sin justificación en el PR.                                        |
| R-UX-6 | **SEO y metadatos**: cada página actualiza título y meta descripción con `SeoService` y se restauran al salir; el detalle de producto define además `og:title`/`og:description`/`og:type`.                                                         |

## Notas

- `R-UX-1` está implementado en `products` (`skeleton-loader`, `empty-state`) y
  debe replicarse en toda vista nueva que consuma API.
- La app incluye banner PWA (`pwa-install-banner`); publicar un manifiesto y
  service worker real es deuda de `R-UX-6` registrada en AUDIT.

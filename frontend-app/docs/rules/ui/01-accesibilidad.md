# 01 — Accesibilidad

Aplica a: todos los componentes y plantillas de la aplicación.

| ID     | Regla                                                                                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-AC-1 | **Nombre accesible en todo control**: botones, enlaces e inputs tienen texto visible o `aria-label`/`aria-labelledby`. Un icono sin texto exige `aria-label`.                                         |
| R-AC-2 | **Navegación por teclado**: todo control es alcanzable y accionable con teclado, en orden lógico, con foco visible (`focus-visible`/`:focus-visible`); prohibido eliminar el outline sin sustituirlo. |
| R-AC-3 | **Diálogos y modales**: usan `role="dialog"` + `aria-modal="true"`, un nombre accesible, cierran con `Escape`, atrapan el foco mientras están abiertos y lo devuelven al disparador al cerrar.        |
| R-AC-4 | **Imágenes**: informativas con `alt` descriptivo; decorativas con `alt=""`. Prohibido dejar `alt` ausente.                                                                                            |
| R-AC-5 | **Contraste**: el texto y los controles cumplen contraste AA (4.5:1 texto normal, 3:1 texto grande) tanto en tema claro como oscuro.                                                                  |
| R-AC-6 | **Movimiento**: respetar `prefers-reduced-motion` (desactivar o reducir animaciones no esenciales).                                                                                                   |
| R-AC-7 | **Contenido dinámico**: los avisos (toasts) y cambios relevantes de estado se anuncian con región viva (`role="status"`/`aria-live`) o foco gestionado.                                               |

## Notas

- Base actual: `star-rating`, `quick-view-modal`, `cart-sidebar`, `navbar`,
  `search-autocomplete` y `pwa-install-banner` ya declaran `aria-label`/`role`
  (evidencia en `AUDIT.md`); el resto se alinea en cada PR que toque la vista.
- Los selectores de prueba (`R-CP-2`) usan `data-testid`, no clases Tailwind, para
  no acoplarse a la capa visual.

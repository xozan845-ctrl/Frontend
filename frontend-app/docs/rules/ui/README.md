# Reglas de UI — frontend-ecomerce

Reglas de la capa de presentación: **accesibilidad** y **experiencia (UX/UI)**
(estados, responsive, tema y tokens de diseño). Complementan a
`architecture/` y `frontend/`.

> El **rendimiento** (`R-PF-*`) se trasladó al área de ingeniería:
> [`../frontend/07-rendimiento.md`](../frontend/07-rendimiento.md). Aquí quedan
> las reglas visuales/de interacción.

## Archivos

| Archivo               | Contenido                                                                  | Sufijo       |
| --------------------- | -------------------------------------------------------------------------- | ------------ |
| `01-accesibilidad.md` | Nombre accesible, teclado, foco, imágenes, diálogos, contraste, movimiento | `R-AC` (1–7) |
| `02-experiencia.md`   | Estados de carga/error/vacío, responsive, dark mode, tokens, SEO/PWA       | `R-UX` (1–6) |

> Los derivados (AUDIT, CHECKLIST, historiales) viven en
> [`../_meta/`](../_meta/README.md).

## Mapa de IDs

| Prefijo  | Rango | Archivo                                                          | Ámbito                        |
| -------- | ----- | ---------------------------------------------------------------- | ----------------------------- |
| `R-AC-*` | 1–7   | `01-accesibilidad.md`                                            | Accesibilidad (a11y)          |
| `R-UX-*` | 1–6   | `02-experiencia.md`                                              | Experiencia, diseño y SEO/PWA |
| `R-PF-*` | 1–7   | [`../frontend/07-rendimiento.md`](../frontend/07-rendimiento.md) | Rendimiento (trasladado)      |

## Reglas de otras áreas que exige esta (cross-refs)

| ID       | Exigencia                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------- |
| `R-UX-5` | Tokens de diseño en `tailwind.config.js` → naming de configuración `R-NC-6`                              |
| `R-UX-1` | Estados de carga/error/vacío → cubiertos por tests `R-CP-6` (`../test/02-reglas-componentes.md`)         |
| `R-AC-*` | Los selectores de prueba de `R-CP-2` (`../test/02-reglas-componentes.md`) no dependen de clases visuales |
| `R-PF-*` | Rendimiento → [`../frontend/07-rendimiento.md`](../frontend/07-rendimiento.md)                           |

## Pendientes

- Pendiente de auditar: entra en la próxima revisión (`R-COV-3`).

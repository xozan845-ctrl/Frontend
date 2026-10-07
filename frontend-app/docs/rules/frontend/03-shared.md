# 03 — Código compartido (`shared/`)

Aplica a: qué se coloca en `src/app/shared/` y cómo se mantiene reutilizable,
genérico y sin acoplarse a los dominios.

| ID     | Regla                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-SH-1 | **Qué vive en `shared/`**: componentes **presentacionales** reutilizables (`ui/`), directivas, pipes, constantes y utilidades puras. Los servicios de aplicación sin UI (SEO, notificación, configuración) viven en `core/`, no en `shared/` (`R-AR-13`). |
| R-SH-2 | **Qué NO vive en `shared/`**: lógica de negocio, estado de un feature, DTOs/adapters de un feature o reglas específicas del e-commerce. Eso pertenece a `features/<feature>/`.                                                                            |
| R-SH-3 | **Regla de promoción (≥ 2 consumidores)**: una pieza sube a `shared/` (o `core/`) cuando la usan **dos o más features** o es claramente transversal. Prohibido crear "shared por si acaso": si solo lo usa un feature, vive en el feature.                |
| R-SH-4 | **Sin dependencias hacia features**: `shared/` no importa de `features/` (`R-AR-2`); puede depender de `core/`. Un componente compartido recibe lo que necesita por `input`; no consulta un store de feature.                                             |
| R-SH-5 | **API pública estable**: los cambios de firma/selector/comportamiento de una pieza compartida son cambios de contrato: el PR actualiza **todos** sus consumidores y, si aplica, sus tests.                                                                |
| R-SH-6 | **Responsabilidad única y agrupación por propósito**: cada componente/utilidad hace una cosa; las utilidades se agrupan por propósito (`core/models/api-response.dto.ts`), no en un `helpers.ts` cajón de sastre (`R-SO-1`).                              |

## Notas

- Piezas actuales correctas: `shared/ui/*` (presentacionales),
  `shared/directives/*`; los servicios transversales (`seo`, `store-config`,
  `notification`) y los helpers genéricos (`api-response.dto.ts`) viven en
  `core/` (`R-AR-13`).
- La pieza de buscador vive en `features/products/components/` y consume su
  propio store: `shared/` no tiene dependencias hacia `features/`.

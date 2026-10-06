# 03 — Código compartido (`shared/`)

Aplica a: qué se coloca en `src/app/shared/` y cómo se mantiene reutilizable,
genérico y sin acoplarse a los dominios.

| ID     | Regla                                                                                                                                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-SH-1 | **Qué vive en `shared/`**: componentes **presentacionales** reutilizables (`ui/`), directivas, pipes, utilidades puras, servicios transversales (SEO, notificación, configuración) y tipos genéricos (helpers de respuesta de API). |
| R-SH-2 | **Qué NO vive en `shared/`**: lógica de negocio, estado de un dominio, DTOs/adapters de un feature o reglas específicas del e-commerce. Eso pertenece a `domains/<feature>/`.                                                       |
| R-SH-3 | **Regla de promoción (≥ 2 consumidores)**: una pieza sube a `shared/` cuando la usan **dos o más dominios** o es claramente transversal. Prohibido crear "shared por si acaso": si solo lo usa un dominio, vive en el dominio.      |
| R-SH-4 | **Sin dependencias hacia dominios**: `shared/` no importa de `domains/` (`R-AR-2`). Un componente compartido recibe lo que necesita por `input`; no consulta un store de feature.                                                   |
| R-SH-5 | **API pública estable**: los cambios de firma/selector/comportamiento de una pieza compartida son cambios de contrato: el PR actualiza **todos** sus consumidores y, si aplica, sus tests.                                          |
| R-SH-6 | **Responsabilidad única y agrupación por propósito**: cada componente/utilidad hace una cosa; las utilidades se agrupan por propósito (`shared/models/api-response.dto.ts`), no en un `helpers.ts` cajón de sastre (`R-SO-1`).      |

## Notas

- Piezas actuales correctas: `shared/ui/*` (presentacionales), `shared/services/seo.service.ts`,
  `shared/utils/{guards,interceptors}`, `shared/models/api-response.dto.ts`.
- Deuda conocida: `shared/ui/search-autocomplete` importa `ProductStore` de
  `domains/products`, violando `R-SH-4` (registrado en AUDIT). Debe moverse al
  dominio o recibir los datos por `input`.

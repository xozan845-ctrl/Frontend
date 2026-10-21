# core/ — Infraestructura transversal

Contiene infraestructura sin UI ni reglas de negocio (`R-AR-13`). No importa
`features/` ni `shared/`.

| Carpeta      | Contenido                                                              |
| ------------ | ---------------------------------------------------------------------- |
| `config/`    | Configuración pública: API, moneda y flags.                            |
| `constants/` | Constantes de marca y datos corporativos.                              |
| `models/`    | Tipos genéricos: respuestas de API, errores, notificaciones, SEO.      |
| `services/`  | Servicios de aplicación sin UI: SEO, configuración de tienda y avisos. |

## Servicios principales

- `services/seo/` — título, meta, canonical, Open Graph/Twitter y JSON-LD;
  helpers `injectSeoPage`/`injectSeoCleanup` para el ciclo de vida (`R-UX-6`,
  `R-AR-15`).
- `services/store-config/` — configuración y datos de la tienda activa.
- `services/notification.service.ts` — avisos de éxito, error e información.

## Reglas

- Sin componentes ni plantillas.
- Sin lógica de un dominio concreto: eso vive en `features/<feature>/`.
- La configuración se consume por tokens (`R-AR-3`) y nunca se hardcodea
  (`R-AR-11`).

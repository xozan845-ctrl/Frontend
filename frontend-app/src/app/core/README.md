# core/ — Infraestructura transversal

Contiene infraestructura sin UI ni reglas de negocio (`R-AR-13`). No importa
`features/` ni `shared/`.

| Carpeta      | Contenido                                                                      |
| ------------ | ------------------------------------------------------------------------------ |
| `config/`    | Configuración pública: API, moneda, flags e identidad del storefront (F30).    |
| `constants/` | Constantes neutras y contratos de identidad corporativa.                       |
| `models/`    | Tipos genéricos: respuestas de API, errores, notificaciones, SEO y storefront. |
| `services/`  | Servicios de aplicación sin UI: SEO, configuración de tienda y avisos.         |

## Servicios principales

- `services/seo/` — título, meta, canonical, Open Graph/Twitter y JSON-LD; toma
  nombre, descripción y moneda del contexto activo y ofrece los helpers
  `injectSeoPage`/`injectSeoCleanup` para el ciclo de vida (`R-UX-6`, `R-AR-15`).
- `services/store-config/` — configuración y datos públicos de la tienda activa.
- `services/branding/` — favicon reactivo de la pestaña según la empresa o
  tienda activa; restaura el icono de la plataforma al salir del workspace.
- `services/notification.service.ts` — avisos de éxito, error e información.

## Identidad pública del storefront (F30)

La decisión arquitectónica se registró en
[ADR-86: identidad pública por contexto y configuración](../../../docs/decisiones.md#adr-86-identidad-pública-por-contexto-y-configuración).

### Responsabilidades

- `config/runtime-config.model.ts` define `RuntimeConfig` con `storefront` y
  `storefronts?: Record<string, Partial<CompanyInfo>>`.
- `config/runtime-config.service.ts` expone `loaded` y
  `storefrontFor(storeId?)`; lee `config.json` solo en producción real.
- `models/company.model.ts` define `CompanyInfo` y las piezas opcionales
  `support`, `policies`, `benefits`, `newsletter` y `socials`.
- `constants/company.constants.ts` exporta `COMPANY_INFO` y
  `createNeutralCompanyInfo()`: identidad sin marca, contacto, redes ni
  promesas, con copias frescas de los objetos anidados.
- `services/store-config/store-config.service.ts` mantiene el contexto activo y
  publica `companyInfo`, `contextId`, `currency`, `support`, `policies` y
  `benefits` como signals derivados.

### Contrato en `config.json`

```json
{
  "storefront": {
    "name": "Operador de ejemplo"
  },
  "storefronts": {
    "tienda-a": {
      "name": "Tienda A",
      "currency": { "code": "USD", "locale": "en-US" },
      "support": { "email": "soporte@a.example" },
      "socials": { "instagram": "https://www.instagram.com/tienda_ejemplo/" }
    },
    "tienda-b": {
      "name": "Tienda B"
    }
  }
}
```

`storefront` es la configuración del operador. `storefronts[storeId]` es la
ficha pública de cada tienda. La precedencia es exacta:

1. Si `storefronts[storeId]` existe, se usa **completa**; no se fusiona con
   `storefront`. Un objeto `{}` por tienda impide heredar los campos del
   operador.
2. Si la tienda no tiene entrada propia, se usa `storefront` por diseño actual.
3. La ficha pública `GET /tiendas/:storeId` del API no aporta contacto, redes,
   moneda ni beneficios; `App` solo toma de ella `name` y `description` cuando
   `store.id === storeId`.

En el ejemplo, al pasar de `tienda-a` a `tienda-b` no quedan el correo, las
redes ni la moneda USD de A. B usa su propio nombre y el fallback monetario del
proyecto; si B no tuviera entrada, sí heredará la configuración del operador.

### Ciclo del contexto

- `setContext(contextId, config)` y `updateConfig(config)` **reemplazan** el
  contexto: un partial nunca se mezcla con la tienda anterior.
- `clear()` vuelve al estado neutro y deja `contextId` en `null`.
- El estado neutro elimina marca, contacto, redes y promesas, pero **conserva**
  el fallback monetario existente `CURRENCY = { code: 'NIO', locale: 'es-NI' }`.
  No significa ausencia total de valores predeterminados.
- `App` coordina el contexto con `ProductStore.storeId()`: sin `storeId` llama a
  `clear()`; con `storeId` ignora la ficha cargada si su `id` no coincide con el
  activo, para no filtrar la identidad anterior mientras cambia de tienda. El
  chrome público recibe la configuración por `input` (`R-SH-4`).

### Normalización y visibilidad

Todos los campos de `CompanyInfo` son opcionales y se normalizan al cargar:

- Los textos vacíos o solo espacios se descartan; los no vacíos se recortan.
- `policies` requiere `label` y `url`; `benefits` requiere `icon` y `title`.
- `newsletter` se conserva solo si tiene `title` o `description`.
- `support` se publica si tiene al menos un campo; sin embargo, el widget
  flotante solo aparece con `support.email` o `support.whatsappPhone`
  explícitos. Un `phone` o `email` genérico no activa el canal.
- El normalizador no valida sintaxis de URLs ni de correos: solo comprueba que
  el texto exista. Los enlaces se presentan tal como los confirma el operador.
- Redes, beneficios, políticas, newsletter y canales no confirmados se ocultan
  en el storefront en lugar de mostrar valores de plantilla.

### Configuración runtime y entornos

`RuntimeConfigService.load()` se registra en el arranque de la aplicación. Solo
descarga `config.json` en un build de producción con `dataSource !== 'mock'`;
en desarrollo y en las suites E2E/mock mandan `src/environments/` y las
fixtures de Playwright (`ADR-13`, `R-E-12`). El timeout es de **5000 ms** y
cualquier error (archivo ausente, red o timeout) cae silenciosamente a la
configuración de `src/environments/` sin colgar el arranque. No se promete la
carga de overrides en todos los entornos.

## Reglas

- Sin componentes ni plantillas.
- Sin lógica de un dominio concreto: eso vive en `features/<grupo>/<feature>/`.
- La configuración se consume por tokens (`R-AR-3`) y nunca se hardcodea
  (`R-AR-11`).
- La identidad pública se entrega a presentación por `input`; `core/` no crea
  dependencias hacia `features/` ni hacia un negocio concreto (`R-SH-4`,
  `R-AR-2`).

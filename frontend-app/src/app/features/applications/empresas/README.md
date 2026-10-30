# empresas/ — Gestión de empresas

Dominio del **tenant comercial** (Core Engine, `/api/v1/empresas`): alta de la
empresa, metadatos comerciales/fiscales, slug público, tipo de empresa,
modalidad logística, tiendas e invitaciones de vendedores.

| Capa            | Responsabilidad                                                          |
| --------------- | ------------------------------------------------------------------------ |
| `models/`       | `Company`, `CompanyProfileData`, `CompanySeller`, tiendas y payloads.    |
| `adapters/`     | Normalización de empresa, tiendas, vendedores e invitaciones (R-AR-4).   |
| `repositories/` | Puertos `COMPANY_REPOSITORY` y `COMPANY_INVITATION_REPOSITORY`.          |
| `services/`     | HTTP contra `/empresas` e invitaciones y traducción de errores (R-AR-9). |
| `state/`        | Empresa, portal consolidado, ventas, servicios e invitaciones.           |
| `pages/`        | Configuración, vendedores, invitación y tiendas.                         |

## Metadatos de empresa

`CompanyService` usa el contrato público de identity-service:

- `POST /empresas` acepta `slug`, `tipo_empresa` (por defecto `comercial`) y
  los metadatos del perfil desde el alta. El onboarding `/crear-empresa` y el
  formulario de configuración envían el tipo elegido.
- `PATCH /empresas/:id/perfil` actualiza razón social, RUC, contacto, ubicación,
  moneda, zona horaria, sector y `logo_objeto_id` (UUID de storage).
- `PATCH /empresas/:id/slug` cambia el identificador público; los slugs
  anteriores responden `301` hacia el actual.
- `PATCH /empresas/:id/tipo` clasifica la empresa como `comercial`,
  `logistica` o `plataforma` (ADR-27).
- `GET /empresas/:id` acepta UUID o slug actual/anterior.

### Logo

El logo no se sube a identity-service. `CompanyLogoStore` ejecuta el flujo de
storage-service y luego asocia el objeto confirmado:

1. `POST /storage/subidas` para obtener la URL prefirmada.
2. `PUT` del archivo a `url_subida`.
3. `POST /storage/objetos/{id}/confirmar`.
4. `PATCH /empresas/{id}/perfil` con `logo_objeto_id`.

La UI muestra `logo_url` de la empresa o, si falta, el fallback
`/storage/public/objetos/{id}`. La página de configuración provee el puerto de
storage en su propio scope para no arrastrar esa infraestructura al bundle
inicial.

### Branding de pestaña

`CompanyShell` carga la empresa activa y aplica su logo al favicon mediante
`BrandingService`; al salir restaura el icono de la plataforma. La página de
configuración también actualiza el título con el nombre de la empresa. El shell
del vendedor hace lo propio con la tienda (`logo_url` o `companyLogoUrl` como
fallback) en cuanto `VendorStoreStore` la carga.

La carga de imágenes usa el componente reutilizable
`shared/ui/image-dropzone`, que valida tipo/tamaño, admite arrastrar y soltar y
solo entrega el `File` al consumidor.

`company-settings` concentra la edición del perfil, la identidad pública y la
logística; el adapter tolera respuestas planas o con envelope `{ data }` y
`null` en los campos de logo.

## Decisión

La página y los modales de **Ventas** se componen en
`features/modules/sales` (ADR-63); el catálogo administrable de productos,
servicios y materia prima se compone en `features/modules/catalog` (ADR-65),
Compras en `features/modules/finance` (ADR-66), Gastos en
`features/modules/expenses` (ADR-72) y Caja en `features/modules/cash`
(ADR-73). Cuentas por pagar
en `features/modules/payables` (ADR-67), Bancos en `features/modules/banks`
(ADR-68), Códigos de barras en `features/modules/barcodes` (ADR-69), Créditos
en `features/modules/credits` (ADR-70) y Reportes en
`features/modules/reports` (ADR-71). Este feature conserva sus stores, dominio,
adaptadores y constantes. `public-api.ts` expone esos artefactos y ya no
exporta `EMPRESAS_ROUTES`, para que el módulo pueda consumirlos sin ciclos.

La empresa es la unidad que agrupa tiendas, vendedores y logística de empresa.
Crear la empresa cambia el `tenant_id`/rol del usuario en el backend, así que el
store **renueva la sesión** después del alta para que el JWT lleve el tenant
(ADR-27). El empresario genera invitaciones desde `/empresa/vendedores`; el
backend devuelve una URL corta de un solo uso (`/i/<token>`) y el invitado
completa su cuenta en una landing de bienvenida. El enlace histórico
`/registro/vendedor?token=...` sigue funcionando. Cada vendedor se asigna a una
única tienda.

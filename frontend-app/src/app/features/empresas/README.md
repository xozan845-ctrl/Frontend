# empresas/ — Gestión de empresas

Dominio del **tenant comercial** (Core Engine, `/api/v1/empresas`): alta de la
empresa, consulta, modalidad logística, tiendas e invitaciones de vendedores.

| Capa            | Responsabilidad                                                          |
| --------------- | ------------------------------------------------------------------------ |
| `models/`       | `Company`, `CompanySeller`, tiendas asignadas y payloads de alta.        |
| `adapters/`     | Normalización de empresa, tiendas, vendedores e invitaciones (R-AR-4).   |
| `repositories/` | Puertos `COMPANY_REPOSITORY` y `COMPANY_INVITATION_REPOSITORY`.          |
| `services/`     | HTTP contra `/empresas` e invitaciones y traducción de errores (R-AR-9). |
| `state/`        | Empresa, portal consolidado, ventas, servicios e invitaciones.           |
| `pages/`        | Configuración, ventas, vendedores, invitación, tiendas y productos.      |

## Decisión

La empresa es la unidad que agrupa tiendas, vendedores y logística de empresa.
Crear la empresa cambia el `tenant_id`/rol del usuario en el backend, así que el
store **renueva la sesión** después del alta para que el JWT lleve el tenant
(ADR-27). El empresario genera invitaciones desde `/empresa/vendedores`; el
backend devuelve una URL corta de un solo uso (`/i/<token>`) y el invitado
completa su cuenta en una landing de bienvenida. El enlace histórico
`/registro/vendedor?token=...` sigue funcionando. Cada vendedor se asigna a una
única tienda.

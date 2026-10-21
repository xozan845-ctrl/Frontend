# empresas/ — Gestión de empresas

Dominio del **tenant comercial** (Core Engine, `/api/v1/empresas`): alta de la
empresa, consulta, modalidad logística y creación de vendedores con su
participación.

| Capa            | Responsabilidad                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| `models/`       | `Company`, `CompanySeller` y payloads de alta.                               |
| `adapters/`     | Normalización de `EmpresaResponseDto`/`VendedorEmpresaResponseDto` (R-AR-4). |
| `repositories/` | Puerto `COMPANY_REPOSITORY`.                                                 |
| `services/`     | HTTP contra `/empresas` y traducción de errores (R-AR-9).                    |
| `state/`        | `CompanyStore`: empresa activa, vendedores de la sesión y mutaciones.        |
| `pages/`        | `company-settings`: alta, logística y vendedores desde el panel.             |

## Decisión

La empresa es la unidad que agrupa tienda, vendedores y envíos. Crear la
empresa cambia el `tenant_id`/rol del usuario en el backend, así que el store
**renueva la sesión** después del alta para que el JWT lleve el tenant (ADR-27).

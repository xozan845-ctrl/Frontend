# cash/ — Dominio de caja

Ledger local de caja del workspace de empresa, separado del store de finanzas
para que Compras y Gastos sigan evolucionando sin mezclar contratos.

| Capa         | Responsabilidad                                                      |
| ------------ | -------------------------------------------------------------------- |
| `models/`    | Movimiento, filtros, payload, cuentas, resumen y vistas derivadas.   |
| `constants/` | Tipos, categorías, métodos de pago, estados, período, tabs y claves. |
| `adapters/`  | Saneamiento/migración, alta, edición, filtros, KPIs y agrupaciones.  |
| `state/`     | `CashStore` con CRUD, filtros, tabs, paginación y persistencia.      |

Migra los movimientos del store anterior (`ecom_company_cash_*`) a
`ecom_company_cash_ledger_*` la primera vez. La composición vive en
`features/modules/cash` (ADR-73).

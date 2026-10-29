# cash/ — Dominio de caja

Ledger local de caja del workspace de empresa, separado del store de finanzas
para que Compras y Gastos sigan evolucionando sin mezclar contratos.

| Capa         | Responsabilidad                                                         |
| ------------ | ----------------------------------------------------------------------- |
| `models/`    | Movimiento con origen, filtros, payload, cuentas, resumen y vistas.     |
| `constants/` | Tipos, categorías, orígenes, métodos, estados, períodos, tabs y claves. |
| `adapters/`  | Saneamiento/migración, alta, edición, filtros, KPIs y agrupaciones.     |
| `state/`     | `CashStore` con CRUD, filtros, tabs, paginación y persistencia.         |

Migra los movimientos del store anterior (`ecom_company_cash_*`) a
`ecom_company_cash_ledger_*` la primera vez. Los montos se presentan con el
código ISO (`cashMoney`). La composición vive en `features/modules/cash`
(ADR-73/74).

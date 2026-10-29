# expenses/ — Dominio de gastos

Ledger local de gastos del workspace de empresa, separado del store de finanzas
para que Compras y Caja sigan evolucionando sin mezclar contratos.

| Capa         | Responsabilidad                                                 |
| ------------ | --------------------------------------------------------------- |
| `models/`    | Gasto, filtros, payload, tipos/estados y resumen.               |
| `constants/` | Categorías, tipos, estados, formas de pago y claves de storage. |
| `adapters/`  | Saneamiento/migración, alta, edición, filtros y totales.        |
| `state/`     | `ExpensesStore` con CRUD, filtros, paginación y persistencia.   |

Migra los gastos del store anterior (`ecom_company_expenses_*`) a
`ecom_company_expenses_ledger_*` la primera vez. La composición vive en
`features/modules/expenses` (ADR-72).

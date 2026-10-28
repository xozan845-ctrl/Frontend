# banks/ — Cuentas bancarias compartidas

Dominio de cuentas bancarias para empresa y tienda del vendedor.

| Capa         | Responsabilidad                                                     |
| ------------ | ------------------------------------------------------------------- |
| `models/`    | Cuenta, payload, resumen y tipo de cuenta.                          |
| `constants/` | Tipos, límite y clave de storage por ámbito.                        |
| `adapters/`  | Saneamiento, alta, edición y saldo total.                           |
| `state/`     | `BanksStore` con altas, edición, borrado y persistencia por ámbito. |

El store recibe `BANKS_SCOPE_CONFIG` del workspace: empresa usa el tenant y la
tienda usa el `storeId` del vendedor. Cada ámbito guarda en
`ecom_company_banks_*` o `ecom_store_banks_*` (ADR-68). La composición vive en
`features/modules/banks`.

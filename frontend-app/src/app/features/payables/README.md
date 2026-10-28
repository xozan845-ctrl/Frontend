# payables/ — Cuentas por pagar compartidas

Dominio de cuentas por pagar para empresa y tienda del vendedor.

| Capa         | Responsabilidad                                                     |
| ------------ | ------------------------------------------------------------------- |
| `models/`    | Cuenta, payload, fila con vencimiento y resumen.                    |
| `constants/` | Estados, límite, clave de storage y configuración de scope.         |
| `adapters/`  | Saneamiento, creación, vencimiento y totales.                       |
| `state/`     | `PayablesStore` con altas, pago, borrado y persistencia por ámbito. |

El store recibe `PAYABLES_SCOPE_CONFIG` del workspace: empresa usa el tenant y
la tienda usa el `storeId` del vendedor. Cada ámbito guarda en
`ecom_company_payables_*` o `ecom_store_payables_*` (ADR-67). La composición
vive en `features/modules/payables`.

# credits/ — Créditos compartidos

Dominio de ventas a crédito para empresa y tienda del vendedor.

| Capa         | Responsabilidad                                                   |
| ------------ | ----------------------------------------------------------------- |
| `models/`    | Crédito, fila con vencimiento/pago, payload y resumen.            |
| `constants/` | Límite y clave de storage por ámbito.                             |
| `adapters/`  | Saneamiento, alta, vencimiento, pago y totales.                   |
| `state/`     | `CreditsStore` con alta, pago, borrado y persistencia por ámbito. |

El store recibe `CREDITS_SCOPE_CONFIG` del workspace: empresa usa el tenant y la
tienda usa el `storeId` del vendedor. Cada ámbito guarda en
`ecom_company_credits_*` o `ecom_store_credits_*` (ADR-70). La composición vive
en `features/modules/credits`.

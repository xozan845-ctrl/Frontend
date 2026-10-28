# barcodes/ — Códigos de barras compartidos

Dominio de etiquetas de códigos de barras para empresa y tienda del vendedor.

| Capa         | Responsabilidad                                                 |
| ------------ | --------------------------------------------------------------- |
| `models/`    | Etiqueta, payload, simbología y resumen.                        |
| `constants/` | Simbologías, límites y clave de storage por ámbito.             |
| `adapters/`  | Validación/generación EAN-13 y Code 128, saneamiento y resumen. |
| `state/`     | `BarcodesStore` con alta, borrado y persistencia por ámbito.    |

El store recibe `BARCODES_SCOPE_CONFIG` del workspace: empresa usa el tenant y
la tienda usa el `storeId` del vendedor. Cada ámbito guarda en
`ecom_company_barcodes_*` o `ecom_store_barcodes_*` (ADR-69). La composición
vive en `features/modules/barcodes`.

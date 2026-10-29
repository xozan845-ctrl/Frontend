# purchases/ — Compras, órdenes y proveedores

Dominio del módulo de compras del workspace de empresa.

| Capa         | Responsabilidad                                                             |
| ------------ | --------------------------------------------------------------------------- |
| `models/`    | Compra, línea, orden, proveedor, preferencias de documentos y reporte.      |
| `constants/` | Periodos, estados, pagos, tipos de costo, límite y claves de storage.       |
| `adapters/`  | Creación/saneamiento, filtros, KPIs, reporte CSV/HTML y migración heredada. |
| `state/`     | `PurchasesStore` con historial, órdenes, proveedores y persistencia.        |

Cada empresa guarda sus documentos en `ecom_company_purchase_*`; el store migra
las compras simples del módulo de finanzas para no perder registros. La
composición visual vive en `features/modules/purchases`.

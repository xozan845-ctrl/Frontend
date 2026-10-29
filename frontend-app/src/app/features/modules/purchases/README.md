# modules/purchases/ — Composición del módulo de Compras

Módulo de abastecimiento de la empresa. La página orquesta el `PurchasesStore`
y reutiliza el catálogo de productos para elegir mercancía o crear un producto
nuevo comprado.

- `pages/company-purchases`: cabecera, KPIs, historial/proveedores, órdenes y
  modales de personalización, exportación, compra directa y asistente de compra.
- `components/purchase-history`: filtros, búsqueda, tabla y paginación.
- `components/purchase-orders`: solicitudes previas a la compra real.
- `components/purchase-new-modal`: asistente de 7 pasos y alta de producto nuevo.
- `components/purchase-export-modal`: reporte filtrado con salida Excel/PDF.
- `purchases.routes.ts`: ruta lazy, store del feature y catálogo compartido.

El dominio y el store viven en `features/domains/purchases`; el módulo no
duplica estado. La personalización de documentos alimenta los PDF de órdenes y
reportes.

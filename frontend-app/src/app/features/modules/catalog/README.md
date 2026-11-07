# modules/catalog/ — Composición del catálogo de empresa

Módulo de workspace que compone la administración de productos, servicios y
materia prima de la empresa sobre `features/domains/company-catalog` y el
catálogo maestro de `features/domains/catalog`.

- `pages/company-products`: KPIs, pestañas, filtros, tabla y acciones del
  catálogo.
- `components/company-catalog-table`: tabla presentacional de productos,
  servicios y materia prima.
- `components/company-product-modal`: alta/edición de productos y servicios.
- `catalog.routes.ts`: ruta lazy y providers de stores y puertos de catálogo.

La empresa carga este módulo desde `COMPANY_ROUTES`. Los modelos, constantes,
adaptadores y stores viven en `features/domains/company-catalog`; el catálogo
maestro (producto, puerto y servicio) en `features/domains/catalog`. El módulo
no duplica dominio ni estado (ADR-65, ADR-76).

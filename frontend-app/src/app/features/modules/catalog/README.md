# modules/catalog/ — Composición del catálogo de empresa

Módulo de workspace que compone la administración de productos, servicios y
materia prima de la empresa sobre el dominio y los stores de `features/applications/empresas`.

- `pages/company-products`: KPIs, pestañas, filtros, tabla y acciones del
  catálogo.
- `components/company-catalog-table`: tabla presentacional de productos,
  servicios y materia prima.
- `components/company-product-modal`: alta/edición de productos y servicios.
- `catalog.routes.ts`: ruta lazy y providers de stores y catálogo.

La empresa carga este módulo desde `EMPRESAS_ROUTES`. Los modelos, constantes,
adaptadores y stores siguen en `features/applications/empresas` y se consumen por su API
pública (ADR-65). El módulo no duplica dominio ni estado.

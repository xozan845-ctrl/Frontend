# domains/company-catalog/ — Catálogo administrable de empresa

Dominio de productos, servicios, combos, promociones y operaciones de inventario
del workspace de empresa. Consume el catálogo maestro de `domains/catalog`.

- `models/`: filas, formularios, operaciones, importación CSV y servicios.
- `adapters/`: normalización de productos, servicios y operaciones.
- `repositories/`: puertos de servicios y operaciones de catálogo.
- `services/`: implementaciones HTTP.
- `state/`: `CompanyProductsStore`, `CompanyServicesStore` y
  `CompanyCatalogOperationsStore`.
- `constants/`: unidades, tamaños de página y etiquetas.

La composición visual vive en `features/modules/company/catalog`.

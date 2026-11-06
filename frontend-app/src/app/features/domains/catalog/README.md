# domains/catalog/ — Catálogo maestro

Dominio del catálogo de productos (`/catalog/productos`): modelo, DTO,
adaptador tolerante, puerto y servicio HTTP. Lo consumen el storefront, el
catálogo administrable de empresa y el POS de tienda.

- `models/`: `CatalogProduct`, filtros, páginas y payloads de alta/edición.
- `adapters/`: normalización de productos y metadatos operativos.
- `repositories/`: puerto `CATALOG_PRODUCT_REPOSITORY`.
- `services/`: implementación HTTP `CatalogProductService`.

No contiene páginas ni stores de una experiencia concreta.

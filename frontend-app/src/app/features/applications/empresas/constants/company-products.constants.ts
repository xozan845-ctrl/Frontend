import type { CompanyCatalogSort } from '../models/company-catalog.model';

/** Filas por página en las tablas del catálogo. */
export const COMPANY_CATALOG_PAGE_SIZE = 10;

/** Límite máximo que acepta `GET /catalog/productos` (validado por Core Engine). */
export const COMPANY_PRODUCT_API_PAGE_SIZE = 100;

/** Unidades de venta admitidas. */
export const COMPANY_PRODUCT_UNITS = [
  'Unidad (u)',
  'Caja',
  'Paquete',
  'Libra (lb)',
  'Metro (m)',
  'Litro (L)',
  'Hora (h)',
  'Servicio',
] as const;

/** Unidades de compra admitidas. */
export const COMPANY_PRODUCT_PURCHASE_UNITS = [
  'Igual que la de venta',
  'Unidad (u)',
  'Caja',
  'Paquete',
  'Libra (lb)',
  'Metro (m)',
  'Litro (L)',
] as const;

/** Unidades de contenido para vender por partes. */
export const COMPANY_PRODUCT_CONTENT_UNITS = [
  'Sin contenido',
  'Unidades',
  'Metros',
  'Centímetros',
  'Litros',
  'Mililitros',
  'Gramos',
  'Kilogramos',
] as const;

/** Etiquetas humanas de las ordenaciones. */
export const COMPANY_CATALOG_SORT_LABELS: Readonly<Record<CompanyCatalogSort, string>> = {
  'nombre-az': 'Nombre: A-Z',
  'nombre-za': 'Nombre: Z-A',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
  'stock-asc': 'Stock: menor a mayor',
  'stock-desc': 'Stock: mayor a menor',
  reciente: 'Más reciente',
};

/** Cabeceras de la plantilla CSV de importación. */
export const COMPANY_PRODUCT_TEMPLATE_HEADERS = [
  'nombre',
  'descripcion',
  'categoria',
  'sku',
  'precio_venta',
  'costo',
  'stock_inicial',
  'stock_minimo',
  'codigo_barras',
  'marca',
] as const;

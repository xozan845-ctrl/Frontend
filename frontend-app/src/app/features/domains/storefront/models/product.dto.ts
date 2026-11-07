/**
 * DTO flexible y tolerante a múltiples convenciones de backends
 * (camelCase, snake_case, Django, NestJS, Spring Boot, Strapi, etc.)
 */
export interface BackendProductDTO {
  id?: string | number;
  _id?: string | number;
  productId?: string | number;
  product_id?: string | number;
  sku?: string;

  name?: string;
  nombre?: string;
  title?: string;
  product_name?: string;
  label?: string;

  description?: string;
  descripcion?: string;
  details?: string;
  desc?: string;

  price?: number | string;
  precio_base?: number | string;
  unit_price?: number | string;
  cost?: number | string;
  amount?: number | string;

  originalPrice?: number | string;
  original_price?: number | string;
  compare_at_price?: number | string;

  imageUrl?: string;
  image_url?: string;
  image?: string;
  thumbnail?: string;
  photo?: string;

  images?: string[];
  gallery?: string[];
  photos?: string[];

  category?: string | { id?: string | number; name?: string; title?: string };
  categoria?: string;
  category_name?: string;
  categoryName?: string;
  department?: string;

  stock?: number;
  inventory?: number;
  quantity?: number;
  stock_quantity?: number;
  in_stock?: boolean;
  estado?: string;

  variants?: {
    colors?: { name: string; hex: string }[];
    specs?: string[];
  };
}

/** Oferta de Core Engine (`GET /tiendas/:id` → `ofertas[]`). Tolerante a `snake_case`. */
export interface BackendOfertaDTO {
  id?: string | number | null;
  producto_id?: string | number | null;
  producto_nombre?: string;
  precio_venta?: number | string | null;
  precio_base?: number | string | null;
  stock?: number | string | null;
  sku?: string;
  tienda_id?: string | number | null;
}

/** Tienda de Core Engine dentro del storefront (`tienda`). */
export interface BackendTiendaDTO {
  id?: string | number | null;
  vendedor_id?: string | number | null;
  vendorId?: string | number | null;
  nombre?: string;
  descripcion?: string;
}

/** Respuesta del storefront (`GET /tiendas/:id`). */
export interface BackendStorefrontDTO {
  tienda?: BackendTiendaDTO | null;
  ofertas?: BackendOfertaDTO[];
}

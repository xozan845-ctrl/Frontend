/**
 * DTO flexible y tolerante a múltiples convenciones de backends
 * (camelCase, snake_case, Django, NestJS, Spring Boot, Strapi, etc.)
 */
export interface BackendProductDTO {
  id?: string | number;
  _id?: string | number;
  productId?: string | number;
  product_id?: string | number;

  name?: string;
  title?: string;
  product_name?: string;
  label?: string;

  description?: string;
  details?: string;
  desc?: string;

  price?: number | string;
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
  category_name?: string;
  categoryName?: string;
  department?: string;

  stock?: number;
  inventory?: number;
  quantity?: number;
  stock_quantity?: number;
  in_stock?: boolean;

  variants?: {
    colors?: { name: string; hex: string }[];
    specs?: string[];
  };
}

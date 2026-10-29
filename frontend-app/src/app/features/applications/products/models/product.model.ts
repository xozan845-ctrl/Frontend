export interface ProductVariant {
  colors?: { name: string; hex: string }[];
  specs?: string[];
  id?: string;
  sku?: string;
  name?: string;
  attributes?: Record<string, unknown>;
}

export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  images?: string[];
  category: string;
  stock: number;
  sku?: string;
  productId?: string;
  imageObjectId?: string;
  createdAt?: string;
  variants?: ProductVariant;
}

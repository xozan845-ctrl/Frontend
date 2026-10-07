export interface ProductVariant {
  colors?: { name: string; hex: string }[];
  specs?: string[];
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
  variants?: ProductVariant;
}

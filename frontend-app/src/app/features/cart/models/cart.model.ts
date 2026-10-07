import type { Product } from '../../products/public-api';

export interface CartItem {
  product: Product;
  quantity: number;
}

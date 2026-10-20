import type { Product } from '../models/product.model';
import type { Review } from '../models/review.model';
import type { Store } from '../models/store.model';

export interface ProductState {
  /** Tienda activa (resuelta por URL); `null` fuera del storefront. */
  store: Store | null;
  storeId: string | null;
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  priceMin: number | null;
  priceMax: number | null;
  sortOption: string;
  currentPage: number;
  pageSize: number;
}

export interface ReviewsState {
  reviews: Review[];
}

export interface RecentlyViewedState {
  products: Product[];
}

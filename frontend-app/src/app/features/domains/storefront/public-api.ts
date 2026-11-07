/** API pública del dominio de storefront: productos, carrito, wishlist y reseñas. */
export type { CartItem, CartSnapshot } from './models/cart.model';
export type { CatalogEntry } from './models/catalog-entry.model';
export type { MockItem } from './models/mock-item.model';
export type { Product, ProductVariant } from './models/product.model';
export type { Review } from './models/review.model';
export type { Store } from './models/store.model';
export { CART_REPOSITORY, type CartRepository } from './repositories/cart.repository';
export {
  PRODUCT_REPOSITORY,
  type ProductRepository,
  type Storefront,
} from './repositories/product.repository';
export { CartService } from './services/cart/cart.service';
export { ProductService } from './services/product/product.service';
export { CartStore } from './state/cart/cart.store';
export { ProductStore } from './state/product/product.store';
export { ReviewsStore } from './state/reviews/reviews.store';
export { WishlistStore } from './state/wishlist/wishlist.store';
export type { CartState, CartUiState, OrderState } from './state/cart/cart.state';
export type {
  ProductState,
  RecentlyViewedState,
  ReviewsState,
} from './state/product/product.state';
export type { WishlistState } from './state/wishlist/wishlist.state';
export {
  FILTER_CATEGORIES,
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from './constants/categories.constants';
export { adaptCartFromBackend } from './adapters/cart/cart.adapter';
export { adaptProductFromBackend } from './adapters/product/product.adapter';

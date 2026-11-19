import { InjectionToken } from '@angular/core';
import type { CartItem } from '../models/cart.model';
import type { LocalStateResult } from '../models/local-state.model';
import type { Product } from '../models/product.model';
import type { Review } from '../models/review.model';

/**
 * Puerto de persistencia local del storefront.
 *
 * Los stores nunca leen/escriben `localStorage` ni hacen `JSON.parse`: piden
 * datos ya normalizados y reciben un resultado de recuperación explícito.
 */
export interface LocalStatePort {
  readCart(): LocalStateResult<CartItem[]>;
  writeCart(items: CartItem[]): void;
  clearCart(): void;

  readWishlist(): LocalStateResult<Product[]>;
  writeWishlist(items: Product[]): void;
  clearWishlist(): void;

  readReviews(): LocalStateResult<Review[]>;
  writeReviews(reviews: Review[]): void;
  clearReviews(): void;
}

export const LOCAL_STATE = new InjectionToken<LocalStatePort>('LocalState');

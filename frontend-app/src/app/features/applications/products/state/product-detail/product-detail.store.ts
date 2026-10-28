import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';
import { WishlistStore } from '../../../wishlist/public-api';
import { ProductStore } from '../product/product.store';
import { RecentlyViewedStore } from '../recently-viewed/recently-viewed.store';
import { ReviewsStore } from '../reviews/reviews.store';

/**
 * Proyección de estado para el detalle de producto (`R-ST-3`). Compone las
 * señales de producto, reseñas, wishlist y vistos recientemente para que la
 * página solo muestre estado; se provee en el componente para acotar su ciclo
 * de vida (`R-ST-6`).
 */
const formatReviewDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const ProductDetailStore = signalStore(
  withComputed(() => {
    const productStore = inject(ProductStore);
    const reviewsStore = inject(ReviewsStore);
    const wishlistStore = inject(WishlistStore);
    const recentlyViewedStore = inject(RecentlyViewedStore);

    return {
      productReviews: computed(() => {
        const product = productStore.selectedProduct();
        if (!product) return [];
        return reviewsStore.getReviewsByProductId(product.id).map((review) => ({
          ...review,
          formattedDate: formatReviewDate(review.date),
        }));
      }),
      avgRating: computed(() => {
        const product = productStore.selectedProduct();
        return product ? reviewsStore.getAverageRating(product.id) : 0;
      }),
      isInWishlist: computed(() => {
        const product = productStore.selectedProduct();
        return product ? wishlistStore.isInWishlist(product.id) : false;
      }),
      recentlyViewedOtherProducts: computed(() => {
        const current = productStore.selectedProduct();
        return recentlyViewedStore.products().filter((p) => String(p.id) !== String(current?.id));
      }),
      discountPercent: computed(() => {
        const product = productStore.selectedProduct();
        if (product?.originalPrice && product.originalPrice > product.price) {
          return Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) * 100,
          );
        }
        return null;
      }),
    };
  }),
);

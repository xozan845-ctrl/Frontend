import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  effect,
  input,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductStore } from '../../state/product/product.store';
import { ProductDetailStore } from '../../state/product-detail/product-detail.store';
import { CartStore } from '../../../cart/public-api';
import { ReviewsStore } from '../../state/reviews/reviews.store';
import { RecentlyViewedStore } from '../../state/recently-viewed/recently-viewed.store';
import { WishlistStore } from '../../../wishlist/public-api';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { SpinnerComponent } from '../../../../../shared/ui/spinner/spinner.component';
import { StarRatingComponent } from '../../../../../shared/ui/star-rating/star-rating.component';
import { ImageLightboxComponent } from '../../../../../shared/ui/image-lightbox/image-lightbox.component';
import { ProductCarouselComponent } from '../../components/product-carousel/product-carousel.component';
import { CartFlyService } from '../../../../../shared/ui/cart-fly/cart-fly.service';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { injectSeoCleanup } from '../../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { TrustBadgesComponent } from '../../../../../shared/ui/trust-badges/trust-badges.component';
import type { TrustBadge } from '../../../../../shared/ui/trust-badges/trust-badges.types';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    SpinnerComponent,
    NgOptimizedImage,
    ReactiveFormsModule,
    DecimalPipe,
    StarRatingComponent,
    ImageLightboxComponent,
    ProductCarouselComponent,
    EmptyStateComponent,
    AppCurrencyPipe,
    TrustBadgesComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
  providers: [ProductDetailStore],
})
export class ProductDetailComponent {
  readonly productStore = inject(ProductStore);
  readonly trustBadges: readonly TrustBadge[] = [
    { icon: 'fa-solid fa-shield-halved', title: 'Pago Seguro', subtitle: 'Datos encriptados' },
    { icon: 'fa-solid fa-truck-fast', title: 'Envío 24-48h', subtitle: 'Cobertura nacional' },
    { icon: 'fa-solid fa-rotate-left', title: '30 Días Retorno', subtitle: 'Devolución sin costo' },
    { icon: 'fa-solid fa-headset', title: 'Soporte 24/7', subtitle: 'Chat y teléfono' },
  ];
  private readonly cartStore = inject(CartStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly wishlistStore = inject(WishlistStore);
  readonly recentlyViewedStore = inject(RecentlyViewedStore);
  private readonly detail = inject(ProductDetailStore);
  private readonly notificationService = inject(NotificationService);
  private readonly cartFlyService = inject(CartFlyService);
  private readonly fb = inject(FormBuilder);
  private readonly seoService = injectSeoCleanup();

  /** Parámetros de ruta (`/tienda/:storeId/producto/:id`, `R-AR-12`). */
  readonly storeId = input<string>('');
  readonly id = input<string>('');

  /** Catálogo de la tienda activa (para el enlace "Retornar a la Tienda"). */
  readonly shopRoute = computed(() => `/tienda/${this.storeId()}/shop`);

  showReviewForm = signal(false);
  selectedRating = signal(0);
  reviewSubmitted = signal(false);

  // Quantity, variants, gallery
  quantity = signal(1);
  selectedColor = signal<string | null>(null);
  selectedSpec = signal<string | null>(null);
  activeImageIndex = signal(0);

  productReviews = this.detail.productReviews;
  avgRating = this.detail.avgRating;
  isInWishlist = this.detail.isInWishlist;
  recentlyViewedOtherProducts = this.detail.recentlyViewedOtherProducts;
  discountPercent = this.detail.discountPercent;

  activeImage = computed(() => {
    const p = this.productStore.selectedProduct();
    if (p?.images && p.images.length > 0) {
      return p.images[this.activeImageIndex()] || p.imageUrl;
    }
    return p?.imageUrl ?? '';
  });

  reviewForm = this.fb.nonNullable.group({
    authorName: ['', [Validators.required, Validators.minLength(2)]],
    comment: ['', [Validators.required, Validators.minLength(10)]],
  });

  features = [
    {
      icon: 'fa-solid fa-truck-fast',
      title: 'Envío Global',
      subtitle: 'Prioridad en órdenes grandes',
    },
    {
      icon: 'fa-solid fa-shield-halved',
      title: 'Garantía 24m',
      subtitle: 'Cobertura total hardware',
    },
    { icon: 'fa-solid fa-rotate-left', title: 'Devoluciones', subtitle: '30 días sin fricción' },
    { icon: 'fa-solid fa-credit-card', title: 'Pago Seguro', subtitle: 'Encriptación end-to-end' },
  ];

  /** Selecciona el producto dentro del storefront ya cargado por el resolver. */
  private readonly selectFromRoute = effect(() => {
    const id = this.id();
    const products = this.productStore.products();
    if (id && products.length > 0) {
      this.productStore.selectProduct(id);
    }
  });

  private readonly syncSeoAndRecentlyViewed = effect(() => {
    const p = this.productStore.selectedProduct();
    if (p) {
      // Side effects fuera del tracking: `addProduct` lee y escribe el mismo
      // signal de `RecentlyViewedStore`, lo que provocaría un bucle (R-ST-3).
      untracked(() => {
        this.seoService.setProductPage(p.name, p.description, p.price, {
          imageUrl: p.imageUrl,
          inStock: p.stock > 0,
        });
        this.recentlyViewedStore.addProduct(p);
      });
    }
  });

  private readonly cleanup = inject(DestroyRef).onDestroy(() =>
    this.productStore.clearSelectedProduct(),
  );

  addToCart(buttonEl: HTMLButtonElement): void {
    const product = this.productStore.selectedProduct();
    if (product) {
      this.cartStore.addItem(product, this.quantity());
      this.cartFlyService.fly(buttonEl, product.imageUrl);
      this.notificationService.showSuccess(
        `"${product.name}" x${this.quantity()} añadido al carrito`,
      );
    }
  }

  updateQuantity(delta: number): void {
    const next = this.quantity() + delta;
    if (next >= 1 && next <= 99) this.quantity.set(next);
  }

  async shareProduct(): Promise<void> {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      this.notificationService.showSuccess('Enlace copiado al portapapeles');
    } catch {
      this.notificationService.showInfo('No se pudo copiar el enlace');
    }
  }

  toggleWishlist(): void {
    const product = this.productStore.selectedProduct();
    if (product) this.wishlistStore.toggle(product);
  }

  submitReview(): void {
    this.reviewSubmitted.set(true);
    if (this.reviewForm.invalid || this.selectedRating() === 0) return;
    const product = this.productStore.selectedProduct();
    if (!product) return;

    this.reviewsStore.addReview({
      productId: product.id,
      authorName: this.reviewForm.value.authorName!,
      rating: this.selectedRating(),
      comment: this.reviewForm.value.comment!,
    });

    this.reviewForm.reset();
    this.selectedRating.set(0);
    this.reviewSubmitted.set(false);
    this.showReviewForm.set(false);
  }
}
export default ProductDetailComponent;

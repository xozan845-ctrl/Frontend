import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductStore } from '../../state/product.store';
import { CartStore } from '../../../cart/public-api';
import { ReviewsStore } from '../../state/reviews.store';
import { RecentlyViewedStore } from '../../state/recently-viewed.store';
import { WishlistStore } from '../../../wishlist/public-api';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { SpinnerComponent } from '../../../../shared/ui/spinner/spinner.component';
import { StarRatingComponent } from '../../../../shared/ui/star-rating/star-rating.component';
import { ImageLightboxComponent } from '../../../../shared/ui/image-lightbox/image-lightbox.component';
import { ProductCarouselComponent } from '../product-carousel/product-carousel.component';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SeoService } from '../../../../shared/services/seo.service';

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
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  readonly productStore = inject(ProductStore);
  private readonly cartStore = inject(CartStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly wishlistStore = inject(WishlistStore);
  readonly recentlyViewedStore = inject(RecentlyViewedStore);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly cartFlyService = inject(CartFlyService);
  private readonly fb = inject(FormBuilder);
  private readonly seoService = inject(SeoService);

  showReviewForm = signal(false);
  selectedRating = signal(0);
  reviewSubmitted = signal(false);

  // Quantity, variants, gallery
  quantity = signal(1);
  selectedColor = signal<string | null>(null);
  selectedSpec = signal<string | null>(null);
  activeImageIndex = signal(0);

  productReviews = computed(() => {
    const p = this.productStore.selectedProduct();
    if (!p) return [];
    return this.reviewsStore
      .getReviewsByProductId(p.id)
      .map((review) => ({ ...review, formattedDate: this.formatDate(review.date) }));
  });

  avgRating = computed(() => {
    const p = this.productStore.selectedProduct();
    if (!p) return 0;
    return this.reviewsStore.getAverageRating(p.id);
  });

  isInWishlist = computed(() => {
    const p = this.productStore.selectedProduct();
    return p ? this.wishlistStore.isInWishlist(p.id) : false;
  });

  recentlyViewedOtherProducts = computed(() => {
    const current = this.productStore.selectedProduct();
    return this.recentlyViewedStore.products().filter((p) => String(p.id) !== String(current?.id));
  });

  discountPercent = computed(() => {
    const p = this.productStore.selectedProduct();
    if (p?.originalPrice && p.originalPrice > p.price) {
      return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
    }
    return null;
  });

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

  constructor() {
    effect(() => {
      const p = this.productStore.selectedProduct();
      if (p) {
        // Side effects fuera del tracking: `addProduct` lee y escribe el mismo
        // signal de `RecentlyViewedStore`, lo que provocaría un bucle (R-ST-3).
        untracked(() => {
          this.seoService.setProductPage(p.name, p.description, p.price);
          this.recentlyViewedStore.addProduct(p);
        });
      }
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id: string | number = isNaN(Number(idParam)) ? idParam : Number(idParam);
      this.productStore.loadProductById(id);
    }
  }

  ngOnDestroy() {
    this.productStore.clearSelectedProduct();
    this.seoService.reset();
  }

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

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
export default ProductDetailComponent;

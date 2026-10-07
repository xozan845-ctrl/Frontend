import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Product } from '../../models/product.model';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { WishlistStore } from '../../../wishlist/state/wishlist.store';
import { ReviewsStore } from '../../state/reviews.store';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { StarRatingComponent } from '../../../../shared/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, StarRatingComponent],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  @ViewChild('productImage', { read: ElementRef }) productImageRef!: ElementRef<HTMLImageElement>;

  product = input.required<Product>();
  addToCart = output<Product>();
  quickView = output<Product>();

  private readonly notificationService = inject(NotificationService);
  private readonly wishlistStore = inject(WishlistStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly cartFlyService = inject(CartFlyService);

  isAdding = signal(false);

  // Derivados en `computed` (R-PF-4): nunca se recalculan en la plantilla.
  readonly isInWishlist = computed(() => this.wishlistStore.isInWishlist(this.product().id));
  readonly avgRating = computed(() => this.reviewsStore.getAverageRating(this.product().id));
  readonly reviewCount = computed(
    () => this.reviewsStore.getReviewsByProductId(this.product().id).length,
  );
  readonly discountPercent = computed(() => {
    const orig = this.product().originalPrice;
    const price = this.product().price;
    if (orig && orig > price) {
      return Math.round(((orig - price) / orig) * 100);
    }
    return null;
  });

  /** Reinicia el estado "añadido" tras 2 s sin usar `setTimeout` (R-PF-6). */
  private readonly addPulse = new Subject<void>();

  constructor() {
    this.addPulse
      .pipe(
        switchMap(() => timer(2000)),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.isAdding.set(false));
  }

  toggleWishlist(): void {
    this.wishlistStore.toggle(this.product());
  }

  onAddToCart(buttonEl: HTMLButtonElement): void {
    if (this.isAdding()) return;
    this.isAdding.set(true);
    this.addToCart.emit(this.product());
    this.notificationService.showSuccess('Producto añadido al carrito');

    // Fly animation
    this.cartFlyService.fly(buttonEl, this.product().imageUrl);

    this.addPulse.next();
  }
}

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
  /** Datos que aporta el contenedor: el presentacional no conoce stores (R-SO-6). */
  isInWishlist = input<boolean>(false);
  avgRating = input<number>(0);
  reviewCount = input<number>(0);
  priority = input<boolean>(false);
  addToCart = output<Product>();
  quickView = output<Product>();
  toggleWishlist = output<Product>();

  private readonly notificationService = inject(NotificationService);
  private readonly cartFlyService = inject(CartFlyService);

  isAdding = signal(false);

  // Derivado puro del input (R-PF-4).
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

  onToggleWishlist(): void {
    this.toggleWishlist.emit(this.product());
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

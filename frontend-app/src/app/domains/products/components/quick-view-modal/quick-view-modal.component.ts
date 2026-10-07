import {
  Component,
  inject,
  input,
  output,
  signal,
  HostListener,
  OnDestroy,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { StarRatingComponent } from '../../../../shared/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, StarRatingComponent],
  templateUrl: './quick-view-modal.component.html',
  styleUrl: './quick-view-modal.component.css',
})
export class QuickViewModalComponent implements OnDestroy {
  product = input<Product | null>(null);
  /** Datos que aporta el contenedor: sin stores de dominio (R-SO-6). */
  isInWishlist = input<boolean>(false);
  avgRating = input<number>(0);
  reviewCount = input<number>(0);
  closeModal = output<void>();
  addToCart = output<Product>();
  toggleWishlist = output<Product>();

  private readonly cartFlyService = inject(CartFlyService);

  isAdding = signal(false);

  private readonly addPulse = new Subject<void>();

  constructor() {
    // Reinicia "añadido" tras 2 s sin `setTimeout` (R-PF-6).
    this.addPulse
      .pipe(
        switchMap(() => timer(2000)),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.isAdding.set(false));

    effect(() => {
      if (this.product()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.product()) this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal.emit();
    }
  }

  onAddToCart(buttonEl: HTMLElement): void {
    const p = this.product();
    if (!p || this.isAdding()) return;
    this.isAdding.set(true);
    this.addToCart.emit(p);
    this.cartFlyService.fly(buttonEl, p.imageUrl);
    this.addPulse.next();
  }

  onToggleWishlist(): void {
    const p = this.product();
    if (p) this.toggleWishlist.emit(p);
  }
}

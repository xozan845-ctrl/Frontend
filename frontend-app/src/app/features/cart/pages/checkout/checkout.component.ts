import { Component, computed, DestroyRef, inject, signal, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { AuthStore } from '../../../auth/public-api';
import { ProductStore } from '../../../products/public-api';
import { NotificationService } from '../../../../core/services/notification.service';
import { TrustBadgesComponent } from '../../../../shared/ui/trust-badges/trust-badges.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SeoService } from '../../../../core/services/seo.service';
import { ORDER_REPOSITORY, OrderRepository } from '../../repositories/order.repository';
import { CreateOrderPayload } from '../../models/order.model';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgOptimizedImage, TrustBadgesComponent, EmptyStateComponent, AppCurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnDestroy {
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  private router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private notificationService = inject(NotificationService);
  private readonly seoService = inject(SeoService);
  private readonly orderService: OrderRepository = inject(ORDER_REPOSITORY);
  private readonly productStore = inject(ProductStore);

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly shopRoute = computed(() => `/tienda/${this.storeId()}/shop`);

  isSubmitting = signal(false);

  constructor() {
    this.seoService.setPage('Checkout', 'Finaliza tu compra en Quantum Store.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }

  /**
   * Core Engine crea la orden a partir de las ofertas del carrito
   * (`{ items: [{ ofertaId, cantidad }] }`); el total lo calcula el backend.
   */
  submitOrder() {
    if (this.isSubmitting() || this.cartStore.items().length === 0) return;
    this.isSubmitting.set(true);
    this.notificationService.showSuccess('Procesando orden...');

    const payload: CreateOrderPayload = {
      items: this.cartStore.items().map((item) => ({
        ofertaId: String(item.product.id),
        quantity: item.quantity,
      })),
    };

    this.orderService
      .createOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cartStore.clearCart();
          this.isSubmitting.set(false);
          this.router.navigate(['/tienda', this.storeId(), 'checkout', 'confirmacion']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err.message || 'Error al procesar la orden. Intenta nuevamente.';
          this.notificationService.showError(msg);
        },
      });
  }
}
export default CheckoutComponent;

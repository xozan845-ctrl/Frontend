import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart/cart.store';
import { AuthStore } from '../../../auth/public-api';
import { ProductStore } from '../../../products/public-api';
import { OrderStore } from '../../state/order/order.store';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { TrustBadgesComponent } from '../../../../../shared/ui/trust-badges/trust-badges.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { CreateOrderPayload } from '../../models/order.model';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgOptimizedImage, TrustBadgesComponent, EmptyStateComponent, AppCurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent {
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  private router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private notificationService = inject(NotificationService);
  private readonly seoService = injectSeoPage('Checkout', 'Finaliza tu compra en Quantum Store.');
  private readonly productStore = inject(ProductStore);
  private readonly orderStore = inject(OrderStore);

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly shopRoute = computed(() => `/tienda/${this.storeId()}/shop`);

  isSubmitting = signal(false);

  /**
   * Core Engine crea la orden a partir de las ofertas del carrito
   * (`{ items: [{ ofertaId, cantidad }] }`); el total lo calcula el backend.
   */
  submitOrder() {
    if (this.isSubmitting() || this.cartStore.items().length === 0) return;
    this.isSubmitting.set(true);
    this.notificationService.showSuccess('Procesando orden...');

    const payload: CreateOrderPayload = { usarCarrito: true };

    this.orderStore
      .placeOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cartStore.reset();
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

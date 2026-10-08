import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { ProductStore } from '../../../products/public-api';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [NgOptimizedImage, EmptyStateComponent, AppCurrencyPipe],
  templateUrl: './cart-view.component.html',
})
export class CartViewComponent {
  readonly cartStore = inject(CartStore);
  private readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly shopRoute = computed(() => `/tienda/${this.storeId()}/shop`);

  showClearConfirm = signal(false);

  checkout() {
    this.router.navigate(['/tienda', this.storeId(), 'checkout']);
  }

  confirmClearCart() {
    this.cartStore.clearCart();
    this.showClearConfirm.set(false);
  }
}
export default CartViewComponent;

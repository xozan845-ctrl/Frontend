import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [NgOptimizedImage, EmptyStateComponent],
  templateUrl: './cart-view.component.html',
})
export class CartViewComponent {
  readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  showClearConfirm = signal(false);

  checkout() {
    this.router.navigate(['/checkout']);
  }

  confirmClearCart() {
    this.cartStore.clearCart();
    this.showClearConfirm.set(false);
  }
}

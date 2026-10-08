import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { ProductStore } from '../../../products/public-api';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, EmptyStateComponent, FocusTrapDirective, AppCurrencyPipe],
  templateUrl: './cart-sidebar.component.html',
  styleUrl: './cart-sidebar.component.css',
})
export class CartSidebarComponent {
  readonly cartStore = inject(CartStore);
  private readonly productStore = inject(ProductStore);
  private router = inject(Router);

  private get storeId(): string {
    return this.productStore.storeId() ?? '';
  }

  goToCart() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/tienda', this.storeId, 'carrito']);
  }

  goToCheckout() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/tienda', this.storeId, 'checkout']);
  }
}

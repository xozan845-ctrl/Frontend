import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart.store';
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
  private router = inject(Router);

  goToCart() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/cart']);
  }

  goToCheckout() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/checkout']);
  }
}

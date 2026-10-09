import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { ProductStore } from '../../../products/public-api';
import { AuthStore } from '../../../auth/public-api';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [
    NgOptimizedImage,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    FocusTrapDirective,
    AppCurrencyPipe,
  ],
  templateUrl: './cart-sidebar.component.html',
  styleUrl: './cart-sidebar.component.css',
})
export class CartSidebarComponent {
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  private readonly productStore = inject(ProductStore);
  private router = inject(Router);

  private get storeId(): string {
    return this.productStore.storeId() ?? '';
  }

  /** Reintenta cargar el carrito (R-UX-1); flecha para el `input` de `EmptyState`. */
  readonly reloadCart = (): void => {
    this.cartStore.loadCart();
  };

  goToCart() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/tienda', this.storeId, 'carrito']);
  }

  goToCheckout() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/tienda', this.storeId, 'checkout']);
  }

  /** Invita al invitado a iniciar sesión y volver al checkout (donde se vuelca el carrito). */
  goToLogin() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: `/tienda/${this.storeId}/checkout` },
    });
  }

  goToRegister() {
    this.cartStore.toggleSidebar(false);
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: `/tienda/${this.storeId}/checkout` },
    });
  }
}

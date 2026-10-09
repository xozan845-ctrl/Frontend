import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart.store';
import { ProductStore } from '../../../products/public-api';
import { AuthStore } from '../../../auth/public-api';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/ui/skeleton/skeleton-loader.component';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [
    NgOptimizedImage,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    FocusTrapDirective,
    AppCurrencyPipe,
  ],
  templateUrl: './cart-view.component.html',
})
export class CartViewComponent implements OnDestroy {
  readonly cartStore = inject(CartStore);
  readonly authStore = inject(AuthStore);
  private readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly shopRoute = computed(() => `/tienda/${this.storeId()}/shop`);

  showClearConfirm = signal(false);

  constructor() {
    this.seoService.setPage('Carrito', 'Revisa y ajusta los productos de tu carrito.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }

  checkout() {
    this.router.navigate(['/tienda', this.storeId(), 'checkout']);
  }

  /** Invita al invitado a iniciar sesión y volver al checkout (donde se vuelca el carrito). */
  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: `/tienda/${this.storeId()}/checkout` },
    });
  }

  goToRegister() {
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: `/tienda/${this.storeId()}/checkout` },
    });
  }

  confirmClearCart() {
    this.cartStore.clearCart();
    this.showClearConfirm.set(false);
  }

  /** Cierra el modal solo al hacer clic en el fondo (no en el diálogo). */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.showClearConfirm.set(false);
  }

  /** Reintenta cargar el carrito (R-UX-1); flecha para el `input` de `EmptyState`. */
  readonly reloadCart = (): void => {
    this.cartStore.loadCart();
  };
}
export default CartViewComponent;

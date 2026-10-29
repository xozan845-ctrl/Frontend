import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { CartStore } from '../../state/cart/cart.store';
import { ProductStore } from '../../../products/public-api';
import { AuthStore } from '../../../auth/public-api';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../../shared/ui/skeleton/skeleton-loader.component';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { TrustBadgesComponent } from '../../../../../shared/ui/trust-badges/trust-badges.component';
import type { TrustBadge } from '../../../../../shared/ui/trust-badges/trust-badges.types';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [
    DatePipe,
    NgOptimizedImage,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    FocusTrapDirective,
    AppCurrencyPipe,
    TrustBadgesComponent,
  ],
  templateUrl: './cart-view.component.html',
})
export class CartViewComponent {
  readonly cartStore = inject(CartStore);
  readonly trustBadges: readonly TrustBadge[] = [
    { icon: 'fa-solid fa-shield-halved', title: 'Pago Seguro', subtitle: 'Datos encriptados' },
    { icon: 'fa-solid fa-truck-fast', title: 'Envío gratis', subtitle: 'En tu compra' },
    { icon: 'fa-solid fa-rotate-left', title: '30 Días Retorno', subtitle: 'Devolución sin costo' },
    { icon: 'fa-solid fa-headset', title: 'Soporte 24/7', subtitle: 'Chat y teléfono' },
  ];
  readonly authStore = inject(AuthStore);
  private readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly seoService = injectSeoPage(
    'Carrito',
    'Revisa y ajusta los productos de tu carrito.',
  );

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly shopRoute = computed(() => `/tienda/${this.storeId()}/shop`);

  showClearConfirm = signal(false);

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

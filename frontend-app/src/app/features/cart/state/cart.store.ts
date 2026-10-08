import { inject, effect } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { Observable } from 'rxjs';
import type { Product } from '../../products/public-api';
import { CartItem } from '../models/cart.model';
import { CART_REPOSITORY } from '../repositories/cart.repository';
import { AuthStore } from '../../auth/public-api';
import { NotificationService } from '../../../core/services/notification.service';

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  isSidebarOpen: boolean;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  isSidebarOpen: false,
};

/**
 * Carrito respaldado por el **servidor** (Core Engine `/carrito`, rol comprador).
 * Todas las mutaciones llaman al backend y refrescan el estado con su respuesta.
 * Se sincroniza con la sesión: al iniciar sesión carga el carrito del servidor y
 * al cerrarla lo vacía (R-AR-5, RN-05).
 */
export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items }) => ({
    totalItems: () => items().reduce((acc, item) => acc + item.quantity, 0),
    totalPrice: () => items().reduce((acc, item) => acc + item.product.price * item.quantity, 0),
  })),
  withMethods(
    (
      store,
      cartRepo = inject(CART_REPOSITORY),
      authStore = inject(AuthStore),
      notificationService = inject(NotificationService),
    ) => {
      const run = (request$: Observable<CartItem[]>, successMessage?: string): void => {
        patchState(store, { loading: true, error: null });
        request$.subscribe({
          next: (items) => {
            patchState(store, { items, loading: false });
            if (successMessage) notificationService.showSuccess(successMessage);
          },
          error: (err: Error) => {
            const message = err.message || 'No se pudo actualizar el carrito.';
            patchState(store, { loading: false, error: message });
            notificationService.showError(message);
          },
        });
      };

      return {
        /** Carga el carrito del servidor (solo con sesión). */
        loadCart() {
          if (!authStore.isAuthenticated()) {
            patchState(store, { items: [] });
            return;
          }
          run(cartRepo.getCart());
        },
        addItem(product: Product, quantity = 1) {
          run(cartRepo.addItem(String(product.id), quantity));
        },
        updateQuantity(productId: string | number, quantity: number) {
          run(cartRepo.updateQuantity(String(productId), quantity));
        },
        removeItem(productId: string | number) {
          run(cartRepo.removeItem(String(productId)), 'Producto eliminado del carrito');
        },
        clearCart() {
          run(cartRepo.clearCart());
        },
        /** Limpia el estado local sin llamar al backend (p. ej. la orden ya vació el carrito). */
        reset() {
          patchState(store, { items: [], loading: false, error: null });
        },
        toggleSidebar(isOpen?: boolean) {
          patchState(store, {
            isSidebarOpen: isOpen !== undefined ? isOpen : !store.isSidebarOpen(),
          });
        },
      };
    },
  ),
  withHooks({
    onInit(store, authStore = inject(AuthStore)) {
      // Mantiene el carrito sincronizado con la sesión.
      effect(() => {
        if (authStore.isAuthenticated()) {
          store.loadCart();
        } else {
          patchState(store, { items: [] });
        }
      });
    },
  }),
);

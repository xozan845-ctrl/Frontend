import { inject, effect } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { Observable, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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

/** Carrito del invitado: persiste en `localStorage` hasta que inicia sesión. */
const CART_STORAGE_KEY = 'ecom_cart_items';

function readLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage no disponible: se ignora.
  }
}

function clearLocalCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Storage no disponible: se ignora.
  }
}

function mergeItem(items: CartItem[], product: Product, quantity: number): CartItem[] {
  const index = items.findIndex((item) => String(item.product.id) === String(product.id));
  if (index > -1) {
    return items.map((item, i) =>
      i === index ? { ...item, quantity: item.quantity + quantity } : item,
    );
  }
  return [...items, { product, quantity }];
}

/**
 * Carrito **híbrido**: el invitado usa un carrito local (persistido en
 * `localStorage`) y, al iniciar sesión, se **vuelca** al carrito del servidor
 * (`/carrito`, rol comprador). Con sesión, la fuente de verdad es el servidor
 * (R-AR-5, RN-05).
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
      const isGuest = (): boolean => !authStore.isAuthenticated();

      /** Ejecuta una operación del carrito del servidor y refresca el estado. */
      const runServer = (request$: Observable<CartItem[]>, successMessage?: string): void => {
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

      const setLocal = (items: CartItem[]): void => {
        patchState(store, { items });
        writeLocalCart(items);
      };

      return {
        /** Carga el carrito: del servidor con sesión, o el local del invitado. */
        loadCart() {
          if (isGuest()) {
            patchState(store, { items: readLocalCart() });
            return;
          }
          runServer(cartRepo.getCart());
        },
        addItem(product: Product, quantity = 1) {
          if (isGuest()) {
            setLocal(mergeItem(store.items(), product, quantity));
            notificationService.showInfo(
              'Añadido al carrito. Inicia sesión o regístrate para guardarlo y completar la compra.',
            );
            return;
          }
          runServer(cartRepo.addItem(String(product.id), quantity));
        },
        updateQuantity(productId: string | number, quantity: number) {
          if (isGuest()) {
            const items =
              quantity <= 0
                ? store.items().filter((item) => String(item.product.id) !== String(productId))
                : store
                    .items()
                    .map((item) =>
                      String(item.product.id) === String(productId) ? { ...item, quantity } : item,
                    );
            setLocal(items);
            return;
          }
          runServer(cartRepo.updateQuantity(String(productId), quantity));
        },
        removeItem(productId: string | number) {
          if (isGuest()) {
            setLocal(store.items().filter((item) => String(item.product.id) !== String(productId)));
            notificationService.showInfo('Producto eliminado del carrito');
            return;
          }
          runServer(cartRepo.removeItem(String(productId)), 'Producto eliminado del carrito');
        },
        clearCart() {
          if (isGuest()) {
            setLocal([]);
            return;
          }
          runServer(cartRepo.clearCart());
        },
        /** Limpia el estado local sin llamar al backend (la orden ya vació el carrito). */
        reset() {
          clearLocalCart();
          patchState(store, { items: [], loading: false, error: null });
        },
        /** Vuelca el carrito del invitado al servidor (al iniciar sesión). */
        mergeLocalCart(local: CartItem[]) {
          if (local.length === 0) {
            runServer(cartRepo.getCart());
            return;
          }
          patchState(store, { loading: true, error: null });
          forkJoin(local.map((item) => cartRepo.addItem(String(item.product.id), item.quantity)))
            .pipe(switchMap(() => cartRepo.getCart()))
            .subscribe({
              next: (items) => {
                clearLocalCart();
                patchState(store, { items, loading: false });
                notificationService.showSuccess('Hemos guardado los productos de tu carrito.');
              },
              error: (err: Error) => {
                const message = err.message || 'No se pudo guardar tu carrito.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
              },
            });
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
      // Invitado: carga el carrito local. Al iniciar sesión: vuelca el local.
      effect(() => {
        if (authStore.isAuthenticated()) {
          store.mergeLocalCart(readLocalCart());
        } else {
          patchState(store, { items: readLocalCart() });
        }
      });
    },
  }),
);

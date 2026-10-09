import { inject, effect } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, forkJoin, pipe } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import type { Product } from '../../products/public-api';
import { CartItem } from '../models/cart.model';
import { CART_REPOSITORY } from '../repositories/cart.repository';
import { AuthStore } from '../../auth/public-api';
import { NotificationService } from '../../../core/services/notification.service';

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
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

/** Redondea a 2 decimales para no arrastrar error de coma flotante (`R-U-6`). */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Carrito **híbrido**: el invitado usa un carrito local (persistido en
 * `localStorage`) y, al iniciar sesión, se **vuelca** al carrito del servidor
 * (`/carrito`, rol comprador). Con sesión, la fuente de verdad es el servidor
 * (R-AR-5, RN-05). El HTTP se orquesta con `rxMethod` (`R-ST-5`) y la
 * persistencia local vive en `withHooks` (`R-ST-7`).
 */
export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items }) => ({
    totalItems: () => items().reduce((acc, item) => acc + item.quantity, 0),
    totalPrice: () =>
      round2(items().reduce((acc, item) => acc + item.product.price * item.quantity, 0)),
  })),
  withMethods(
    (
      store,
      cartRepo = inject(CART_REPOSITORY),
      authStore = inject(AuthStore),
      notificationService = inject(NotificationService),
    ) => {
      // El carrito del servidor es solo para el rol comprador (`/carrito` es
      // comprador-only); un vendedor/admin usa el carrito local para no recibir 403.
      const useServerCart = (): boolean =>
        authStore.isAuthenticated() && authStore.user()?.role === 'comprador';

      /** Ejecuta una operación del carrito del servidor y refresca el estado. */
      const runServer = rxMethod<{ request$: Observable<CartItem[]>; successMessage?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ request$, successMessage }) =>
            request$.pipe(
              tap((items) => {
                patchState(store, { items, loading: false });
                if (successMessage) notificationService.showSuccess(successMessage);
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo actualizar el carrito.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const setLocal = (items: CartItem[]): void => {
        patchState(store, { items });
      };

      return {
        /** Carga el carrito: del servidor con sesión, o el local del invitado. */
        loadCart() {
          if (!useServerCart()) {
            if (store.items().length === 0) patchState(store, { items: readLocalCart() });
            return;
          }
          runServer({ request$: cartRepo.getCart() });
        },
        addItem(product: Product, quantity = 1) {
          if (!useServerCart()) {
            setLocal(mergeItem(store.items(), product, quantity));
            notificationService.showInfo(
              'Añadido al carrito. Inicia sesión o regístrate para guardarlo y completar la compra.',
            );
            return;
          }
          runServer({ request$: cartRepo.addItem(String(product.id), quantity) });
        },
        updateQuantity(productId: string | number, quantity: number) {
          if (!useServerCart()) {
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
          runServer({ request$: cartRepo.updateQuantity(String(productId), quantity) });
        },
        removeItem(productId: string | number) {
          if (!useServerCart()) {
            setLocal(store.items().filter((item) => String(item.product.id) !== String(productId)));
            notificationService.showInfo('Producto eliminado del carrito');
            return;
          }
          runServer({
            request$: cartRepo.removeItem(String(productId)),
            successMessage: 'Producto eliminado del carrito',
          });
        },
        clearCart() {
          if (!useServerCart()) {
            setLocal([]);
            return;
          }
          runServer({ request$: cartRepo.clearCart() });
        },
        /** Limpia el estado local sin llamar al backend (la orden ya vació el carrito). */
        reset() {
          clearLocalCart();
          patchState(store, { items: [], loading: false, error: null });
        },
        /** Vuelca el carrito del invitado al servidor (al iniciar sesión). */
        mergeLocalCart: rxMethod<CartItem[]>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap((local) =>
              (local.length === 0
                ? cartRepo.getCart()
                : forkJoin(
                    local.map((item) => cartRepo.addItem(String(item.product.id), item.quantity)),
                  ).pipe(switchMap(() => cartRepo.getCart()))
              ).pipe(
                tap((items) => {
                  if (local.length > 0) clearLocalCart();
                  patchState(store, { items, loading: false });
                  if (local.length > 0) {
                    notificationService.showSuccess('Hemos guardado los productos de tu carrito.');
                  }
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo guardar tu carrito.';
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),
      };
    },
  ),
  withHooks({
    onInit(store, authStore = inject(AuthStore)) {
      // Hidrata el carrito local de forma síncrona (R-ST-7).
      patchState(store, { items: readLocalCart() });

      // Al iniciar sesión como comprador, vuelca el carrito local al servidor.
      effect(() => {
        if (authStore.isAuthenticated() && authStore.user()?.role === 'comprador') {
          store.mergeLocalCart(readLocalCart());
        }
      });

      // Persistencia local centralizada y tolerante (R-ST-7). El comprador usa el
      // servidor, así que no se persiste.
      effect(() => {
        const items = store.items();
        const useServer = authStore.isAuthenticated() && authStore.user()?.role === 'comprador';
        if (useServer) return;
        if (items.length === 0) clearLocalCart();
        else writeLocalCart(items);
      });
    },
  }),
);

import { effect, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CreateOrderPayload, OrderResponse } from '../../models/order.model';
import { ORDER_REPOSITORY } from '../../repositories/order.repository';
import type { OrderState } from '../cart/cart.state';

const STORAGE_KEY = 'ecom_last_order';

const initialState: OrderState = {
  lastOrder: null,
};

/**
 * Guarda la última orden devuelta por Core Engine (`POST /orders`) para que la
 * confirmación muestre datos reales (`id`/estado/total) en vez de un número
 * aleatorio. Persiste en `sessionStorage` para sobrevivir a un refresco.
 */
export const OrderStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, orderRepo = inject(ORDER_REPOSITORY)) => ({
    setLastOrder(lastOrder: OrderResponse): void {
      patchState(store, { lastOrder });
    },
    /** Crea la orden y deja su resultado como último pedido (lo usa checkout). */
    placeOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
      return orderRepo
        .createOrder(payload)
        .pipe(tap((order) => patchState(store, { lastOrder: order })));
    },
  })),
  withHooks({
    onInit(store) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) patchState(store, { lastOrder: JSON.parse(raw) as OrderResponse });
      } catch {
        // Sesión de storage no disponible: se ignora y se sigue sin persistencia.
      }

      effect(() => {
        const order = store.lastOrder();
        try {
          if (order) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
          } else {
            sessionStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          // Ignorar fallos de storage (modo privado).
        }
      });
    },
  }),
);

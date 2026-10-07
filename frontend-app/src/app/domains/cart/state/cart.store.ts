import { inject, effect } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
  withHooks,
} from '@ngrx/signals';
import type { Product } from '../../products/public-api';
import { CartItem } from '../models/cart.model';
import { NotificationService } from '../../../shared/ui/notification/notification.service';
import { AVAILABLE_COUPONS } from '../constants/coupons.constants';

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  isSidebarOpen: boolean;
  appliedCoupon: string | null;
  discountPercentage: number;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  isSidebarOpen: false,
  appliedCoupon: null,
  discountPercentage: 0,
};

const CART_STORAGE_KEY = 'ecom_cart_items';

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items, discountPercentage }) => ({
    totalItems: () => items().reduce((acc, item) => acc + item.quantity, 0),
    totalPrice: () => items().reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    discountAmount: () => {
      const total = items().reduce((acc, item) => acc + item.product.price * item.quantity, 0);
      return total * (discountPercentage() / 100);
    },
    finalPrice: () => {
      const total = items().reduce((acc, item) => acc + item.product.price * item.quantity, 0);
      return total - total * (discountPercentage() / 100);
    },
  })),
  withMethods((store, notificationService = inject(NotificationService)) => ({
    addItem(product: Product, quantity = 1) {
      const currentItems = [...store.items()];
      const existingItemIndex = currentItems.findIndex(
        (item) => String(item.product.id) === String(product.id),
      );

      if (existingItemIndex > -1) {
        currentItems[existingItemIndex] = {
          ...currentItems[existingItemIndex],
          quantity: currentItems[existingItemIndex].quantity + quantity,
        };
      } else {
        currentItems.push({ product, quantity });
      }

      patchState(store, { items: currentItems });
    },
    removeItem(productId: string | number) {
      const currentItems = store
        .items()
        .filter((item) => String(item.product.id) !== String(productId));
      patchState(store, { items: currentItems });
      notificationService.showInfo('Producto eliminado del carrito');
    },
    updateQuantity(productId: string | number, quantity: number) {
      if (quantity <= 0) {
        this.removeItem(productId);
        return;
      }
      const currentItems = store
        .items()
        .map((item) =>
          String(item.product.id) === String(productId) ? { ...item, quantity } : item,
        );
      patchState(store, { items: currentItems });
    },
    clearCart() {
      patchState(store, { items: [], appliedCoupon: null, discountPercentage: 0 });
    },
    toggleSidebar(isOpen?: boolean) {
      const nextState = isOpen !== undefined ? isOpen : !store.isSidebarOpen();
      patchState(store, { isSidebarOpen: nextState });
    },
    applyCoupon(code: string) {
      const normalizedCode = code.trim().toUpperCase();
      const matchedCoupon = AVAILABLE_COUPONS[normalizedCode];

      if (matchedCoupon) {
        patchState(store, {
          appliedCoupon: matchedCoupon.code,
          discountPercentage: matchedCoupon.discountPercentage,
        });
        notificationService.showSuccess(
          `¡Cupón del ${matchedCoupon.discountPercentage}% aplicado correctamente!`,
        );
      } else {
        notificationService.showError('Cupón inválido o expirado.');
      }
    },
    removeCoupon() {
      patchState(store, { appliedCoupon: null, discountPercentage: 0 });
      notificationService.showInfo('Cupón removido');
    },
  })),
  withHooks({
    onInit(store) {
      // Load cart items from localStorage on startup
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const items = JSON.parse(stored) as CartItem[];
          patchState(store, { items });
        }
      } catch (e) {
        console.error('Failed to load cart from localStorage', e);
      }

      // Sync changes back to localStorage automatically using an effect
      effect(() => {
        const items = store.items();
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
          console.error('Failed to save cart to localStorage', e);
        }
      });
    },
  }),
);

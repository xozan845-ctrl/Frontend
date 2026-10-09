import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export interface CartUiState {
  isSidebarOpen: boolean;
}

const initialState: CartUiState = { isSidebarOpen: false };

/**
 * Estado de UI del carrito (drawer lateral). Se mantiene separado del
 * `CartStore` de dominio para no mezclar estado efímero con el carrito
 * (`R-ST-6`).
 */
export const CartUiStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    /** Abre/cierra el drawer; con argumento fija el valor. */
    toggleSidebar(isOpen?: boolean): void {
      patchState(store, {
        isSidebarOpen: isOpen !== undefined ? isOpen : !store.isSidebarOpen(),
      });
    },
  })),
);

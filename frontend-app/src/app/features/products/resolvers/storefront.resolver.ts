import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductStore } from '../state/product.store';

/**
 * Carga el storefront de la tienda indicada en la URL (`:storeId`) antes de
 * activar las rutas hijas. Así cada página del storefront dispone de la tienda
 * y sus ofertas sin volver a pedirlas (multi-tienda, `R-AR-12`).
 */
export const storefrontResolver: ResolveFn<void> = (route) => {
  const storeId = route.paramMap.get('storeId');
  const productStore = inject(ProductStore);

  if (!storeId) return Promise.resolve();
  if (productStore.storeId() === storeId && productStore.products().length > 0) {
    return Promise.resolve();
  }

  return productStore.loadStore(storeId);
};

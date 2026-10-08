import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';
import { PRODUCT_REPOSITORY } from '../repositories/product.repository';
import { NotificationService } from '../../../core/services/notification.service';
import { FILTER_CATEGORIES } from '../constants/categories.constants';

export interface ProductState {
  /** Tienda activa (resuelta por URL); `null` fuera del storefront. */
  store: Store | null;
  storeId: string | null;
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  priceMin: number | null;
  priceMax: number | null;
  sortOption: string;
  currentPage: number;
  pageSize: number;
}

const initialState: ProductState = {
  store: null,
  storeId: null,
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  selectedCategory: 'All',
  priceMin: null,
  priceMax: null,
  sortOption: 'default',
  currentPage: 1,
  pageSize: 12,
};

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(
    ({ products, selectedCategory, priceMin, priceMax, sortOption, currentPage, pageSize }) => {
      const categories = () => {
        const prods = products();
        const dynamic = Array.from(
          new Set(prods.map((p) => p.category).filter((c) => Boolean(c && c.trim()))),
        );
        return dynamic.length > 0 ? ['All', ...dynamic] : [...FILTER_CATEGORIES];
      };

      const filteredProducts = () => {
        let prods = products();
        const cat = selectedCategory();
        if (cat !== 'All') {
          prods = prods.filter((p) => p.category.toLowerCase().includes(cat.toLowerCase()));
        }
        const min = priceMin();
        const max = priceMax();
        if (min !== null && min > 0) {
          prods = prods.filter((p) => p.price >= min);
        }
        if (max !== null && max > 0) {
          prods = prods.filter((p) => p.price <= max);
        }
        const sort = sortOption();
        switch (sort) {
          case 'price-asc':
            return [...prods].sort((a, b) => a.price - b.price);
          case 'price-desc':
            return [...prods].sort((a, b) => b.price - a.price);
          case 'name-asc':
            return [...prods].sort((a, b) => a.name.localeCompare(b.name));
          case 'name-desc':
            return [...prods].sort((a, b) => b.name.localeCompare(a.name));
          default:
            return prods;
        }
      };

      const paginatedProducts = () => {
        const items = filteredProducts();
        const start = (currentPage() - 1) * pageSize();
        return items.slice(start, start + pageSize());
      };

      const totalPages = () => Math.max(1, Math.ceil(filteredProducts().length / pageSize()));

      return {
        totalProducts: () => products().length,
        categories,
        filteredProducts,
        paginatedProducts,
        totalPages,
      };
    },
  ),
  withMethods(
    (
      store,
      productRepo = inject(PRODUCT_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      /**
       * Carga la tienda y sus ofertas. Devuelve una promesa para que el resolver
       * de ruta espere antes de activar la página (multi-tienda por URL).
       */
      async loadStore(storeId: string): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const { store: tienda, products } = await firstValueFrom(
            productRepo.getStorefront(storeId),
          );
          patchState(store, {
            store: tienda,
            storeId,
            products,
            loading: false,
            currentPage: 1,
          });
        } catch (err) {
          const message = (err as Error).message || 'Error al cargar la tienda';
          patchState(store, { store: null, storeId, products: [], error: message, loading: false });
          notificationService.showError(message);
        }
      },
      /** Selecciona un producto ya cargado del storefront (sin volver a pedirlo). */
      selectProduct(id: string | number) {
        const found = store.products().find((p) => String(p.id) === String(id)) ?? null;
        patchState(store, { selectedProduct: found });
      },
      clearSelectedProduct() {
        patchState(store, { selectedProduct: null });
      },
      setSelectedCategory(selectedCategory: string) {
        patchState(store, { selectedCategory, currentPage: 1 });
      },
      setPriceMin(priceMin: number | null) {
        patchState(store, { priceMin, currentPage: 1 });
      },
      setPriceMax(priceMax: number | null) {
        patchState(store, { priceMax, currentPage: 1 });
      },
      setSortOption(sortOption: string) {
        patchState(store, { sortOption });
      },
      setPage(page: number) {
        const clampedPage = Math.max(1, Math.min(page, store.totalPages()));
        patchState(store, { currentPage: clampedPage });
      },
      clearFilters() {
        patchState(store, {
          selectedCategory: 'All',
          priceMin: null,
          priceMax: null,
          sortOption: 'default',
          currentPage: 1,
        });
      },
    }),
  ),
  withMethods((store) => ({
    /** Recarga el storefront actual (reintentos). */
    reload(): Promise<void> {
      const id = store.storeId();
      return id ? store.loadStore(id) : Promise.resolve();
    },
  })),
);

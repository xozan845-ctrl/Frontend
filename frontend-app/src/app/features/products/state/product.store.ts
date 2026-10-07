import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { PRODUCT_REPOSITORY } from '../repositories/product.repository';
import { NotificationService } from '../../../shared/ui/notification/notification.service';
import { FILTER_CATEGORIES } from '../constants/categories.constants';

export interface ProductState {
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
      loadProducts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            productRepo.getProducts().pipe(
              tap((products) => {
                patchState(store, { products, loading: false });
              }),
              catchError((err: Error) => {
                const message = err.message || 'Error al cargar los productos';
                patchState(store, { error: message, loading: false });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      loadProductById: rxMethod<string | number>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null, selectedProduct: null })),
          switchMap((id) =>
            productRepo.getProductById(id).pipe(
              tap((product) => {
                patchState(store, { selectedProduct: product, loading: false });
              }),
              catchError((err: Error) => {
                const message = err.message || 'Error al cargar el producto';
                patchState(store, { error: message, loading: false });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
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
);

import type { CatalogProduct, CatalogProductStatus } from '../../models/catalog-product.model';

export interface CatalogProductsState {
  products: CatalogProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  query: string;
  status: CatalogProductStatus | null;
  category: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Último producto creado/actualizado; la página cierra el formulario al verlo. */
  lastSaved: CatalogProduct | null;
}

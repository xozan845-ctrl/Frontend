import type { CatalogProduct } from '../../../products/public-api';
import type {
  CompanyCatalogSort,
  CompanyCatalogStatusFilter,
} from '../../models/company-catalog.model';
import type { CompanyProductMetadata } from '../../models/company-product.model';

export interface CompanyProductsState {
  products: CatalogProduct[];
  metadata: Record<string, CompanyProductMetadata>;
  query: string;
  status: CompanyCatalogStatusFilter;
  brand: string;
  sort: CompanyCatalogSort;
  onlyRawMaterial: boolean;
  page: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Último producto creado/actualizado; la página cierra el modal al verlo. */
  lastSaved: CatalogProduct | null;
}

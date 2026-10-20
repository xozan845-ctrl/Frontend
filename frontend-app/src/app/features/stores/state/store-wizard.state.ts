import type { Store } from '../../products/public-api';
import type { CatalogProductOption } from '../models/store-wizard.model';

export interface StoreWizardState {
  step: number;
  loading: boolean;
  error: string | null;
  store: Store | null;
  catalog: CatalogProductOption[];
  catalogLoading: boolean;
  publishedCount: number;
}

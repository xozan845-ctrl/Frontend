import type { Store } from '../../../products/public-api';

export interface VendorStoreState {
  store: Store | null;
  loading: boolean;
  /** `true` cuando la consulta terminó (permite distinguir "sin tienda" de "cargando"). */
  loaded: boolean;
  error: string | null;
}

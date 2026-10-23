import type { StorageTenant } from '../../models/storage.model';

export interface StorageState {
  tenants: StorageTenant[];
  loading: boolean;
  error: string | null;
  /** Tenant con una actualización de cuota/estado en curso. */
  savingId: string | null;
  /** Tenant con un recálculo de uso en curso. */
  recalculatingId: string | null;
  total: number;
  page: number;
  pages: number;
}

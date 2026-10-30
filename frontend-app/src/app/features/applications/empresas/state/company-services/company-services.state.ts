import type { CompanyCatalogSort } from '../../models/company-catalog.model';
import type { CompanyService, CompanyServiceStatus } from '../../models/company-service.model';

export interface CompanyServicesState {
  services: CompanyService[];
  search: string;
  category: string;
  brand: string;
  status: CompanyServiceStatus | null;
  sort: CompanyCatalogSort;
  page: number;
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Último servicio creado/actualizado; la página cierra el modal al verlo. */
  lastSaved: CompanyService | null;
  /** Último servicio eliminado; la página cierra el diálogo al verlo. */
  lastRemovedId: string | null;
}

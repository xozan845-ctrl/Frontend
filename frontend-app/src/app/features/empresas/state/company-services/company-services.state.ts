import type { CompanyService, CompanyServiceStatus } from '../../models/company-service.model';

export interface CompanyServicesState {
  services: CompanyService[];
  search: string;
  category: string;
  status: CompanyServiceStatus | null;
  page: number;
}

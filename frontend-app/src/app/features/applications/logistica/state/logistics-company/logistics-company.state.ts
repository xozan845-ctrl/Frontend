import type { LogisticsCompany } from '../../models/logistics-company.model';

export interface LogisticsCompanyState {
  company: LogisticsCompany | null;
  saving: boolean;
  error: string | null;
}

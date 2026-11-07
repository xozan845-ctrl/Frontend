import type { Company, CompanySeller } from '../../models/company.model';

export interface CompanyState {
  company: Company | null;
  sellers: CompanySeller[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

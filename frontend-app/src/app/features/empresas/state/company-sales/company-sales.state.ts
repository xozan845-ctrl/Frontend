import type { CatalogProduct } from '../../../products/public-api';
import type {
  CompanySalePaymentFilter,
  CompanySalePeriod,
  CompanySaleRecord,
} from '../../models/company-sale.model';
import type { ClientRecord } from '../../../clients/public-api';
import type { CompanySalesAccount } from '../../models/company-sales.model';
import type { CompanyStore } from '../../models/company-store.model';

export interface CompanySalesState {
  products: CatalogProduct[];
  stores: CompanyStore[];
  salesAccount: CompanySalesAccount | null;
  localSales: CompanySaleRecord[];
  localClients: ClientRecord[];
  productsLoading: boolean;
  period: CompanySalePeriod;
  payment: CompanySalePaymentFilter;
  search: string;
  customFrom: string;
  customTo: string;
  page: number;
  lastCreated: CompanySaleRecord | null;
}

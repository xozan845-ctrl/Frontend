import type { CatalogProduct } from '../../../products/public-api';
import type {
  CompanySalePaymentFilter,
  CompanySalePeriod,
  CompanySaleRecord,
} from '../../models/company-sale.model';
import type { CompanyClientRecord } from '../../models/company-client.model';
import type { CompanySalesAccount } from '../../models/company-sales.model';
import type { CompanyStore } from '../../models/company-store.model';
import type { OrderResponse } from '../../../cart/public-api';

export interface CompanySalesState {
  orders: OrderResponse[];
  products: CatalogProduct[];
  stores: CompanyStore[];
  salesAccount: CompanySalesAccount | null;
  localSales: CompanySaleRecord[];
  localClients: CompanyClientRecord[];
  loading: boolean;
  productsLoading: boolean;
  error: string | null;
  period: CompanySalePeriod;
  payment: CompanySalePaymentFilter;
  search: string;
  customFrom: string;
  customTo: string;
  page: number;
  lastCreated: CompanySaleRecord | null;
}

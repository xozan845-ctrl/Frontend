import type { OrderResponse } from '../../../orders/public-api';
import type { CompanySalesAccount } from '../../models/company-sales.model';
import type { CompanyStore } from '../../models/company-store.model';

export interface CompanyPortalState {
  orders: OrderResponse[];
  sales: CompanySalesAccount | null;
  stores: CompanyStore[];
  ordersLoading: boolean;
  salesLoading: boolean;
  storesLoading: boolean;
  error: string | null;
  selectedOrderId: string | null;
  storeFilter: string | null;
  statusFilter: string | null;
}

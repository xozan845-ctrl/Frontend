import type { OrderResponse } from '../../cart/public-api';
import type { Client } from '../../clients/public-api';
import type { CompanySalesAccount } from './company-sales.model';
import type { CompanyStore } from './company-store.model';

/** Entrada del adaptador que combina órdenes y ventas locales. */
export interface BuildCompanySaleRowsInput {
  orders: readonly OrderResponse[];
  clients: readonly Client[];
  stores: readonly CompanyStore[];
  salesAccount: CompanySalesAccount | null;
  localSales: readonly import('./company-sale.model').CompanySaleRecord[];
}

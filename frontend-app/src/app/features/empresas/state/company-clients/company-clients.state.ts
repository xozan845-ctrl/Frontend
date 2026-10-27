import type { OrderResponse } from '../../../cart/public-api';
import type {
  CompanyClientChip,
  CompanyClientRecord,
  CompanyClientsTab,
} from '../../models/company-client.model';

/** Estado mutable de la cartera de clientes de la empresa. */
export interface CompanyClientsState {
  /** Órdenes de `/orders/empresa`; fuente de los clientes con compras. */
  orders: OrderResponse[];
  /** Cartera local (manual/importada) mientras no exista endpoint backend. */
  localClients: CompanyClientRecord[];
  ordersLoading: boolean;
  error: string | null;
  search: string;
  tab: CompanyClientsTab;
  chip: CompanyClientChip;
  page: number;
}

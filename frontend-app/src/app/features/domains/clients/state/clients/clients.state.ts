import type { ClientChip, ClientOrder, ClientRecord, ClientsTab } from '../../models/client.model';

/** Estado mutable de la cartera de clientes compartida. */
export interface ClientsState {
  /** Órdenes del ámbito activo (empresa o vendedor). */
  orders: ClientOrder[];
  /** Cartera local (manual/importada) mientras no exista endpoint backend. */
  localClients: ClientRecord[];
  ordersLoading: boolean;
  error: string | null;
  search: string;
  tab: ClientsTab;
  chip: ClientChip;
  page: number;
}

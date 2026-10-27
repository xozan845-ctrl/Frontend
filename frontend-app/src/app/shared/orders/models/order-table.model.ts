/** Columnas disponibles en la tabla compartida de pedidos. */
export type OrderTableColumnKey =
  | 'number'
  | 'date'
  | 'client'
  | 'payment'
  | 'products'
  | 'provider'
  | 'total'
  | 'profit'
  | 'status';

export interface OrderTableColumn {
  key: OrderTableColumnKey;
  label: string;
  align?: 'left' | 'right';
}

export interface OrderTableRow {
  id: string;
  number: string;
  numberHref?: string;
  date: string;
  clientName: string;
  paymentLabel?: string;
  productsLabel?: string;
  providerName?: string;
  total: number;
  profit?: number;
  status: string;
}

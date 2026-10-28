/** Tipos internos del adaptador de clientes compartido. */

export interface OrderAggregate {
  buyerId: string;
  ordersCount: number;
  totalSpent: number;
  firstPurchaseAt: string | null;
  firstPurchaseMs: number | null;
  lastPurchaseAt: string | null;
  lastPurchaseMs: number | null;
}

export interface CsvHeaderIndex {
  name: number;
  phone: number;
  email: number;
  company: number;
  buyerId: number;
}

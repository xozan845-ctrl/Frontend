/** Tipos internos del adaptador de clientes de empresa. */

export interface OrderAggregate {
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerCompany: string;
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

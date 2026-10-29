import type {
  PurchaseDocumentSettings,
  PurchaseOrder,
  PurchasePeriod,
  PurchaseRecord,
  PurchaseStatusFilter,
  Supplier,
} from '../../models/purchase.model';

export interface PurchasesState {
  records: PurchaseRecord[];
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  documentSettings: PurchaseDocumentSettings;
  query: string;
  period: PurchasePeriod;
  customFrom: string;
  customTo: string;
  status: PurchaseStatusFilter;
  page: number;
}

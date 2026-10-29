import type {
  CashCategoryFilter,
  CashMovement,
  CashPaymentFilter,
  CashPeriod,
  CashStatusFilter,
  CashTab,
  CashTypeFilter,
} from '../../models/cash.model';

export interface CashState {
  records: CashMovement[];
  tab: CashTab;
  period: CashPeriod;
  type: CashTypeFilter;
  status: CashStatusFilter;
  category: CashCategoryFilter;
  paymentMethod: CashPaymentFilter;
  search: string;
  page: number;
}

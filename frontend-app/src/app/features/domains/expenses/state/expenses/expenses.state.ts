import type { ExpenseRecord, ExpenseType } from '../../models/expense.model';

export interface ExpensesState {
  records: ExpenseRecord[];
  tab: 'all' | 'scheduled';
  type: 'all' | ExpenseType;
  statusFilter: 'all' | 'pendiente' | 'pagado';
  category: string;
  search: string;
  page: number;
}

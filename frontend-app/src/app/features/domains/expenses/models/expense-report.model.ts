import type { ExpenseFilters, ExpenseRecord } from './expense.model';

export interface ExpenseReportExport {
  format: 'excel' | 'pdf';
  records: readonly ExpenseRecord[];
  filters: ExpenseFilters;
}

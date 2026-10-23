import type { FieldEmployee } from '../../models/personal.model';

export interface PersonalState {
  employees: FieldEmployee[];
  loading: boolean;
  error: string | null;
  selectedEmployeeId: string | null;
  query: string;
  statusFilter: string | null;
}

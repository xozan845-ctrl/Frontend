import type { InventoryLine } from '../../models/inventory.model';

export interface InventoryState {
  lines: InventoryLine[];
  loading: boolean;
  error: string | null;
  query: string;
  status: string | null;
}

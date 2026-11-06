import type { StorageBucket, StorageObject } from '../../models/storage.model';

export interface StorageState {
  bucket: StorageBucket | null;
  objects: StorageObject[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  downloadingId: string | null;
  deletingId: string | null;
  pendingDeleteId: string | null;
  query: string;
  statusFilter: string | null;
  downloadUrl: string | null;
}

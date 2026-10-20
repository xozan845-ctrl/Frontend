import type {
  AiJob,
  AiJobExecution,
  AiJobInteractions,
  AiJobResults,
} from '../models/ai-job.model';

export interface AiJobsState {
  items: AiJob[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  statusFilter: string;
  creating: boolean;
  selected: AiJob | null;
  results: AiJobResults | null;
  execution: AiJobExecution | null;
  interactions: AiJobInteractions | null;
  detailLoading: boolean;
  detailError: string | null;
}

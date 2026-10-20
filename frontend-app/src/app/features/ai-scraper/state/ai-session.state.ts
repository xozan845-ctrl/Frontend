import type { AiSession, AiSessionDetail, AiSessionStatus } from '../models/ai-session.model';

export interface AiSessionState {
  sessions: AiSession[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  current: AiSessionDetail | null;
  status: AiSessionStatus | null;
  statusError: string | null;
  detailLoading: boolean;
  sending: boolean;
}

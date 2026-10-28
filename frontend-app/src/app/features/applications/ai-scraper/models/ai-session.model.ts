import { AiJobStatus, AiResultItem } from './ai-job.model';

/** Estado de la radiografía de una sesión (`R-CX-4`). */
export type AiSessionStatus = 'RADIOGRAPHY' | 'READY' | 'FAILED';

/** ¿La radiografía terminó? (READY o FAILED). */
export function isAiSessionSettled(status: string | null | undefined): boolean {
  return status === 'READY' || status === 'FAILED';
}

export interface AiSession {
  id: string;
  url: string;
  domain: string;
  status: AiSessionStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiSessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  jobId: string | null;
  jobStatus: AiJobStatus | null;
  results: AiResultItem[] | null;
  createdAt?: string;
}

/** Perfil aprendido del dominio (memoria del backend). */
export interface AiSessionProfile {
  domain?: string;
  isJavaScriptHeavy?: boolean;
  selectors?: unknown;
  stats?: {
    totalJobs?: number;
    successfulJobs?: number;
  };
}

export interface AiSessionDetail extends AiSession {
  messages: AiSessionMessage[];
  profile: AiSessionProfile | null;
}

export interface AiSessionStatusResponse {
  id: string;
  status: AiSessionStatus;
  error: string | null;
}

/** Entrada de aplicación para crear una sesión (URL + credenciales opcionales). */
export interface AiCreateSessionInput {
  url: string;
  credentials?: {
    headers?: Record<string, string>;
  };
}

export interface AiSendMessageResult {
  message: AiSessionMessage;
  jobId: string;
  jobStatus: AiJobStatus;
}

import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AiCreateSessionInput,
  AiSendMessageResult,
  AiSession,
  AiSessionDetail,
  AiSessionStatusResponse,
} from '../models/ai-session.model';

/**
 * Puerto de sesiones tipo "chat" del backend de IA (`R-AR-3`, `R-SO-4`).
 * Una sesión es una URL analizada con su contexto (radiografía) e historial.
 */
export interface AiSessionRepository {
  /** Crea una sesión (URL + credenciales opcionales) y lanza la radiografía. */
  createSession(input: AiCreateSessionInput): Observable<AiSession>;
  /** Historial de sesiones del usuario. */
  listSessions(): Observable<AiSession[]>;
  /** Detalle con mensajes enriquecidos y perfil aprendido. */
  getSession(id: string): Observable<AiSessionDetail>;
  /** Estado de la radiografía (`RADIOGRAPHY|READY|FAILED`). */
  getStatus(id: string): Observable<AiSessionStatusResponse>;
  /** Envía una instrucción (crea un job con el contexto de la sesión). */
  sendMessage(id: string, instruction: string): Observable<AiSendMessageResult>;
}

export const AI_SESSION_REPOSITORY = new InjectionToken<AiSessionRepository>('AiSessionRepository');

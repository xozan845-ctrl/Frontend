import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AiCreateSessionInput,
  AiSendMessageResult,
  AiSession,
  AiSessionDetail,
  AiSessionStatusResponse,
} from '../models/ai-session.model';
import { AiSessionRepository } from '../repositories/ai-session.repository';
import { AI_SCRAPER_ENDPOINTS } from '../constants/ai-scraper.constants';
import {
  adaptSendMessageFromBackend,
  adaptSessionDetailFromBackend,
  adaptSessionFromBackend,
  adaptSessionListFromBackend,
  adaptSessionStatusResponseFromBackend,
} from '../adapters/ai-scraper.adapter';
import { AiScraperClient } from './ai-scraper-client.service';
import { fail, requireValue } from './ai-scraper-error';

/** Convierte la entrada de dominio al cuerpo que espera `POST /sessions`. */
function toBackendSessionPayload(input: AiCreateSessionInput): Record<string, unknown> {
  const body: Record<string, unknown> = { url: input.url };
  const headers = input.credentials?.headers;
  if (headers && Object.keys(headers).length > 0) {
    body['credentials'] = { headers };
  }
  return body;
}

/** Implementación HTTP del puerto de sesiones (`R-CX-2`). */
@Injectable({
  providedIn: 'root',
})
export class AiSessionService implements AiSessionRepository {
  private readonly client = inject(AiScraperClient);

  createSession(input: AiCreateSessionInput): Observable<AiSession> {
    return this.client.post(AI_SCRAPER_ENDPOINTS.sessions, toBackendSessionPayload(input)).pipe(
      map((raw) =>
        requireValue(adaptSessionFromBackend(raw), 'El backend devolvió una sesión inválida.'),
      ),
      fail('No se pudo crear la sesión.'),
    );
  }

  listSessions(): Observable<AiSession[]> {
    return this.client
      .get(AI_SCRAPER_ENDPOINTS.sessions)
      .pipe(map(adaptSessionListFromBackend), fail('No se pudieron cargar las sesiones.'));
  }

  getSession(id: string): Observable<AiSessionDetail> {
    return this.client.get(`${AI_SCRAPER_ENDPOINTS.sessions}/${id}`).pipe(
      map((raw) => requireValue(adaptSessionDetailFromBackend(raw), 'Sesión no encontrada.')),
      fail('No se pudo cargar la sesión.'),
    );
  }

  getStatus(id: string): Observable<AiSessionStatusResponse> {
    return this.client.get(`${AI_SCRAPER_ENDPOINTS.sessions}/${id}/status`).pipe(
      map((raw) =>
        requireValue(adaptSessionStatusResponseFromBackend(raw), 'Estado no disponible.'),
      ),
      fail('No se pudo consultar el estado de la sesión.'),
    );
  }

  sendMessage(id: string, instruction: string): Observable<AiSendMessageResult> {
    return this.client
      .post(`${AI_SCRAPER_ENDPOINTS.sessions}/${id}/messages`, { instruction })
      .pipe(
        map((raw) =>
          requireValue(
            adaptSendMessageFromBackend(raw),
            'Respuesta inválida al enviar el mensaje.',
          ),
        ),
        fail('No se pudo enviar el mensaje.'),
      );
  }
}

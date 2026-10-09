import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiSessionService } from './ai-session.service';
import { AiScraperClient } from './ai-scraper-client.service';
import {
  BACKEND_SEND_MESSAGE,
  BACKEND_SESSION,
  BACKEND_SESSION_DETAIL,
  BACKEND_SESSION_LIST,
  BACKEND_SESSION_STATUS,
} from '../adapters/fixtures/ai-scraper.fixture';

const BASE = 'http://localhost:3000/api/v1';

describe('AiSessionService', () => {
  let service: AiSessionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AiScraperClient,
        AiSessionService,
      ],
    });
    service = TestBed.inject(AiSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crear una sesión enviando url y credenciales opcionales', () => {
    service
      .createSession({
        url: 'https://x.test',
        credentials: { headers: { Authorization: 'Bearer t' } },
      })
      .subscribe();
    const req = httpMock.expectOne(`${BASE}/sessions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      url: 'https://x.test',
      credentials: { headers: { Authorization: 'Bearer t' } },
    });
    req.flush(BACKEND_SESSION);
  });

  it('no debe enviar credentials cuando no hay headers', () => {
    service.createSession({ url: 'https://x.test' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/sessions`);
    expect(req.request.body).toEqual({ url: 'https://x.test' });
    req.flush(BACKEND_SESSION);
  });

  it('debe listar el historial de sesiones', () => {
    service.listSessions().subscribe();
    httpMock.expectOne(`${BASE}/sessions`).flush(BACKEND_SESSION_LIST);
  });

  it('debe cargar el detalle de la sesión con mensajes y perfil', () => {
    let detail: unknown;
    service.getSession('sess-1').subscribe((d) => (detail = d));
    httpMock.expectOne(`${BASE}/sessions/sess-1`).flush(BACKEND_SESSION_DETAIL);
    expect((detail as { messages: unknown[] }).messages).toHaveLength(2);
  });

  it('debe consultar el estado de la radiografía', () => {
    service.getStatus('sess-1').subscribe();
    httpMock.expectOne(`${BASE}/sessions/sess-1/status`).flush(BACKEND_SESSION_STATUS);
  });

  it('debe enviar un mensaje y devolver el job creado', () => {
    service.sendMessage('sess-1', 'Obtén los productos').subscribe();
    const req = httpMock.expectOne(`${BASE}/sessions/sess-1/messages`);
    expect(req.request.body).toEqual({ instruction: 'Obtén los productos' });
    req.flush(BACKEND_SEND_MESSAGE);
  });

  it('debe traducir el 409 (sesión no lista) a un mensaje de dominio', () => {
    let error: Error | undefined;
    service.sendMessage('sess-1', 'x').subscribe({ error: (err: Error) => (error = err) });
    httpMock
      .expectOne(`${BASE}/sessions/sess-1/messages`)
      .flush(
        { message: 'La sesión no está lista (radiografía en curso o fallida)' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(error?.message).toContain('no está lista');
  });
});

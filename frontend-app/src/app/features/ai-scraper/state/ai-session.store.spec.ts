import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AiSessionStore } from './ai-session.store';
import { AI_SESSION_REPOSITORY } from '../repositories/ai-session.repository';
import { AI_JOB_REPOSITORY } from '../repositories/ai-job.repository';
import { NotificationService } from '../../../core/services/notification.service';
import { AiSessionDetail } from '../models/ai-session.model';
import { AiJob } from '../models/ai-job.model';

const DETAIL: AiSessionDetail = {
  id: 'sess-1',
  url: 'https://x.test',
  domain: 'x.test',
  status: 'READY',
  error: null,
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
  messages: [
    { id: 'm-1', role: 'user', content: 'hola', jobId: null, jobStatus: null, results: null },
  ],
  profile: null,
};

const JOB: AiJob = {
  id: 'job-1',
  url: 'https://x.test',
  instruction: 'hola',
  status: 'COMPLETED',
  aiProvider: 'openrouter',
  aiModel: null,
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
  limits: null,
};

function makeSessionRepo() {
  return {
    createSession: vi.fn(),
    listSessions: vi.fn(),
    getSession: vi.fn(),
    getStatus: vi.fn(),
    sendMessage: vi.fn(),
  };
}

function makeJobRepo() {
  return { getJob: vi.fn() };
}

describe('AiSessionStore', () => {
  let store: InstanceType<typeof AiSessionStore>;
  let sessionRepo: ReturnType<typeof makeSessionRepo>;
  let jobRepo: ReturnType<typeof makeJobRepo>;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    sessionRepo = makeSessionRepo();
    jobRepo = makeJobRepo();
    TestBed.configureTestingModule({
      providers: [
        AiSessionStore,
        { provide: AI_SESSION_REPOSITORY, useValue: sessionRepo },
        { provide: AI_JOB_REPOSITORY, useValue: jobRepo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    store = TestBed.inject(AiSessionStore);
    sessionRepo.getStatus.mockReturnValue(of({ id: 'sess-1', status: 'READY', error: null }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar el historial de sesiones', () => {
    sessionRepo.listSessions.mockReturnValue(of([DETAIL]));
    store.loadSessions();
    expect(store.sessions()).toHaveLength(1);
  });

  it('debe crear una sesión y habilitar el chat al pasar a READY', () => {
    sessionRepo.createSession.mockReturnValue(
      of({ ...DETAIL, status: 'RADIOGRAPHY', messages: [], profile: null }),
    );
    sessionRepo.getStatus.mockReturnValue(of({ id: 'sess-1', status: 'READY', error: null }));
    sessionRepo.getSession.mockReturnValue(of(DETAIL));

    store.createSession({ url: 'https://x.test' });
    vi.runAllTimers();

    expect(store.isReady()).toBe(true);
    expect(store.canSend()).toBe(true);
    expect(store.messages()).toHaveLength(1);
  });

  it('debe enviar un mensaje y refrescar el detalle al terminar el job', () => {
    sessionRepo.getSession.mockReturnValue(of(DETAIL));
    store.openSession('sess-1');
    sessionRepo.getStatus.mockReturnValue(of({ id: 'sess-1', status: 'READY', error: null }));
    vi.runAllTimers();

    sessionRepo.sendMessage.mockReturnValue(
      of({ message: DETAIL.messages[0], jobId: 'job-1', jobStatus: 'QUEUED' }),
    );
    jobRepo.getJob.mockReturnValue(of(JOB));

    store.sendMessage('obtén los productos');
    vi.runAllTimers();

    expect(sessionRepo.sendMessage).toHaveBeenCalledWith('sess-1', 'obtén los productos');
    expect(store.sending()).toBe(false);
  });

  it('debe exponer el error cuando falla la creación de la sesión', () => {
    sessionRepo.createSession.mockReturnValue(throwError(() => new Error('radiografía imposible')));
    store.createSession({ url: 'https://x.test' });
    expect(store.error()).toBe('radiografía imposible');
    expect(notification.showError).toHaveBeenCalledWith('radiografía imposible');
  });

  it('debe exponer el error al abrir una sesión inexistente', () => {
    sessionRepo.getSession.mockReturnValue(throwError(() => new Error('sesión no encontrada')));
    store.openSession('nope');
    expect(store.statusError()).toBe('sesión no encontrada');
  });

  it('debe limpiar la sesión activa', () => {
    sessionRepo.getSession.mockReturnValue(of(DETAIL));
    store.openSession('sess-1');
    store.clearCurrent();
    expect(store.current()).toBeNull();
    expect(store.status()).toBeNull();
  });

  it('debe exponer el perfil aprendido en el derivado profile', () => {
    sessionRepo.getSession.mockReturnValue(of({ ...DETAIL, profile: { domain: 'x.test' } }));
    store.openSession('sess-1');
    expect(store.profile()?.domain).toBe('x.test');
  });

  it('no debe permitir enviar mientras la sesión no está lista', () => {
    expect(store.canSend()).toBe(false);
  });
});

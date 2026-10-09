import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AiJobsStore } from './ai-jobs.store';
import { AI_JOB_REPOSITORY } from '../repositories/ai-job.repository';
import { NotificationService } from '../../../core/services/notification.service';
import { AiJob } from '../models/ai-job.model';
import { BACKEND_JOB_CAMEL } from '../adapters/fixtures/ai-scraper.fixture';

const BASE_JOB: AiJob = {
  id: 'job-1',
  url: 'https://x.test',
  instruction: 'extrae',
  status: 'QUEUED',
  aiProvider: 'openrouter',
  aiModel: null,
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
  limits: null,
};

function makeRepo() {
  return {
    createJob: vi.fn(),
    listJobs: vi.fn(),
    getJob: vi.fn(),
    getResults: vi.fn(),
    getExecution: vi.fn(),
    getInteractions: vi.fn(),
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
  };
}

describe('AiJobsStore', () => {
  let store: InstanceType<typeof AiJobsStore>;
  let repo: ReturnType<typeof makeRepo>;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    repo = makeRepo();
    TestBed.configureTestingModule({
      providers: [
        AiJobsStore,
        { provide: AI_JOB_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    store = TestBed.inject(AiJobsStore);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar la lista de jobs al iniciar', () => {
    repo.listJobs.mockReturnValue(of({ items: [BASE_JOB], nextCursor: 'c1' }));
    store.loadJobs();
    expect(store.items()).toHaveLength(1);
    expect(store.nextCursor()).toBe('c1');
    expect(store.loading()).toBe(false);
  });

  it('debe mostrar un error de dominio cuando la lista falla', () => {
    repo.listJobs.mockReturnValue(throwError(() => new Error('sin conexión')));
    store.loadJobs();
    expect(store.error()).toBe('sin conexión');
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');
  });

  it('debe insertar el job creado al frente y marcarlo como seleccionado', () => {
    repo.createJob.mockReturnValue(of(BASE_JOB));
    repo.getJob.mockReturnValue(of({ ...BASE_JOB, status: 'COMPLETED' }));
    repo.getResults.mockReturnValue(
      of({ jobId: 'job-1', status: 'COMPLETED', count: 0, items: [] }),
    );

    store.createJob({ url: 'https://x.test', instruction: 'extrae' });

    expect(store.items()).toHaveLength(1);
    expect(store.selected()?.id).toBe('job-1');
    expect(repo.createJob).toHaveBeenCalledOnce();
  });

  it('debe hacer polling hasta el estado terminal y cargar los resultados', () => {
    repo.createJob.mockReturnValue(of(BASE_JOB));
    repo.getJob
      .mockReturnValueOnce(of({ ...BASE_JOB, status: 'EXECUTING' }))
      .mockReturnValue(of({ ...BASE_JOB, status: 'COMPLETED' }));
    repo.getResults.mockReturnValue(
      of({ jobId: 'job-1', status: 'COMPLETED', count: 1, items: [{ name: 'x' }] }),
    );

    store.createJob({ url: 'https://x.test', instruction: 'extrae' });
    vi.runAllTimers();

    expect(store.selected()?.status).toBe('COMPLETED');
    expect(store.results()?.count).toBe(1);
  });

  it('debe filtrar por estado y recargar', () => {
    repo.listJobs.mockReturnValue(of({ items: [BASE_JOB], nextCursor: null }));
    store.setStatusFilter('FAILED');
    expect(store.statusFilter()).toBe('FAILED');
    expect(repo.listJobs).toHaveBeenCalledWith({ limit: 50, status: 'FAILED' });
  });

  it('debe cancelar el job seleccionado', () => {
    repo.createJob.mockReturnValue(of(BASE_JOB));
    repo.getJob.mockReturnValue(of({ ...BASE_JOB, status: 'COMPLETED' }));
    repo.getResults.mockReturnValue(
      of({ jobId: 'job-1', status: 'COMPLETED', count: 0, items: [] }),
    );
    store.createJob({ url: 'https://x.test', instruction: 'extrae' });
    vi.runAllTimers();

    repo.cancelJob.mockReturnValue(of({ ...BASE_JOB, status: 'CANCELLED' }));
    store.cancelSelected();
    expect(store.selected()?.status).toBe('CANCELLED');
    expect(notification.showInfo).toHaveBeenCalled();
  });

  it('debe exponer el fixture del backend adaptado sin romper', () => {
    repo.listJobs.mockReturnValue(of({ items: [{ id: BACKEND_JOB_CAMEL.id }], nextCursor: null }));
    store.loadJobs();
    expect(store.total()).toBe(1);
  });

  it('debe cargar más jobs usando el cursor', () => {
    repo.listJobs.mockReturnValueOnce(of({ items: [BASE_JOB], nextCursor: 'c1' }));
    store.loadJobs();
    repo.listJobs.mockReturnValueOnce(
      of({ items: [{ ...BASE_JOB, id: 'job-2' }], nextCursor: null }),
    );
    store.loadMore();
    expect(store.items()).toHaveLength(2);
    expect(repo.listJobs).toHaveBeenLastCalledWith({ limit: 50, cursor: 'c1', status: undefined });
  });

  it('no debe pedir más jobs cuando no hay cursor', () => {
    repo.listJobs.mockReturnValue(of({ items: [BASE_JOB], nextCursor: null }));
    store.loadJobs();
    repo.listJobs.mockClear();
    store.loadMore();
    expect(repo.listJobs).not.toHaveBeenCalled();
  });

  it('debe filtrar los jobs por estado en el derivado filtered', () => {
    repo.listJobs.mockReturnValue(
      of({
        items: [
          { ...BASE_JOB, status: 'FAILED' },
          { ...BASE_JOB, id: 'job-2', status: 'COMPLETED' },
        ],
        nextCursor: null,
      }),
    );
    store.loadJobs();
    expect(store.filtered()).toHaveLength(2);
    store.setStatusFilter('FAILED');
    expect(store.filtered()).toHaveLength(1);
  });

  it('debe exponer si el job seleccionado sigue activo', () => {
    repo.createJob.mockReturnValue(of({ ...BASE_JOB, status: 'EXECUTING' }));
    repo.getJob.mockReturnValue(of({ ...BASE_JOB, status: 'COMPLETED' }));
    repo.getResults.mockReturnValue(
      of({ jobId: 'job-1', status: 'COMPLETED', count: 0, items: [] }),
    );
    store.createJob({ url: 'https://x.test', instruction: 'x' });
    expect(store.isSelectedActive()).toBe(true);
  });

  it('debe limpiar el job seleccionado', () => {
    repo.createJob.mockReturnValue(of(BASE_JOB));
    repo.getJob.mockReturnValue(of({ ...BASE_JOB, status: 'COMPLETED' }));
    repo.getResults.mockReturnValue(
      of({ jobId: 'job-1', status: 'COMPLETED', count: 0, items: [] }),
    );
    store.createJob({ url: 'https://x.test', instruction: 'x' });
    store.clearSelected();
    expect(store.selected()).toBeNull();
    expect(store.results()).toBeNull();
  });

  it('debe exponer el error cuando falla la creación del job', () => {
    repo.createJob.mockReturnValue(throwError(() => new Error('cuota excedida')));
    store.createJob({ url: 'https://x.test', instruction: 'x' });
    expect(store.error()).toBe('cuota excedida');
  });

  it('no debe cancelar si no hay job seleccionado', () => {
    store.cancelSelected();
    expect(repo.cancelJob).not.toHaveBeenCalled();
  });

  it('debe reintentar el job seleccionado', () => {
    repo.createJob.mockReturnValue(of(BASE_JOB));
    repo.getJob.mockReturnValue(of({ ...BASE_JOB, status: 'FAILED' }));
    repo.getResults.mockReturnValue(of({ jobId: 'job-1', status: 'FAILED', count: 0, items: [] }));
    store.createJob({ url: 'https://x.test', instruction: 'x' });
    vi.runAllTimers();
    repo.retryJob.mockReturnValue(of({ ...BASE_JOB, status: 'QUEUED' }));
    store.retrySelected();
    expect(store.selected()?.status).toBe('QUEUED');
  });
});

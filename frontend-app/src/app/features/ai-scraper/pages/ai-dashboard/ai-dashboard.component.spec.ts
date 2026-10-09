import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiDashboardComponent from './ai-dashboard.component';
import { AiJobsStore } from '../../state/ai-jobs.store';
import { AiMetricsStore } from '../../state/ai-metrics.store';
import { AiConnectionService } from '../../services/ai-connection.service';
import { AiJob } from '../../models/ai-job.model';

function jobsStoreFake() {
  return {
    creating: signal(false),
    statusFilter: signal('ALL'),
    loading: signal(false),
    error: signal<string | null>(null),
    filtered: signal<AiJob[]>([]),
    loadJobs: vi.fn(),
    setStatusFilter: vi.fn(),
    createJob: vi.fn(),
  };
}

function connectionFake() {
  return {
    endpoint: 'http://localhost:3000/api/v1',
    hasKey: signal(false),
    setApiKey: vi.fn(),
    clearApiKey: vi.fn(),
  };
}

describe('AiDashboardComponent', () => {
  let jobs: ReturnType<typeof jobsStoreFake>;
  let connection: ReturnType<typeof connectionFake>;

  beforeEach(() => {
    jobs = jobsStoreFake();
    connection = connectionFake();
    TestBed.configureTestingModule({
      imports: [AiDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AiJobsStore, useValue: jobs },
        { provide: AiMetricsStore, useValue: { metrics: signal(null), load: vi.fn() } },
        { provide: AiConnectionService, useValue: connection },
      ],
    });
  });

  it('debe cargar los jobs al iniciar', () => {
    const fixture = TestBed.createComponent(AiDashboardComponent);
    fixture.detectChanges();
    expect(jobs.loadJobs).toHaveBeenCalled();
  });

  it('no debe crear un job cuando el formulario es inválido', () => {
    const fixture = TestBed.createComponent(AiDashboardComponent);
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(jobs.createJob).not.toHaveBeenCalled();
  });

  it('debe crear un job con los datos válidos del formulario', () => {
    const fixture = TestBed.createComponent(AiDashboardComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ url: 'https://x.test', instruction: 'extrae' });
    fixture.componentInstance.submit();
    expect(jobs.createJob).toHaveBeenCalledWith({ url: 'https://x.test', instruction: 'extrae' });
  });

  it('debe guardar y olvidar la API key', () => {
    const fixture = TestBed.createComponent(AiDashboardComponent);
    fixture.detectChanges();
    fixture.componentInstance.saveKey('secret');
    fixture.componentInstance.clearKey();
    expect(connection.setApiKey).toHaveBeenCalledWith('secret');
    expect(connection.clearApiKey).toHaveBeenCalled();
  });
});

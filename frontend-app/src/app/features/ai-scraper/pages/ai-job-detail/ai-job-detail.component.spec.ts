import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiJobDetailComponent from './ai-job-detail.component';
import { AiJobsStore } from '../../state/ai-jobs.store';
import { AiJob } from '../../models/ai-job.model';

const JOB: AiJob = {
  id: 'job-1',
  url: 'https://x.test',
  instruction: 'extrae',
  status: 'COMPLETED',
  aiProvider: 'openrouter',
  aiModel: null,
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:00:00.000Z',
  limits: null,
};

function jobsStoreFake() {
  return {
    selected: signal<AiJob | null>(JOB),
    detailLoading: signal(false),
    detailError: signal<string | null>(null),
    isSelectedActive: signal(false),
    results: signal<{ items: unknown[] } | null>({ items: [] }),
    execution: signal<{ commands: unknown[]; pages: unknown[]; errors: unknown[] } | null>(null),
    interactions: signal<{
      provider: string;
      model: string | null;
      count: number;
      calls: unknown[];
    } | null>(null),
    selectJob: vi.fn(),
    clearSelected: vi.fn(),
    cancelSelected: vi.fn(),
    retrySelected: vi.fn(),
  };
}

describe('AiJobDetailComponent', () => {
  let store: ReturnType<typeof jobsStoreFake>;

  beforeEach(() => {
    store = jobsStoreFake();
    TestBed.configureTestingModule({
      imports: [AiJobDetailComponent],
      providers: [provideRouter([]), { provide: AiJobsStore, useValue: store }],
    });
  });

  it('debe cargar el job indicado por la ruta', () => {
    const fixture = TestBed.createComponent(AiJobDetailComponent);
    fixture.componentRef.setInput('id', 'job-1');
    fixture.detectChanges();
    expect(store.selectJob).toHaveBeenCalledWith('job-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('https://x.test');
  });

  it('debe cambiar de pestaña', () => {
    const fixture = TestBed.createComponent(AiJobDetailComponent);
    fixture.componentRef.setInput('id', 'job-1');
    fixture.detectChanges();
    fixture.componentInstance.setTab('execution');
    expect(fixture.componentInstance.tab()).toBe('execution');
  });

  it('debe limpiar el job seleccionado al destruirse', () => {
    const fixture = TestBed.createComponent(AiJobDetailComponent);
    fixture.componentRef.setInput('id', 'job-1');
    fixture.detectChanges();
    fixture.destroy();
    expect(store.clearSelected).toHaveBeenCalled();
  });
});

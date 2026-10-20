import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiDashboardComponent from './ai-dashboard.component';
import { AiConnectionStore } from '../../state/ai-connection/ai-connection.store';

function connectionFake() {
  return {
    endpoint: 'http://localhost:3000/api/v1',
    hasKey: signal(false),
    setApiKey: vi.fn(),
    clearApiKey: vi.fn(),
  };
}

describe('AiDashboardComponent', () => {
  let connection: ReturnType<typeof connectionFake>;

  beforeEach(() => {
    connection = connectionFake();
    TestBed.configureTestingModule({
      imports: [AiDashboardComponent],
      providers: [provideRouter([]), { provide: AiConnectionStore, useValue: connection }],
    });
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

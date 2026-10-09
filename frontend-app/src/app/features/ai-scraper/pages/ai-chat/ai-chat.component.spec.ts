import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiChatComponent from './ai-chat.component';
import { AiSessionStore } from '../../state/ai-session.store';
import { AiSessionDetail } from '../../models/ai-session.model';

function sessionStoreFake() {
  return {
    sessions: signal([]),
    creating: signal(false),
    current: signal<AiSessionDetail | null>(null),
    status: signal<string | null>(null),
    statusError: signal<string | null>(null),
    sending: signal(false),
    messages: signal([]),
    isReady: signal(false),
    isFailed: signal(false),
    canSend: signal(false),
    loadSessions: vi.fn(),
    createSession: vi.fn(),
    openSession: vi.fn(),
    sendMessage: vi.fn(),
    clearCurrent: vi.fn(),
  };
}

describe('AiChatComponent', () => {
  let store: ReturnType<typeof sessionStoreFake>;

  beforeEach(() => {
    store = sessionStoreFake();
    TestBed.configureTestingModule({
      imports: [AiChatComponent],
      providers: [provideRouter([]), { provide: AiSessionStore, useValue: store }],
    });
  });

  it('debe cargar el historial de sesiones al iniciar', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    expect(store.loadSessions).toHaveBeenCalled();
  });

  it('debe crear una sesión con credenciales cuando los headers son JSON válidos', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.createForm.setValue({
      url: 'https://x.test',
      headers: '{"Authorization":"Bearer t"}',
    });
    fixture.componentInstance.createSession();
    expect(store.createSession).toHaveBeenCalledWith({
      url: 'https://x.test',
      credentials: { headers: { Authorization: 'Bearer t' } },
    });
  });

  it('debe crear una sesión sin credenciales cuando los headers son inválidos', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.createForm.setValue({ url: 'https://x.test', headers: 'no-json' });
    fixture.componentInstance.createSession();
    expect(store.createSession).toHaveBeenCalledWith({ url: 'https://x.test' });
  });

  it('no debe enviar si el formulario es inválido', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.send();
    expect(store.sendMessage).not.toHaveBeenCalled();
  });

  it('debe enviar la instrucción cuando el formulario es válido', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.messageForm.setValue({ instruction: 'obtén los productos' });
    fixture.componentInstance.send();
    expect(store.sendMessage).toHaveBeenCalledWith('obtén los productos');
  });
});

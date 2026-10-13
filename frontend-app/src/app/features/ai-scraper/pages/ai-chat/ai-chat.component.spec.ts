import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiChatComponent from './ai-chat.component';
import { AiSessionStore } from '../../state/ai-session.store';
import { AiSession, AiSessionDetail } from '../../models/ai-session.model';

const DAY_MS = 24 * 60 * 60 * 1000;

function session(partial: Partial<AiSession>): AiSession {
  const now = new Date().toISOString();
  return {
    id: 's1',
    url: 'https://sitio.test/',
    domain: 'sitio.test',
    status: 'READY',
    error: null,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function sessionStoreFake() {
  return {
    sessions: signal<AiSession[]>([]),
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

  it('debe filtrar el historial por el término de búsqueda', () => {
    store.sessions.set([
      session({ id: '1', domain: 'libreria.test', url: 'https://libreria.test/' }),
      session({ id: '2', domain: 'cafeterias.test', url: 'https://cafeterias.test/' }),
    ]);
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.search.set('caf');
    expect(fixture.componentInstance.filteredSessions().map((s) => s.id)).toEqual(['2']);
  });

  it('debe agrupar las conversaciones por antigüedad', () => {
    const now = Date.now();
    store.sessions.set([
      session({ id: 'hoy', createdAt: new Date(now).toISOString() }),
      session({ id: 'semana', createdAt: new Date(now - 3 * DAY_MS).toISOString() }),
      session({ id: 'vieja', createdAt: new Date(now - 30 * DAY_MS).toISOString() }),
    ]);
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    const groups = fixture.componentInstance.sessionGroups();
    expect(groups.map((g) => g.label)).toEqual(['Hoy', 'Últimos 7 días', 'Anteriores']);
    expect(groups.map((g) => g.items.map((s) => s.id))).toEqual([['hoy'], ['semana'], ['vieja']]);
  });

  it('debe rellenar la URL cuando se elige una sugerencia', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.applySuggestion('https://books.toscrape.com/');
    expect(fixture.componentInstance.createForm.controls.url.value).toBe(
      'https://books.toscrape.com/',
    );
  });

  it('debe reiniciar la conversación activa al pulsar nueva conversación', () => {
    const fixture = TestBed.createComponent(AiChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.newConversation();
    expect(store.clearCurrent).toHaveBeenCalled();
  });
});

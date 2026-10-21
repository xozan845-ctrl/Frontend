import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe añadir mensajes con su tipo', () => {
    service.showSuccess('ok');
    service.showError('fallo');
    service.showInfo('info');

    expect(service.messages().map((message) => message.type)).toEqual(['success', 'error', 'info']);
  });

  it('debe eliminar un mensaje al descartarlo', () => {
    service.showSuccess('ok');
    const [message] = service.messages();

    service.dismiss(message.id);

    expect(service.messages()).toEqual([]);
  });

  it('debe auto-descartar el mensaje tras 4 segundos', () => {
    vi.useFakeTimers();
    service.showSuccess('ok');

    vi.advanceTimersByTime(4000);

    expect(service.messages()).toEqual([]);
  });
});

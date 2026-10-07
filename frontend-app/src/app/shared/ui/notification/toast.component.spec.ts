import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  const messages = vi.fn(() => [
    { id: 1, message: 'Guardado', type: 'success' as const },
    { id: 2, message: 'Algo falló', type: 'error' as const },
  ]);
  const dismiss = vi.fn();
  const notificationService = { messages, dismiss };

  const setup = () => {
    TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: NotificationService, useValue: notificationService }],
    });
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => vi.clearAllMocks());

  it('debe renderizar las notificaciones como región viva', () => {
    const fixture = setup();
    const toasts = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="status"]');

    expect(toasts.length).toBe(2);
    expect(toasts[0].getAttribute('aria-live')).toBe('polite');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Guardado');
  });

  it('debe descartar la notificación al pulsar su cierre', () => {
    const fixture = setup();
    const close = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.trim() === '×')!;

    close.click();

    expect(dismiss).toHaveBeenCalledWith(1);
  });
});

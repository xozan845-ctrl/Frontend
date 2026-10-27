import { TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  const setup = async (open = true, working = false, tone: 'primary' | 'danger' = 'primary') => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConfirmModalComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('title', 'Cambiar estado');
    fixture.componentRef.setInput('message', '¿Marcar el pedido como completado?');
    fixture.componentRef.setInput('confirmLabel', 'Marcar completado');
    fixture.componentRef.setInput('working', working);
    fixture.componentRef.setInput('tone', tone);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('no debe renderizar el diálogo mientras está cerrado', async () => {
    const fixture = await setup(false);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="confirm-modal"]'),
    ).toBeNull();
  });

  it('debe mostrar el mensaje con el rol de alerta y confirmar', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let confirmed = 0;
    fixture.componentInstance.confirmed.subscribe(() => confirmed++);

    const dialog = host.querySelector('[data-testid="confirm-dialog"]') as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(dialog.textContent).toContain('Cambiar estado');
    expect(dialog.textContent).toContain('¿Marcar el pedido como completado?');
    expect(
      (host.querySelector('[data-testid="confirm-accept"]') as HTMLElement).className,
    ).toContain('btn-primary');

    (host.querySelector('[data-testid="confirm-accept"]') as HTMLButtonElement).click();
    expect(confirmed).toBe(1);
  });

  it('debe cerrar con Cancelar y con Escape', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let dismissed = 0;
    fixture.componentInstance.dismissed.subscribe(() => dismissed++);

    (host.querySelector('[data-testid="confirm-cancel"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="confirm-dialog"]') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );

    expect(dismissed).toBe(2);
  });

  it('debe bloquear las acciones y avisar con el tono de peligro mientras trabaja', async () => {
    const fixture = await setup(true, true, 'danger');
    const host = fixture.nativeElement as HTMLElement;
    let confirmed = 0;
    let dismissed = 0;
    fixture.componentInstance.confirmed.subscribe(() => confirmed++);
    fixture.componentInstance.dismissed.subscribe(() => dismissed++);

    const accept = host.querySelector('[data-testid="confirm-accept"]') as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    expect(accept.textContent).toContain('Procesando…');
    expect(accept.className).toContain('btn-danger');
    expect(
      (host.querySelector('[data-testid="confirm-cancel"]') as HTMLButtonElement).disabled,
    ).toBe(true);

    accept.click();
    expect(confirmed).toBe(0);
    expect(dismissed).toBe(0);
  });
});

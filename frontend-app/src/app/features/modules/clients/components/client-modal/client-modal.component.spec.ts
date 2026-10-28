import { TestBed } from '@angular/core/testing';
import { ClientModalComponent } from './client-modal.component';
import type { CreateClientPayload } from '../../../../domains/clients/public-api';

describe('ClientModalComponent', () => {
  const setup = async (open = true, saving = false, error: string | null = null) => {
    await TestBed.configureTestingModule({
      imports: [ClientModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClientModalComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('saving', saving);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  const input = (fixture: Awaited<ReturnType<typeof setup>>, testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement;

  const type = (fixture: Awaited<ReturnType<typeof setup>>, testId: string, value: string) => {
    const field = input(fixture, testId);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('no debe emitir un cliente cuando el nombre es inválido', async () => {
    const fixture = await setup();
    let emitted: CreateClientPayload | undefined;
    fixture.componentInstance.submitClient.subscribe((payload) => (emitted = payload));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(emitted).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('Escribe al menos 2 caracteres');
  });

  it('debe emitir el payload recortado cuando el formulario es válido', async () => {
    const fixture = await setup();
    let emitted: CreateClientPayload | undefined;
    fixture.componentInstance.submitClient.subscribe((payload) => (emitted = payload));

    type(fixture, 'client-name', '  Carla López  ');
    type(fixture, 'client-phone', ' +505 8888 8888 ');
    type(fixture, 'client-email', ' carla@correo.com ');
    type(fixture, 'client-company', ' Norte ');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(emitted).toEqual({
      name: 'Carla López',
      phone: '+505 8888 8888',
      email: 'carla@correo.com',
      company: 'Norte',
    });
  });

  it('debe mostrar el error del correo inválido', async () => {
    const fixture = await setup();

    type(fixture, 'client-name', 'Carla');
    type(fixture, 'client-email', 'no-es-correo');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Correo inválido');
  });

  it('debe mostrar el error del servidor y cerrar con el botón', async () => {
    const fixture = await setup(true, false, 'Ya existe un cliente con ese correo.');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="client-modal-error"]').textContent,
    ).toContain('Ya existe un cliente con ese correo.');

    let dismissed = false;
    fixture.componentInstance.dismiss.subscribe(() => (dismissed = true));
    fixture.nativeElement
      .querySelector('[data-testid="close-client-modal"]')
      .dispatchEvent(new Event('click'));

    expect(dismissed).toBe(true);
  });

  it('debe cerrar con Escape y deshabilitar el guardado mientras envía', async () => {
    const fixture = await setup(true, true);
    let dismissed = false;
    fixture.componentInstance.dismiss.subscribe(() => (dismissed = true));

    const submit = fixture.nativeElement.querySelector(
      '[data-testid="submit-client"]',
    ) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(submit.textContent).toContain('Guardando…');

    fixture.nativeElement
      .querySelector('[data-testid="client-dialog"]')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(dismissed).toBe(true);
  });

  it('debe limpiar el formulario al reabrir el modal', async () => {
    const fixture = await setup();
    type(fixture, 'client-name', 'Carla');

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(input(fixture, 'client-name').value).toBe('');
  });

  it('no debe renderizar el diálogo cuando está cerrado', async () => {
    const fixture = await setup(false);

    expect(fixture.nativeElement.querySelector('[data-testid="client-dialog"]')).toBeNull();
  });
});

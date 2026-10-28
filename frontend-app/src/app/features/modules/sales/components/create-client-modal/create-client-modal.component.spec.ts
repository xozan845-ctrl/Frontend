import { TestBed } from '@angular/core/testing';
import { CreateClientModalComponent } from './create-client-modal.component';
import type { CreateClientPayload } from '../../../../applications/vendor/public-api';

describe('CreateClientModalComponent', () => {
  const setup = async (open = true, creating = false, error: string | null = null) => {
    await TestBed.configureTestingModule({
      imports: [CreateClientModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreateClientModalComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('creating', creating);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('no debe renderizar el diálogo mientras está cerrado', async () => {
    const fixture = await setup(false);

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="create-client-modal"]'),
    ).toBeNull();
  });

  it('debe emitir el payload saneado al guardar', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const payloads: CreateClientPayload[] = [];
    fixture.componentInstance.submitClient.subscribe((payload) => payloads.push(payload));

    const name = host.querySelector('[data-testid="client-name"]') as HTMLInputElement;
    name.value = '  Salón Vero  ';
    name.dispatchEvent(new Event('input'));
    const phone = host.querySelector('[data-testid="client-phone"]') as HTMLInputElement;
    phone.value = ' +505 8888 0000 ';
    phone.dispatchEvent(new Event('input'));
    const email = host.querySelector('[data-testid="client-email"]') as HTMLInputElement;
    email.value = ' hola@vero.com ';
    email.dispatchEvent(new Event('input'));

    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    expect(payloads).toEqual([
      { name: 'Salón Vero', phone: '+505 8888 0000', email: 'hola@vero.com' },
    ]);
  });

  it('no debe emitir con nombre inválido y debe señalar el campo', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let submitted = 0;
    fixture.componentInstance.submitClient.subscribe(() => submitted++);

    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submitted).toBe(0);
    expect((host.querySelector('[data-testid="client-name"]') as HTMLElement).className).toContain(
      'input-error',
    );
    expect(host.textContent).toContain('Escribe al menos 2 caracteres');
  });

  it('no debe emitir con correo inválido y debe señalarlo', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let submitted = 0;
    fixture.componentInstance.submitClient.subscribe(() => submitted++);

    const name = host.querySelector('[data-testid="client-name"]') as HTMLInputElement;
    name.value = 'Salón Vero';
    name.dispatchEvent(new Event('input'));
    const email = host.querySelector('[data-testid="client-email"]') as HTMLInputElement;
    email.value = 'correo-invalido';
    email.dispatchEvent(new Event('input'));

    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submitted).toBe(0);
    expect((host.querySelector('[data-testid="client-email"]') as HTMLElement).className).toContain(
      'input-error',
    );
    expect(host.textContent).toContain('Correo inválido');

    email.value = 'hola@vero.com';
    email.dispatchEvent(new Event('input'));
    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submitted).toBe(1);
  });

  it('debe respetar el mínimo del nombre en el límite', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let submitted = 0;
    fixture.componentInstance.submitClient.subscribe(() => submitted++);
    const name = host.querySelector('[data-testid="client-name"]') as HTMLInputElement;

    name.value = 'A';
    name.dispatchEvent(new Event('input'));
    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submitted).toBe(0);
    expect(host.textContent).toContain('Escribe al menos 2 caracteres');

    name.value = 'Ana';
    name.dispatchEvent(new Event('input'));
    (host.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submitted).toBe(1);
  });

  it('debe cerrar con la X, con Cancelar y con Escape', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    let closes = 0;
    fixture.componentInstance.dismiss.subscribe(() => closes++);

    (host.querySelector('[data-testid="close-client-modal"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="cancel-client"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="create-client-dialog"]') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );

    expect(closes).toBe(3);
  });

  it('debe mostrar el estado de envío y el error del alta', async () => {
    const fixture = await setup(true, true, 'sin conexión');
    const host = fixture.nativeElement as HTMLElement;
    const submit = host.querySelector('[data-testid="submit-client"]') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
    expect(submit.textContent).toContain('Guardando…');
    expect(host.querySelector('[data-testid="create-client-error"]')?.textContent).toContain(
      'sin conexión',
    );
  });

  it('debe limpiar el formulario al reabrir', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const name = host.querySelector('[data-testid="client-name"]') as HTMLInputElement;
    name.value = 'Ana';
    name.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.form.controls.name.value).toBe('Ana');

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    await vi.waitFor(() => expect(fixture.componentInstance.form.controls.name.value).toBe(''));
  });
});

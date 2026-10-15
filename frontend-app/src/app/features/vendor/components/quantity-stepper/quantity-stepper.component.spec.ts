import { TestBed } from '@angular/core/testing';
import { QuantityStepperComponent } from './quantity-stepper.component';

describe('QuantityStepperComponent', () => {
  const setup = async (value: number, min = 1, max = 999) => {
    await TestBed.configureTestingModule({
      imports: [QuantityStepperComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(QuantityStepperComponent);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('min', min);
    fixture.componentRef.setInput('max', max);
    fixture.componentRef.setInput('label', 'Shampoo Keratina');
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar el valor con etiquetas accesibles', async () => {
    const fixture = await setup(3);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="stepper-value"]')?.textContent?.trim()).toBe('3');
    expect(host.querySelector('[data-testid="stepper-minus"]')?.getAttribute('aria-label')).toBe(
      'Disminuir cantidad de Shampoo Keratina',
    );
    expect(host.querySelector('[data-testid="stepper-plus"]')?.getAttribute('aria-label')).toBe(
      'Aumentar cantidad de Shampoo Keratina',
    );
  });

  it('debe emitir el valor nuevo al pulsar − y +', async () => {
    const fixture = await setup(3);
    const host = fixture.nativeElement as HTMLElement;
    const values: number[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => values.push(value));

    (host.querySelector('[data-testid="stepper-minus"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="stepper-plus"]') as HTMLButtonElement).click();

    expect(values).toEqual([2, 4]);
  });

  it('debe deshabilitar − en el mínimo y + en el máximo', async () => {
    const fixture = await setup(1, 1, 3);
    const host = fixture.nativeElement as HTMLElement;

    expect(
      (host.querySelector('[data-testid="stepper-minus"]') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect((host.querySelector('[data-testid="stepper-plus"]') as HTMLButtonElement).disabled).toBe(
      false,
    );

    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();

    expect(
      (host.querySelector('[data-testid="stepper-minus"]') as HTMLButtonElement).disabled,
    ).toBe(false);
    expect((host.querySelector('[data-testid="stepper-plus"]') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

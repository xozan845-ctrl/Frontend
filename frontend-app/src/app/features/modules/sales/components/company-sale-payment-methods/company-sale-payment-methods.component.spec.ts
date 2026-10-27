import { TestBed } from '@angular/core/testing';
import { CompanySalePaymentMethodsComponent } from './company-sale-payment-methods.component';
import type { CompanySalePaymentMethod } from '../../../../empresas/public-api';

describe('CompanySalePaymentMethodsComponent', () => {
  const setup = async (selected: CompanySalePaymentMethod = 'efectivo', disabled = false) => {
    await TestBed.configureTestingModule({
      imports: [CompanySalePaymentMethodsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanySalePaymentMethodsComponent);
    fixture.componentRef.setInput('selected', selected);
    fixture.componentRef.setInput('disabled', disabled);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar las seis formas de pago y marcar la seleccionada', async () => {
    const fixture = await setup('tarjeta');
    const buttons = fixture.nativeElement.querySelectorAll('[data-testid^="sale-payment-"]');

    expect(buttons).toHaveLength(6);
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="sale-payment-tarjeta"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('debe emitir la forma de pago al hacer clic', async () => {
    const fixture = await setup();
    let emitted: CompanySalePaymentMethod | undefined;
    fixture.componentInstance.selectMethod.subscribe((method) => (emitted = method));

    fixture.nativeElement.querySelector('[data-testid="sale-payment-transferencia"]').click();

    expect(emitted).toBe('transferencia');
  });

  it('no debe emitir cuando está deshabilitado', async () => {
    const fixture = await setup('efectivo', true);
    let emitted = false;
    fixture.componentInstance.selectMethod.subscribe(() => (emitted = true));

    fixture.nativeElement.querySelector('[data-testid="sale-payment-efectivo"]').click();

    expect(emitted).toBe(false);
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="sale-payment-efectivo"]')
        .hasAttribute('disabled'),
    ).toBe(true);
  });
});

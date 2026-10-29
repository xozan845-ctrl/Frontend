import { TestBed } from '@angular/core/testing';
import type { CashPaymentMethod } from '../../../../domains/finance/public-api';
import { CashMovementModalComponent } from './cash-movement-modal.component';

const METHOD: CashPaymentMethod = {
  id: 'efectivo',
  name: 'Efectivo',
  kind: 'efectivo',
  icon: 'fa-solid fa-money-bill-wave',
  active: true,
  createdAt: '2026-10-20T12:00:00Z',
};

describe('CashMovementModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashMovementModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashMovementModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('methods', [METHOD]);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe emitir un movimiento válido y permitir cambiar a dólares', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const save = vi.fn();
    fixture.componentInstance.save.subscribe(save);

    const concept = host.querySelector('[data-testid="cash-movement-concept"]') as HTMLInputElement;
    concept.value = 'Venta de mostrador';
    concept.dispatchEvent(new Event('input'));
    const amount = host.querySelector('[data-testid="cash-movement-amount"]') as HTMLInputElement;
    amount.value = '1200';
    amount.dispatchEvent(new Event('input'));

    (host.querySelector('[data-testid="cash-movement-save"]') as HTMLButtonElement).click();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        concept: 'Venta de mostrador',
        amount: 1200,
        type: 'ingreso',
        category: 'venta',
        currency: 'NIO',
        paymentMethod: 'efectivo',
      }),
    );

    (host.querySelector('[data-testid="cash-movement-usd"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.textContent).toContain('Ingresar en córdobas');
  });
});

import { TestBed } from '@angular/core/testing';
import type { CashPaymentMethodSummary } from '../../../../domains/finance/public-api';
import { PaymentMethodsPanelComponent } from './payment-methods-panel.component';

const SUMMARY: CashPaymentMethodSummary = {
  method: {
    id: 'efectivo',
    name: 'Efectivo',
    kind: 'efectivo',
    icon: 'fa-solid fa-money-bill-wave',
    active: true,
    createdAt: '2026-10-20T12:00:00.000Z',
  },
  count: 2,
  income: 100,
  expense: 20,
  balance: 80,
};

describe('PaymentMethodsPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodsPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PaymentMethodsPanelComponent);
    fixture.componentRef.setInput('summaries', [SUMMARY]);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar el método, su tipo y emitir el cambio de estado', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const toggle = vi.fn();
    fixture.componentInstance.requestToggle.subscribe(toggle);

    expect(host.textContent).toContain('Efectivo');
    expect(host.textContent).toContain('Movimientos');
    expect(host.textContent).toContain('2');
    expect(host.textContent).toContain('80.00');
    (host.querySelector('button[aria-pressed]') as HTMLButtonElement).click();
    expect(toggle).toHaveBeenCalledWith('efectivo');
  });
});

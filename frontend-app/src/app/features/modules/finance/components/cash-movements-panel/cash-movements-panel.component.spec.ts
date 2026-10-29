import { TestBed } from '@angular/core/testing';
import type {
  CashLedgerEntry,
  CashMovement,
  CashPaymentMethod,
} from '../../../../domains/finance/public-api';
import { CashMovementsPanelComponent } from './cash-movements-panel.component';

const METHOD: CashPaymentMethod = {
  id: 'efectivo',
  name: 'Efectivo',
  kind: 'efectivo',
  icon: 'fa-solid fa-money-bill-wave',
  active: true,
  createdAt: '2026-10-20T12:00:00Z',
};
const MOVEMENT: CashMovement = {
  id: 'cash-1',
  date: '2026-10-29',
  createdAt: '2026-10-29T12:00:00Z',
  type: 'ingreso',
  concept: 'Venta de mostrador',
  amount: 1000,
  currency: 'NIO',
  originalAmount: 1000,
  exchangeRate: 1,
  paymentMethod: 'efectivo',
  category: 'venta',
  source: 'manual',
  status: 'completado',
  reference: 'V-1',
  observations: '',
};
const ROW: CashLedgerEntry = { movement: MOVEMENT, balance: 1000 };

describe('CashMovementsPanelComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CashMovementsPanelComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashMovementsPanelComponent);
    fixture.componentRef.setInput('rows', [ROW]);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageCount', 1);
    fixture.componentRef.setInput('total', 1);
    fixture.componentRef.setInput('period', 'mes');
    fixture.componentRef.setInput('search', '');
    fixture.componentRef.setInput('methods', [METHOD]);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar la fila y emitir filtros y anulación', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;
    const period = vi.fn();
    const search = vi.fn();
    const annul = vi.fn();
    fixture.componentInstance.periodChange.subscribe(period);
    fixture.componentInstance.searchChange.subscribe(search);
    fixture.componentInstance.annul.subscribe(annul);

    expect(host.textContent).toContain('Venta de mostrador');
    expect(host.textContent).toContain('Efectivo');
    expect(host.textContent).toContain('1,000.00');

    (host.querySelector('[data-testid="cash-period-hoy"]') as HTMLButtonElement).click();
    expect(period).toHaveBeenCalledWith('hoy');

    const input = host.querySelector('[data-testid="cash-search"]') as HTMLInputElement;
    input.value = 'venta';
    input.dispatchEvent(new Event('input'));
    expect(search).toHaveBeenCalledWith('venta');

    (host.querySelector('[data-testid="cash-annul"]') as HTMLButtonElement).click();
    expect(annul).toHaveBeenCalledWith('cash-1');
  });
});

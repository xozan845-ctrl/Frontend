import { TestBed } from '@angular/core/testing';
import { PurchaseHistoryComponent } from './purchase-history.component';
import type { PurchaseHistoryRow } from '../../../../domains/purchases/public-api';

const ROW: PurchaseHistoryRow = {
  id: 'purchase-1',
  number: 'C-0001',
  date: '2026-10-20',
  supplierName: 'Distribuidora',
  productsLabel: 'Taladro',
  units: 2,
  total: 200,
  paymentLabel: 'Efectivo',
  status: 'recibida',
  statusLabel: 'Recibida',
  userName: 'Karla',
  isCancelled: false,
};

describe('PurchaseHistoryComponent', () => {
  const setup = async (rows: readonly PurchaseHistoryRow[] = [ROW]) => {
    await TestBed.configureTestingModule({
      imports: [PurchaseHistoryComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseHistoryComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('filteredCount', rows.length);
    fixture.componentRef.setInput('period', 'mes');
    fixture.componentRef.setInput('statusFilter', 'todas');
    fixture.componentRef.setInput('query', '');
    fixture.componentRef.setInput('customFrom', '');
    fixture.componentRef.setInput('customTo', '');
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageCount', 1);
    fixture.componentRef.setInput('isFirstPage', true);
    fixture.componentRef.setInput('isLastPage', true);
    fixture.componentRef.setInput('isCustomPeriod', false);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('muestra el historial y emite filtros y acciones', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const periods = vi.fn();
    const searches = vi.fn();
    const cancelled = vi.fn();
    component.periodChange.subscribe(periods);
    component.searchChange.subscribe(searches);
    component.cancelPurchase.subscribe(cancelled);

    const periodButton = fixture.nativeElement.querySelector(
      '[data-testid="purchase-period-hoy"]',
    ) as HTMLButtonElement;
    periodButton.click();
    expect(periods).toHaveBeenCalledWith('hoy');

    const search = fixture.nativeElement.querySelector(
      '[data-testid="purchase-search"]',
    ) as HTMLInputElement;
    search.value = 'taladro';
    search.dispatchEvent(new Event('input'));
    expect(searches).toHaveBeenCalledWith('taladro');

    const cancel = fixture.nativeElement.querySelector(
      '[data-testid="purchase-history-cancel"]',
    ) as HTMLButtonElement;
    cancel.click();
    expect(cancelled).toHaveBeenCalledWith('purchase-1');

    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-history-table"]'),
    ).not.toBeNull();
  });

  it('muestra el estado vacío cuando no hay compras', async () => {
    const fixture = await setup([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-history-empty"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-history-table"]'),
    ).toBeNull();
  });
});

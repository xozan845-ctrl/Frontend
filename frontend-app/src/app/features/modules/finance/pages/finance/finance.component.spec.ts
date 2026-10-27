import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import {
  FinanceStore,
  type CashMovement,
  type ExpenseRecord,
  type FinanceSummary,
  type PurchaseRecord,
} from '../../../../finance/public-api';
import FinanceComponent from './finance.component';

const purchase: PurchaseRecord = {
  id: 'purchase-1',
  date: '2026-10-20',
  supplier: 'Proveedor',
  concept: 'Compra',
  amount: 100,
  status: 'pendiente',
};

const expense: ExpenseRecord = {
  id: 'expense-1',
  date: '2026-10-20',
  category: 'operativo',
  description: 'Gasto',
  amount: 50,
  paymentMethod: 'efectivo',
};

const cash: CashMovement = {
  id: 'cash-1',
  date: '2026-10-20',
  type: 'ingreso',
  concept: 'Cobro',
  amount: 200,
  paymentMethod: 'efectivo',
};

const summary: FinanceSummary = {
  purchasesTotal: 100,
  purchasesPending: 100,
  purchasesMonth: 100,
  expensesTotal: 50,
  expensesMonth: 50,
  cashIncome: 200,
  cashExpense: 0,
  cashBalance: 200,
};

describe('FinanceComponent', () => {
  const store = {
    purchases: signal([purchase]),
    expenses: signal([expense]),
    cash: signal([cash]),
    summary: signal(summary),
    addPurchase: vi.fn(),
    addExpense: vi.fn(),
    addCashMovement: vi.fn(),
    removePurchase: vi.fn(),
    removeExpense: vi.fn(),
    removeCashMovement: vi.fn(),
  };

  const setup = async (tab: 'purchases' | 'expenses' | 'cash' = 'purchases') => {
    await TestBed.configureTestingModule({
      imports: [FinanceComponent],
      providers: [
        provideRouter([]),
        { provide: FinanceStore, useValue: store },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FinanceComponent);
    fixture.componentRef.setInput('tab', tab);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe mostrar KPIs y la pestaña de compras', async () => {
    const fixture = await setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.title()).toBe('Compras');
    expect(host.textContent).toContain('C$100.00');
    expect(host.textContent).toContain('Nueva compra');
    expect(host.querySelector('[data-testid="purchases-table"]')).not.toBeNull();
  });

  it('debe cambiar a la pestaña de caja', async () => {
    const fixture = await setup('cash');
    const host = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.title()).toBe('Caja / Pagos');
    expect(host.textContent).toContain('Nuevo movimiento');
    expect(host.querySelector('[data-testid="cash-table"]')).not.toBeNull();
  });

  it('debe delegar altas y bajas en el store', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.createPurchase({
      date: '2026-10-20',
      supplier: 'Proveedor',
      concept: 'Compra',
      amount: 10,
      status: 'pagada',
    });
    component.createExpense({
      date: '2026-10-20',
      category: 'operativo',
      description: 'Gasto',
      amount: 5,
      paymentMethod: 'efectivo',
    });
    component.createCashMovement({
      date: '2026-10-20',
      type: 'ingreso',
      concept: 'Cobro',
      amount: 20,
      paymentMethod: 'efectivo',
    });

    expect(store.addPurchase).toHaveBeenCalled();
    expect(store.addExpense).toHaveBeenCalled();
    expect(store.addCashMovement).toHaveBeenCalled();
    expect(store.removePurchase).not.toHaveBeenCalled();
  });
});

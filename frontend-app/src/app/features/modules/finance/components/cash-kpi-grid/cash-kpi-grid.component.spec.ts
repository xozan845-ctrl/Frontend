import { TestBed } from '@angular/core/testing';
import type { CashKpis } from '../../../../domains/finance/public-api';
import { CashKpiGridComponent } from './cash-kpi-grid.component';

const KPIS: CashKpis = {
  available: 1000,
  monthIncome: 1200,
  monthIncomeCount: 2,
  monthExpense: 200,
  monthExpenseCount: 1,
  monthMovements: 3,
  otherIncome: 100,
  otherExpense: 50,
};

describe('CashKpiGridComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({ imports: [CashKpiGridComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CashKpiGridComponent);
    fixture.componentRef.setInput('kpis', KPIS);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe mostrar los seis indicadores del centro de caja', async () => {
    const host = (await setup()).nativeElement as HTMLElement;

    expect(host.textContent).toContain('Caja disponible');
    expect(host.textContent).toContain('1,000.00');
    expect(host.textContent).toContain('2 entradas');
    expect(host.textContent).toContain('1 salida');
    expect(host.textContent).toContain('Movimientos del mes');
    expect(host.textContent).toContain('Otros egresos');
    expect(host.textContent).toContain('50.00');
  });
});

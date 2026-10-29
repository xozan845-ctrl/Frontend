import { TestBed } from '@angular/core/testing';
import { PurchaseKpiGridComponent } from './purchase-kpi-grid.component';
import type { PurchaseKpis } from '../../../../domains/purchases/public-api';

const KPIS: PurchaseKpis = {
  todayTotal: 100,
  todayCount: 1,
  monthTotal: 500,
  monthCount: 2,
  totalCount: 3,
  cancelledCount: 1,
  productsEntered: 7,
  inventoryInvestment: 400,
  activeSuppliers: 2,
};

describe('PurchaseKpiGridComponent', () => {
  it('muestra las seis tarjetas con el VM del store', async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseKpiGridComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseKpiGridComponent);
    fixture.componentRef.setInput('kpis', KPIS);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('article')).toHaveLength(6);
    expect(host.textContent).toContain('Compras hoy');
    expect(host.textContent).toContain('1 compras');
    expect(host.textContent).toContain('7');
    expect(host.textContent).toContain('2');
  });
});

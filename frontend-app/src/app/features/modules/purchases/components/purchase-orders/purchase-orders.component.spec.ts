import { TestBed } from '@angular/core/testing';
import { PurchaseOrdersComponent } from './purchase-orders.component';
import type { PurchaseOrderRow } from '../../../../domains/purchases/public-api';

const ROW: PurchaseOrderRow = {
  id: 'order-1',
  number: 'OC-0001',
  date: '2026-10-20',
  supplierName: 'Distribuidora',
  productsLabel: 'Taladro',
  units: 2,
  total: 200,
  status: 'pendiente',
  statusLabel: 'Pendiente',
};

describe('PurchaseOrdersComponent', () => {
  const setup = async (rows: readonly PurchaseOrderRow[] = [ROW]) => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrdersComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseOrdersComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('count', rows.length);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('lista órdenes y emite conversión, anulación y navegación', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const back = vi.fn();
    const created = vi.fn();
    const converted = vi.fn();
    const cancelled = vi.fn();
    component.back.subscribe(back);
    component.newOrder.subscribe(created);
    component.convertOrder.subscribe(converted);
    component.cancelOrder.subscribe(cancelled);

    (
      fixture.nativeElement.querySelector(
        '[data-testid="purchase-orders-back"]',
      ) as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '[data-testid="purchase-orders-new"]',
      ) as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '[data-testid="purchase-orders-convert"]',
      ) as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '[data-testid="purchase-orders-cancel"]',
      ) as HTMLButtonElement
    ).click();

    expect(back).toHaveBeenCalled();
    expect(created).toHaveBeenCalled();
    expect(converted).toHaveBeenCalledWith('order-1');
    expect(cancelled).toHaveBeenCalledWith('order-1');
  });

  it('muestra el mensaje vacío', async () => {
    const fixture = await setup([]);
    expect(fixture.nativeElement.textContent).toContain('Todavía no has creado ninguna orden');
  });
});

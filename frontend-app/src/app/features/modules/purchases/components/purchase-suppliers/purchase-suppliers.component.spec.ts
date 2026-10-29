import { TestBed } from '@angular/core/testing';
import { PurchaseSuppliersComponent } from './purchase-suppliers.component';
import type { SupplierRow } from '../../../../domains/purchases/public-api';

const ROW: SupplierRow = {
  id: 'supplier-1',
  name: 'Distribuidora',
  ruc: '123',
  contact: '8888',
  purchaseCount: 2,
  total: 300,
  lastPurchaseDate: '2026-10-20',
};

describe('PurchaseSuppliersComponent', () => {
  const setup = async (rows: readonly SupplierRow[] = [ROW]) => {
    await TestBed.configureTestingModule({
      imports: [PurchaseSuppliersComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseSuppliersComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('lista proveedores y emite el alta', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.newSupplier.subscribe(created);
    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-suppliers-table"]'),
    ).not.toBeNull();
    const button = fixture.nativeElement.querySelector(
      '[data-testid="purchase-suppliers-new"]',
    ) as HTMLButtonElement;
    button.click();
    expect(created).toHaveBeenCalled();
  });

  it('muestra el estado vacío', async () => {
    const fixture = await setup([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-suppliers-empty"]'),
    ).not.toBeNull();
  });
});

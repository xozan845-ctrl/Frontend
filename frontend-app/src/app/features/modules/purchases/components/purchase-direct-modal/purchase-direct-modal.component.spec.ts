import { TestBed } from '@angular/core/testing';
import { PurchaseDirectModalComponent } from './purchase-direct-modal.component';
import type { Supplier } from '../../../../domains/purchases/public-api';

const SUPPLIER: Supplier = {
  id: 'supplier-1',
  name: 'Distribuidora',
  ruc: '',
  phone: '',
  email: '',
  address: '',
  createdAt: '2026-10-20T12:00:00.000Z',
};

describe('PurchaseDirectModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseDirectModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseDirectModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('suppliers', [SUPPLIER]);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('emite una compra directa válida', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);
    fixture.componentInstance.form.patchValue({
      supplierId: SUPPLIER.id,
      concept: '  Reparación  ',
      amount: 150,
      date: '2026-10-20',
      paymentMethod: 'transferencia',
      notes: '  Urgente  ',
    });

    fixture.componentInstance.submit();

    expect(saved).toHaveBeenCalledWith({
      supplierId: 'supplier-1',
      supplierName: 'Distribuidora',
      concept: 'Reparación',
      amount: 150,
      date: '2026-10-20',
      paymentMethod: 'transferencia',
      costType: 'inventario',
      notes: 'Urgente',
      retention: 0,
    });
  });

  it('no emite si el concepto o el monto son inválidos', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);
    fixture.componentInstance.form.patchValue({ concept: '', amount: 0 });
    fixture.componentInstance.submit();
    expect(saved).not.toHaveBeenCalled();
  });

  it('emite el proveedor nuevo', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.createSupplier.subscribe(created);
    fixture.componentInstance.onManualSupplier({ target: { value: '  Nuevo  ' } } as never);
    fixture.componentInstance.addSupplier();
    expect(created).toHaveBeenCalledWith('Nuevo');
  });
});

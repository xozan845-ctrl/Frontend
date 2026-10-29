import { TestBed } from '@angular/core/testing';
import { PurchaseNewModalComponent } from './purchase-new-modal.component';
import type { PurchaseProductOption, Supplier } from '../../../../domains/purchases/public-api';

const PRODUCT: PurchaseProductOption = {
  id: 'product-1',
  name: 'Taladro',
  code: 'TAL-1',
  category: 'Herramientas',
  cost: 100,
  price: 150,
  stock: 5,
};

const SUPPLIER: Supplier = {
  id: 'supplier-1',
  name: 'Distribuidora',
  ruc: '',
  phone: '',
  email: '',
  address: '',
  createdAt: '2026-10-20T12:00:00.000Z',
};

describe('PurchaseNewModalComponent', () => {
  const setup = async (mode: 'compra' | 'orden' = 'compra') => {
    await TestBed.configureTestingModule({
      imports: [PurchaseNewModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseNewModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('products', [PRODUCT]);
    fixture.componentRef.setInput('suppliers', [SUPPLIER]);
    fixture.componentRef.setInput('nextNumber', mode === 'orden' ? 'OC-0001' : 'C-0001');
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('ofrece elegir producto existente o nuevo', async () => {
    const fixture = await setup();
    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-new-existing"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="purchase-new-product-option"]'),
    ).not.toBeNull();
  });

  it('agrega productos, calcula el total y confirma la compra', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const submitted = vi.fn();
    component.submitPurchase.subscribe(submitted);

    component.selectStage('existing');
    component.selectedSupplierId.set(SUPPLIER.id);
    component.addProduct(PRODUCT);
    component.addProduct(PRODUCT);
    component.step.set(7);
    component.maxVisited.set(7);

    expect(component.lines()).toHaveLength(1);
    expect(component.lines()[0].quantity).toBe(2);
    expect(component.total()).toBe(200);

    component.submitWizard();
    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: SUPPLIER.id,
        supplierName: 'Distribuidora',
        origin: 'productos',
        status: 'recibida',
      }),
    );
  });

  it('crea una orden sin afectar inventario', async () => {
    const fixture = await setup('orden');
    const component = fixture.componentInstance;
    const submitted = vi.fn();
    component.submitOrder.subscribe(submitted);

    component.addProduct(PRODUCT);
    component.step.set(5);
    component.maxVisited.set(5);
    component.submitWizard();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierName: 'Sin proveedor',
        lines: [expect.objectContaining({ name: 'Taladro', quantity: 1 })],
      }),
    );
    expect(component.step()).toBe(5);
  });

  it('emite el producto nuevo con su costo y stock', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const created = vi.fn();
    component.createProductPurchase.subscribe(created);

    component.selectStage('new');
    component.newProductForm.patchValue({
      supplierId: SUPPLIER.id,
      name: '  Taladro  ',
      category: 'Herramientas',
      sku: 'TAL-2',
      unitCost: 100,
      salePrice: 150,
      quantity: 3,
    });
    component.submitNewProduct();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: SUPPLIER.id,
        productName: 'Taladro',
        unitCost: 100,
        salePrice: 150,
        quantity: 3,
      }),
    );
  });

  it('no avanza sin productos en el carrito', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.selectStage('existing');
    component.step.set(2);
    component.next();
    expect(component.step()).toBe(2);
    expect(component.localError()).toBe('Agrega al menos un producto al carrito.');
  });
});

import { TestBed } from '@angular/core/testing';
import PurchaseNewProductFormComponent from './purchase-new-product-form.component';

describe('PurchaseNewProductFormComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseNewProductFormComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(PurchaseNewProductFormComponent);
    fixture.componentRef.setInput('suppliers', [
      {
        id: 's-1',
        name: 'Distribuidora',
        ruc: '',
        phone: '',
        email: '',
        address: '',
        createdAt: '',
      },
    ]);
    fixture.detectChanges();
    return fixture;
  };

  it('emite el producto nuevo con su costo y stock', async () => {
    const fixture = await setup();
    const created = vi.fn();
    fixture.componentInstance.submitNewProduct.subscribe(created);
    fixture.componentInstance.form.patchValue({
      supplierId: 's-1',
      name: '  Taladro  ',
      category: 'Herramientas',
      sku: 'TAL-2',
      unitCost: 100,
      salePrice: 150,
      quantity: 3,
    });

    fixture.componentInstance.onSubmit();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: 's-1',
        productName: 'Taladro',
        unitCost: 100,
        salePrice: 150,
        quantity: 3,
      }),
    );
  });
});

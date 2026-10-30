import { TestBed } from '@angular/core/testing';
import { CompanyInventoryMovementModalComponent } from './company-inventory-movement-modal.component';
import type { CatalogProduct } from '../../../../applications/products/public-api';

const product: CatalogProduct = {
  id: 'p-1',
  companyId: 'e-1',
  sku: 'SKU-1',
  name: 'Café',
  description: '',
  category: '',
  basePrice: 100,
  stock: 10,
  status: 'disponible',
  operationalStatus: 'activo',
  cost: 50,
  brand: '',
  barcode: '',
  unit: 'Unidad (u)',
  allowFractions: false,
  purchaseUnit: 'Igual que la de venta',
  contentAmount: 0,
  contentUnit: 'Sin contenido',
  priceType: 'fijo',
  costType: 'fijo',
  minStock: 0,
  maxStock: null,
  warrantyMonths: null,
  isRawMaterial: false,
  location: '',
  createdAt: '',
  updatedAt: '',
};

describe('CompanyInventoryMovementModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyInventoryMovementModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyInventoryMovementModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('initialType', 'traslado');
    fixture.componentRef.setInput('products', [product]);
    fixture.detectChanges();
    return fixture;
  };

  it('debe emitir el movimiento con líneas', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);

    fixture.componentInstance.form.patchValue({
      type: 'traslado',
      reason: 'Reposición',
      origin: 'Bodega',
      destination: 'Tienda',
    });
    fixture.componentInstance.selectProduct(0, 'p-1');
    fixture.componentInstance.setQuantity(0, '3');
    fixture.componentInstance.submit();

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'traslado',
        origin: 'Bodega',
        destination: 'Tienda',
        lines: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 3 }],
      }),
    );
  });

  it('debe agregar, quitar y cerrar', async () => {
    const fixture = await setup();
    const dismissed = vi.fn();
    fixture.componentInstance.dismiss.subscribe(dismissed);

    fixture.componentInstance.addLine();
    expect(fixture.componentInstance.lines()).toHaveLength(2);
    fixture.componentInstance.removeLine(1);
    expect(fixture.componentInstance.lines()).toHaveLength(1);

    fixture.componentInstance.close();
    expect(dismissed).toHaveBeenCalled();
  });
});

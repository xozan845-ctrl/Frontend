import { TestBed } from '@angular/core/testing';
import { CompanyComboModalComponent } from './company-combo-modal.component';
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

describe('CompanyComboModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyComboModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyComboModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('products', [product]);
    fixture.detectChanges();
    return fixture;
  };

  it('debe construir el payload con productos seleccionados', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);

    fixture.componentInstance.form.patchValue({
      sku: 'COMBO-1',
      name: 'Desayuno',
      price: '150.00',
    });
    fixture.componentInstance.selectProduct(0, 'p-1');
    fixture.componentInstance.setQuantity(0, '2');
    fixture.componentInstance.submit();

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: 'COMBO-1',
        name: 'Desayuno',
        price: '150.00',
        components: [{ productId: 'p-1', sku: 'SKU-1', name: 'Café', quantity: 2 }],
      }),
    );
  });

  it('debe agregar, quitar y cerrar', async () => {
    const fixture = await setup();
    const dismissed = vi.fn();
    fixture.componentInstance.dismiss.subscribe(dismissed);

    fixture.componentInstance.addComponent();
    expect(fixture.componentInstance.components()).toHaveLength(2);
    fixture.componentInstance.removeComponent(1);
    expect(fixture.componentInstance.components()).toHaveLength(1);

    fixture.componentInstance.close();
    expect(dismissed).toHaveBeenCalled();
  });
});

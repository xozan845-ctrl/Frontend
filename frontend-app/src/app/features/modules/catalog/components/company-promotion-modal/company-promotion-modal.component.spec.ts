import { TestBed } from '@angular/core/testing';
import { CompanyPromotionModalComponent } from './company-promotion-modal.component';
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

describe('CompanyPromotionModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyPromotionModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyPromotionModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('products', [product]);
    fixture.detectChanges();
    return fixture;
  };

  it('debe emitir una promoción porcentual', async () => {
    const fixture = await setup();
    const saved = vi.fn();
    fixture.componentInstance.save.subscribe(saved);

    fixture.componentInstance.form.patchValue({
      name: 'Descuento',
      type: 'descuento_porcentaje',
      discountPercentage: '15',
      from: '2026-10-01',
      to: '2026-10-31',
    });
    fixture.componentInstance.submit();

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Descuento',
        type: 'descuento_porcentaje',
        discountPercentage: 15,
        requiredQuantity: null,
      }),
    );
  });

  it('debe seleccionar producto y cerrar', async () => {
    const fixture = await setup();
    const dismissed = vi.fn();
    fixture.componentInstance.dismiss.subscribe(dismissed);

    fixture.componentInstance.selectProduct('p-1');
    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      productId: 'p-1',
      sku: 'SKU-1',
    });

    fixture.componentInstance.close();
    expect(dismissed).toHaveBeenCalled();
  });
});

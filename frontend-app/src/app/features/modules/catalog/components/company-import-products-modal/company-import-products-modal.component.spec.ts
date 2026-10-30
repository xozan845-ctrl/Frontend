import { TestBed } from '@angular/core/testing';
import { CompanyImportProductsModalComponent } from './company-import-products-modal.component';
import type { CompanyProductImportRow } from '../../../../applications/empresas/public-api';

const row: CompanyProductImportRow = {
  sku: 'SKU-1',
  name: 'Café',
  description: '',
  category: '',
  basePrice: '100.00',
  stock: 2,
  cost: '',
  brand: '',
  barcode: '',
  unit: 'Unidad (u)',
  minStock: 0,
  maxStock: null,
  isRawMaterial: false,
  location: '',
};

describe('CompanyImportProductsModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyImportProductsModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyImportProductsModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    return fixture;
  };

  it('debe emitir las filas válidas y mostrar el resultado', async () => {
    const fixture = await setup();
    const imported = vi.fn();
    fixture.componentInstance.importRows.subscribe(imported);

    fixture.componentInstance.rows.set([row]);
    fixture.componentInstance.submit();
    expect(imported).toHaveBeenCalledWith([row]);

    fixture.componentRef.setInput('result', { imported: 1, skipped: 0, errors: ['algo'] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 importados');
  });

  it('no debe emitir sin filas y debe cerrar', async () => {
    const fixture = await setup();
    const imported = vi.fn();
    const dismissed = vi.fn();
    fixture.componentInstance.importRows.subscribe(imported);
    fixture.componentInstance.dismiss.subscribe(dismissed);

    fixture.componentInstance.submit();
    expect(imported).not.toHaveBeenCalled();

    fixture.componentInstance.close();
    expect(dismissed).toHaveBeenCalled();
  });
});

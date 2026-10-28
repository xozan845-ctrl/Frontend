import { TestBed } from '@angular/core/testing';
import { CompanyProductModalComponent } from './company-product-modal.component';
import type { CompanyCatalogRow } from '../../../../applications/empresas/public-api';

function makeRow(overrides: Partial<CompanyCatalogRow> = {}): CompanyCatalogRow {
  return {
    id: 'p-1',
    kind: 'producto',
    code: 'SKU-1',
    name: 'Teclado',
    description: 'Demo',
    category: 'Periféricos',
    brand: 'Marca Demo',
    barcode: '750123',
    price: 100,
    cost: 50,
    margin: 50,
    stock: 10,
    minStock: 2,
    maxStock: 20,
    durationMinutes: null,
    status: 'activo',
    unit: 'Unidad (u)',
    allowFractions: false,
    purchaseUnit: 'Igual que la de venta',
    contentAmount: 0,
    contentUnit: 'Sin contenido',
    priceType: 'fijo',
    costType: 'fijo',
    warrantyMonths: 12,
    isRawMaterial: false,
    location: 'Estante 1',
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    ...overrides,
  };
}

describe('CompanyProductModalComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyProductModalComponent],
    }).compileComponents();
    return TestBed.createComponent(CompanyProductModalComponent);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('no debe renderizar el diálogo cuando está cerrado', async () => {
    const fixture = await setup();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="company-product-modal"]')).toBeNull();
  });

  it('debe abrir en modo producto y alternar a servicio', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="company-product-modal"]'),
    ).not.toBeNull();
    expect(fixture.componentInstance.isService()).toBe(false);

    fixture.nativeElement.querySelector('[data-testid="modal-type-servicio"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isService()).toBe(true);
    expect(fixture.componentInstance.form.controls.unit.value).toBe('Hora (h)');
  });

  it('debe precargar una fila en modo edición y bloquear el código', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('item', makeRow());
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.name.value).toBe('Teclado');
    expect(fixture.componentInstance.form.controls.code.value).toBe('SKU-1');
    expect(fixture.componentInstance.form.controls.code.disabled).toBe(true);
    expect(fixture.componentInstance.form.controls.stock.value).toBe(10);
  });

  it('debe emitir el payload del producto', async () => {
    const fixture = await setup();
    const emit = vi.fn();
    fixture.componentInstance.save.subscribe(emit);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      name: 'Camisa',
      code: 'CAM-1',
      price: '250.00',
      cost: '150.00',
      stock: 5,
    });
    fixture.componentInstance.submitForm();

    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'producto',
        name: 'Camisa',
        code: 'CAM-1',
        price: '250.00',
        cost: '150.00',
        stock: 5,
      }),
    );
  });

  it('no debe emitir si el formulario es inválido', async () => {
    const fixture = await setup();
    const emit = vi.fn();
    fixture.componentInstance.save.subscribe(emit);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.componentInstance.submitForm();

    expect(emit).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.name.touched).toBe(true);
  });

  it('debe mostrar el aviso de escaneo y cerrar', async () => {
    const fixture = await setup();
    const dismissed = vi.fn();
    fixture.componentInstance.dismiss.subscribe(dismissed);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    fixture.componentInstance.requestScan();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('escaneo con cámara');

    fixture.componentInstance.close();
    expect(dismissed).toHaveBeenCalled();
  });
});

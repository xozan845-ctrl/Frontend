import { TestBed } from '@angular/core/testing';
import { CompanyCatalogTableComponent } from './company-catalog-table.component';
import type { CompanyCatalogRow } from '../../../../empresas/public-api';

function makeRow(overrides: Partial<CompanyCatalogRow> = {}): CompanyCatalogRow {
  return {
    id: 'p-1',
    kind: 'producto',
    code: 'SKU-1',
    name: 'Teclado',
    description: 'Demo',
    category: 'Periféricos',
    brand: 'Marca Demo',
    barcode: '',
    price: 100,
    cost: 50,
    margin: 50,
    stock: 10,
    minStock: 2,
    maxStock: null,
    durationMinutes: null,
    status: 'activo',
    unit: 'Unidad (u)',
    allowFractions: false,
    purchaseUnit: 'Igual que la de venta',
    contentAmount: 0,
    contentUnit: 'Sin contenido',
    priceType: 'fijo',
    costType: 'fijo',
    warrantyMonths: null,
    isRawMaterial: false,
    location: '',
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    ...overrides,
  };
}

describe('CompanyCatalogTableComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyCatalogTableComponent],
    }).compileComponents();
    return TestBed.createComponent(CompanyCatalogTableComponent);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('debe mostrar el estado vacío y emitir create', async () => {
    const fixture = await setup();
    const create = vi.fn();
    fixture.componentInstance.create.subscribe(create);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="catalog-table-empty"]'),
    ).not.toBeNull();
    fixture.nativeElement.querySelector('[data-testid="catalog-table-new"]').click();
    expect(create).toHaveBeenCalled();
  });

  it('debe renderizar productos y emitir edición', async () => {
    const fixture = await setup();
    const edit = vi.fn();
    fixture.componentInstance.edit.subscribe(edit);
    fixture.componentRef.setInput('rows', [makeRow()]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="catalog-row"]').textContent,
    ).toContain('Teclado');
    fixture.nativeElement.querySelector('[data-testid="edit-row-p-1"]').click();
    expect(edit).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-1' }));
  });

  it('debe mostrar duración en servicios y permitir eliminar', async () => {
    const fixture = await setup();
    const remove = vi.fn();
    fixture.componentInstance.remove.subscribe(remove);
    fixture.componentRef.setInput('rows', [
      makeRow({ id: 's-1', kind: 'servicio', name: 'Soporte', durationMinutes: 90, stock: null }),
    ]);
    fixture.componentRef.setInput('tab', 'servicios');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Duración');
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('90 min');

    fixture.nativeElement.querySelector('[data-testid="delete-row-s-1"]').click();
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ id: 's-1' }));
  });

  it('debe mostrar el estado de carga', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });
});

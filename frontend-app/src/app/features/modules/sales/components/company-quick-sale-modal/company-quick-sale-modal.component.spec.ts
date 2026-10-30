import { TestBed } from '@angular/core/testing';
import { CompanyQuickSaleModalComponent } from './company-quick-sale-modal.component';
import type { CatalogProduct } from '../../../../applications/products/public-api';
import type { CreateCompanySalePayload } from '../../../../applications/empresas/public-api';

const product: CatalogProduct = {
  id: 'p-1',
  companyId: 'empresa-1',
  sku: 'SKU-1',
  name: 'Café',
  description: '',
  category: 'Bebidas',
  basePrice: 150,
  stock: 10,
  status: 'disponible',
  operationalStatus: 'activo',
  cost: 60,
  brand: 'Marca Demo',
  barcode: '',
  unit: 'Unidad (u)',
  allowFractions: false,
  purchaseUnit: 'Igual que la de venta',
  contentAmount: 0,
  contentUnit: 'Sin contenido',
  priceType: 'fijo',
  costType: 'fijo',
  minStock: 2,
  maxStock: null,
  warrantyMonths: null,
  isRawMaterial: false,
  location: '',
  createdAt: '2026-09-01T12:00:00.000Z',
  updatedAt: '2026-09-01T12:00:00.000Z',
};

const secondProduct: CatalogProduct = {
  ...product,
  id: 'p-2',
  sku: 'SKU-2',
  name: 'Arroz',
  basePrice: 80,
};

describe('CompanyQuickSaleModalComponent', () => {
  const setup = async (open = true, error: string | null = null) => {
    await TestBed.configureTestingModule({
      imports: [CompanyQuickSaleModalComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyQuickSaleModalComponent);
    fixture.componentRef.setInput('open', open);
    fixture.componentRef.setInput('products', [product, secondProduct]);
    fixture.componentRef.setInput('nextNumber', 'V-001164');
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  };

  const query = (fixture: Awaited<ReturnType<typeof setup>>, testId: string) =>
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;

  const type = (fixture: Awaited<ReturnType<typeof setup>>, testId: string, value: string) => {
    const field = query(fixture, testId) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const scan = (fixture: Awaited<ReturnType<typeof setup>>, value: string) => {
    type(fixture, 'quick-sale-scan', value);
    const field = query(fixture, 'quick-sale-scan') as HTMLInputElement;
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('no debe renderizar nada cuando está cerrado', async () => {
    const fixture = await setup(false);

    expect(query(fixture, 'company-quick-sale-dialog')).toBeNull();
  });

  it('debe agregar por código y acumular la misma línea al escanear de nuevo', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.textContent).toContain('V-001164');
    scan(fixture, 'SKU-1');
    expect(fixture.nativeElement.textContent).toContain('Café');
    expect((query(fixture, 'quick-sale-scan') as HTMLInputElement).value).toBe('');

    scan(fixture, 'sku-1');
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="quick-sale-line"]')).toHaveLength(
      1,
    );
  });

  it('debe agregar por nombre y reportar códigos inexistentes', async () => {
    const fixture = await setup();

    scan(fixture, 'arroz');
    expect(fixture.nativeElement.textContent).toContain('Arroz');

    scan(fixture, 'NO-EXISTE');
    expect(query(fixture, 'quick-sale-scan-error')?.textContent).toContain(
      'No encontramos un producto',
    );
  });

  it('debe agregar desde las sugerencias', async () => {
    const fixture = await setup();

    type(fixture, 'quick-sale-scan', 'caf');
    fixture.detectChanges();
    const suggestion = fixture.nativeElement.querySelector(
      '[data-testid="quick-sale-suggestion"]',
    ) as HTMLButtonElement;
    expect(suggestion).not.toBeNull();
    suggestion.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Café');
    expect((query(fixture, 'quick-sale-scan') as HTMLInputElement).value).toBe('');
  });

  it('debe ajustar cantidades y eliminar líneas', async () => {
    const fixture = await setup();
    scan(fixture, 'SKU-1');
    scan(fixture, 'SKU-1');

    fixture.nativeElement.querySelector('[aria-label="Quitar una unidad de Café"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Agregar una unidad de Café"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Eliminar Café"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Escanea el primer producto para comenzar');
  });

  it('debe emitir el cobro con método, fecha y consumidor final', async () => {
    const fixture = await setup();
    let emitted: CreateCompanySalePayload | undefined;
    fixture.componentInstance.submitSale.subscribe((payload) => (emitted = payload));

    scan(fixture, 'SKU-1');
    fixture.nativeElement.querySelector('[data-testid="sale-payment-transferencia"]').click();
    fixture.detectChanges();
    type(fixture, 'quick-sale-date', '2026-10-20');
    query(fixture, 'quick-sale-submit')?.click();
    fixture.detectChanges();

    expect(emitted).toMatchObject({
      client: { mode: 'final', name: 'Consumidor final' },
      paymentMethod: 'transferencia',
      date: '2026-10-20',
      discountPercent: 0,
      notes: 'Venta rápida',
    });
    expect(emitted?.lines[0]).toMatchObject({ name: 'Café', quantity: 1, subtotal: 150 });
  });

  it('debe deshabilitar el cobro sin líneas, mostrar error y cerrar', async () => {
    const fixture = await setup(true, 'No se pudo registrar la venta.');
    let dismissed = false;
    fixture.componentInstance.dismiss.subscribe(() => (dismissed = true));

    expect(query(fixture, 'company-quick-sale-error')?.textContent).toContain(
      'No se pudo registrar la venta.',
    );
    expect(query(fixture, 'quick-sale-submit')?.hasAttribute('disabled')).toBe(true);

    query(fixture, 'close-company-quick-sale')?.click();
    expect(dismissed).toBe(true);
  });

  it('debe reiniciar el POS al reabrir', async () => {
    const fixture = await setup();
    scan(fixture, 'SKU-1');
    expect(fixture.nativeElement.textContent).toContain('Café');

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Escanea el primer producto para comenzar');
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import type { CatalogProduct } from '../../../../applications/products/public-api';
import {
  CompanyProductsStore,
  CompanyServicesStore,
  type CompanyCatalogRow,
  type CompanyCatalogSort,
  type CompanyCatalogStatusFilter,
} from '../../../../applications/empresas/public-api';
import CompanyProductsComponent from './company-products.component';

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

describe('CompanyProductsComponent', () => {
  const productsRows = signal<CompanyCatalogRow[]>([]);
  const servicesRows = signal<CompanyCatalogRow[]>([]);
  const productsSaving = signal(false);
  const productsError = signal<string | null>(null);
  const productsLastSaved = signal<CatalogProduct | null>(null);
  const productsStatus = signal<CompanyCatalogStatusFilter>('todos');
  const productsQuery = signal('');
  const productsBrand = signal('');
  const productsSort = signal<CompanyCatalogSort>('nombre-az');
  const servicesStatus = signal<'activo' | 'inactivo' | null>(null);
  const servicesSearch = signal('');
  const servicesBrand = signal('');
  const servicesSort = signal<CompanyCatalogSort>('nombre-az');

  const products = {
    kpis: signal({
      activeProducts: 2,
      inventoryValue: 500,
      inventoryOk: 1,
      rawMaterial: 1,
    }).asReadonly(),
    total: signal(2).asReadonly(),
    rawMaterialCount: signal(1).asReadonly(),
    pagedRows: productsRows.asReadonly(),
    filteredCount: signal(2).asReadonly(),
    currentPage: signal(1).asReadonly(),
    pageCount: signal(1).asReadonly(),
    isFirstPage: signal(true).asReadonly(),
    isLastPage: signal(true).asReadonly(),
    loading: signal(false).asReadonly(),
    saving: productsSaving.asReadonly(),
    error: productsError.asReadonly(),
    lastSaved: productsLastSaved.asReadonly(),
    status: productsStatus.asReadonly(),
    query: productsQuery.asReadonly(),
    brand: productsBrand.asReadonly(),
    sort: productsSort.asReadonly(),
    brands: signal(['Marca Demo']).asReadonly(),
    load: vi.fn(),
    setQuery: vi.fn((value: string) => productsQuery.set(value)),
    setBrand: vi.fn((value: string) => productsBrand.set(value)),
    setSort: vi.fn((value: CompanyCatalogSort) => productsSort.set(value)),
    setStatus: vi.fn((value: CompanyCatalogStatusFilter) => productsStatus.set(value)),
    setOnlyRawMaterial: vi.fn(),
    setPage: vi.fn(),
    clearFilters: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    acknowledgeSaved: vi.fn(),
    clearError: vi.fn(),
    templateCsv: vi.fn(() => 'csv'),
    inventoryCsv: vi.fn(() => 'csv'),
  };

  const services = {
    activeCount: signal(1).asReadonly(),
    total: signal(1).asReadonly(),
    pagedRows: servicesRows.asReadonly(),
    filteredCount: signal(1).asReadonly(),
    currentPage: signal(1).asReadonly(),
    pageCount: signal(1).asReadonly(),
    isFirstPage: signal(true).asReadonly(),
    isLastPage: signal(true).asReadonly(),
    status: servicesStatus.asReadonly(),
    search: servicesSearch.asReadonly(),
    brand: servicesBrand.asReadonly(),
    sort: servicesSort.asReadonly(),
    brands: signal(['Otra marca']).asReadonly(),
    setSearch: vi.fn((value: string) => servicesSearch.set(value)),
    setBrand: vi.fn((value: string) => servicesBrand.set(value)),
    setSort: vi.fn((value: CompanyCatalogSort) => servicesSort.set(value)),
    setStatus: vi.fn((value: 'activo' | 'inactivo' | null) => servicesStatus.set(value)),
    clearFilters: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    createFromForm: vi.fn(() => ({ ok: true })),
    updateFromForm: vi.fn(() => ({ ok: true })),
    remove: vi.fn(() => ({ ok: true })),
    inventoryCsv: vi.fn(() => 'csv'),
  };

  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyProductsComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyProductsStore, useValue: products },
        { provide: CompanyServicesStore, useValue: services },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    })
      .overrideComponent(CompanyProductsComponent, { set: { providers: [] } })
      .compileComponents();

    const fixture = TestBed.createComponent(CompanyProductsComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    productsRows.set([]);
    servicesRows.set([]);
    productsSaving.set(false);
    productsError.set(null);
    productsLastSaved.set(null);
    productsStatus.set('todos');
    productsQuery.set('');
    productsBrand.set('');
    productsSort.set('nombre-az');
    servicesStatus.set(null);
    servicesSearch.set('');
    servicesBrand.set('');
    servicesSort.set('nombre-az');
    TestBed.resetTestingModule();
  });

  it('debe cargar productos y mostrar KPIs y pestañas', async () => {
    const fixture = await setup();

    expect(products.load).toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="kpi-active-products"]').textContent,
    ).toContain('2');
    expect(
      fixture.nativeElement.querySelector('[data-testid="kpi-inventory-value"]').textContent,
    ).toContain('500');
    expect(fixture.nativeElement.querySelector('[data-testid="products-tab"]')).not.toBeNull();
  });

  it('debe cambiar de pestaña y mostrar servicios', async () => {
    servicesRows.set([makeRow({ id: 's-1', kind: 'servicio', name: 'Soporte' })]);
    const fixture = await setup();

    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="catalog-row"]').textContent,
    ).toContain('Soporte');
  });

  it('debe abrir el modal de producto y enviar el payload', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('[data-testid="new-product"]').click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="company-product-modal"]'),
    ).not.toBeNull();
    fixture.nativeElement.querySelector('[data-testid="product-modal-name"]').value =
      'Producto Nuevo';
    fixture.nativeElement
      .querySelector('[data-testid="product-modal-name"]')
      .dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-testid="product-modal-code"]').value = 'SKU-9';
    fixture.nativeElement
      .querySelector('[data-testid="product-modal-code"]')
      .dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-testid="product-modal-price"]').value = '250.00';
    fixture.nativeElement
      .querySelector('[data-testid="product-modal-price"]')
      .dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="save-product-modal"]').click();
    fixture.detectChanges();

    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'producto',
        name: 'Producto Nuevo',
        code: 'SKU-9',
        price: '250.00',
      }),
    );
  });

  it('debe crear un servicio y cerrar el modal', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="new-product"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.modalType()).toBe('servicio');
    fixture.nativeElement.querySelector('[data-testid="product-modal-name"]').value = 'Soporte';
    fixture.nativeElement
      .querySelector('[data-testid="product-modal-name"]')
      .dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-testid="product-modal-code"]').value = 'SRV-9';
    fixture.nativeElement
      .querySelector('[data-testid="product-modal-code"]')
      .dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-testid="product-modal-price"]').value = '100.00';
    fixture.nativeElement
      .querySelector('[data-testid="product-modal-price"]')
      .dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="save-product-modal"]').click();
    fixture.detectChanges();

    expect(services.createFromForm).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'servicio', name: 'Soporte', code: 'SRV-9' }),
    );
    expect(fixture.nativeElement.querySelector('[data-testid="company-product-modal"]')).toBeNull();
  });

  it('debe abrir la edición de una fila de producto', async () => {
    const row = makeRow();
    productsRows.set([row]);
    const fixture = await setup();

    fixture.nativeElement.querySelector('[data-testid="edit-row-p-1"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.modalMode()).toBe('edit');
    expect(fixture.componentInstance.editingRow()).toEqual(row);
  });

  it('debe filtrar y limpiar desde los controles', async () => {
    const fixture = await setup();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="catalog-search"]',
    ) as HTMLInputElement;
    search.value = 'teclado';
    search.dispatchEvent(new Event('input'));
    expect(products.setQuery).toHaveBeenCalledWith('teclado');

    const sort = fixture.nativeElement.querySelector(
      '[data-testid="catalog-sort"]',
    ) as HTMLSelectElement;
    sort.value = 'precio-asc';
    sort.dispatchEvent(new Event('change'));
    expect(products.setSort).toHaveBeenCalledWith('precio-asc');

    fixture.nativeElement.querySelector('[data-testid="clear-catalog-filters"]').click();
    expect(products.clearFilters).toHaveBeenCalled();
  });

  it('debe confirmar y eliminar un servicio', async () => {
    const row = makeRow({ id: 's-1', kind: 'servicio', name: 'Soporte' });
    servicesRows.set([row]);
    const fixture = await setup();
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();

    fixture.componentInstance.confirmDelete(row);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="confirm-delete-service"]').click();
    fixture.detectChanges();

    expect(services.remove).toHaveBeenCalledWith('s-1');
  });
});

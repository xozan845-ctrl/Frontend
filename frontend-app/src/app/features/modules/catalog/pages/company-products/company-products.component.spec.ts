import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import type { CatalogProduct } from '../../../../applications/products/public-api';
import {
  CompanyCatalogOperationsStore,
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
  const servicesSaving = signal(false);
  const servicesLoading = signal(false);
  const servicesError = signal<string | null>(null);
  const servicesLastSaved = signal<
    import('../../../../applications/empresas/public-api').CompanyServiceModel | null
  >(null);
  const servicesLastRemoved = signal<string | null>(null);

  const products = {
    products: signal<CatalogProduct[]>([]).asReadonly(),
    kpis: signal({
      activeProducts: 2,
      inventoryValue: 500,
      missingCostCount: 0,
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
    loading: servicesLoading.asReadonly(),
    saving: servicesSaving.asReadonly(),
    error: servicesError.asReadonly(),
    lastSaved: servicesLastSaved.asReadonly(),
    lastRemovedId: servicesLastRemoved.asReadonly(),
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
    load: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    acknowledgeSaved: vi.fn(() => servicesLastSaved.set(null)),
    acknowledgeRemoved: vi.fn(() => servicesLastRemoved.set(null)),
    clearError: vi.fn(),
    inventoryCsv: vi.fn(() => 'csv'),
  };

  const operations = {
    settings: signal(null).asReadonly(),
    settingsLoading: signal(false).asReadonly(),
    settingsSaving: signal(false).asReadonly(),
    settingsError: signal<string | null>(null).asReadonly(),
    settingsSaved: signal(false).asReadonly(),
    combos: signal([]).asReadonly(),
    combosLoading: signal(false).asReadonly(),
    combosSaving: signal(false).asReadonly(),
    combosError: signal<string | null>(null).asReadonly(),
    lastComboSaved: signal(null).asReadonly(),
    lastComboRemovedId: signal<string | null>(null).asReadonly(),
    activeComboCount: signal(0).asReadonly(),
    promotions: signal([]).asReadonly(),
    promotionRows: signal([]).asReadonly(),
    promotionsLoading: signal(false).asReadonly(),
    promotionsSaving: signal(false).asReadonly(),
    promotionsError: signal<string | null>(null).asReadonly(),
    lastPromotionSaved: signal(null).asReadonly(),
    lastPromotionRemovedId: signal<string | null>(null).asReadonly(),
    activePromotionCount: signal(0).asReadonly(),
    movements: signal([]).asReadonly(),
    movementRows: signal([]).asReadonly(),
    movementsLoading: signal(false).asReadonly(),
    movementsSaving: signal(false).asReadonly(),
    movementsError: signal<string | null>(null).asReadonly(),
    lastMovementSaved: signal(null).asReadonly(),
    movementCount: signal(0).asReadonly(),
    importing: signal(false).asReadonly(),
    importResult: signal(null).asReadonly(),
    importError: signal<string | null>(null).asReadonly(),
    scanning: signal(false).asReadonly(),
    scanResult: signal(null).asReadonly(),
    scanError: signal<string | null>(null).asReadonly(),
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    loadCombos: vi.fn(),
    createCombo: vi.fn(),
    updateCombo: vi.fn(),
    removeCombo: vi.fn(),
    loadPromotions: vi.fn(),
    createPromotion: vi.fn(),
    updatePromotion: vi.fn(),
    removePromotion: vi.fn(),
    loadMovements: vi.fn(),
    createMovement: vi.fn(),
    importProducts: vi.fn(),
    scan: vi.fn(),
    clearSettingsError: vi.fn(),
    clearCombosError: vi.fn(),
    clearPromotionsError: vi.fn(),
    clearMovementsError: vi.fn(),
    clearImport: vi.fn(),
    clearScan: vi.fn(),
    acknowledgeSettingsSaved: vi.fn(),
    acknowledgeComboSaved: vi.fn(),
    acknowledgeComboRemoved: vi.fn(),
    acknowledgePromotionSaved: vi.fn(),
    acknowledgePromotionRemoved: vi.fn(),
    acknowledgeMovementSaved: vi.fn(),
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
        { provide: CompanyCatalogOperationsStore, useValue: operations },
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
    servicesSaving.set(false);
    servicesLoading.set(false);
    servicesError.set(null);
    servicesLastSaved.set(null);
    servicesLastRemoved.set(null);
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

    expect(services.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'servicio', name: 'Soporte', code: 'SRV-9' }),
    );
    // El modal solo se cierra cuando el API confirma con un servicio guardado.
    servicesLastSaved.set({
      id: 'srv-1',
      companyId: 'e-1',
      code: 'SRV-9',
      name: 'Soporte',
      description: '',
      category: '',
      brand: '',
      barcode: '',
      price: 100,
      cost: 0,
      unit: 'Hora (h)',
      durationMinutes: 60,
      status: 'activo',
      createdAt: '2026-10-27T00:00:00.000Z',
      updatedAt: '2026-10-27T00:00:00.000Z',
    });
    fixture.detectChanges();
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
    // La fila y el diálogo se confirman solo con la respuesta del backend.
    servicesLastRemoved.set('s-1');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="service-delete-dialog"]')).toBeNull();
  });
});

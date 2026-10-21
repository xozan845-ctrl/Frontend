import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CatalogComponent from './catalog.component';
import { CatalogProductsStore } from '../../state/catalog-product/catalog-product.store';
import { AuthStore } from '../../../auth/public-api';
import { SeoService } from '../../../../core/services/seo/seo.service';
import { CatalogProduct } from '../../models/catalog-product.model';

const product: CatalogProduct = {
  id: 'p-1',
  companyId: 'e-1',
  sku: 'SKU-1',
  name: 'Teclado Mecánico',
  description: 'Demo',
  category: 'Periféricos',
  basePrice: 1000,
  stock: 10,
  status: 'disponible',
  createdAt: '2026-10-21T00:00:00.000Z',
};

describe('CatalogComponent', () => {
  const user = signal<{ id: string; name: string; email: string; role: string } | null>(null);
  const products = signal<CatalogProduct[]>([]);
  const total = signal(0);
  const page = signal(1);
  const pages = signal(1);
  const loading = signal(false);
  const saving = signal(false);
  const error = signal<string | null>(null);
  const lastSaved = signal<CatalogProduct | null>(null);

  const catalog = {
    products: products.asReadonly(),
    total: total.asReadonly(),
    page: page.asReadonly(),
    pages: pages.asReadonly(),
    loading: loading.asReadonly(),
    saving: saving.asReadonly(),
    error: error.asReadonly(),
    lastSaved: lastSaved.asReadonly(),
    isFirstPage: () => page() <= 1,
    isLastPage: () => page() >= pages(),
    hasProducts: () => products().length > 0,
    load: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    applyFilters: vi.fn(),
    goToPage: vi.fn(),
    acknowledgeSaved: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  };
  const authStore = { user: user.asReadonly() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [
        provideRouter([]),
        { provide: CatalogProductsStore, useValue: catalog },
        { provide: AuthStore, useValue: authStore },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    user.set({ id: 'u-1', name: 'Eva', email: 'eva@tienda.test', role: 'empresario' });
    products.set([]);
    total.set(0);
    page.set(1);
    pages.set(1);
    loading.set(false);
    saving.set(false);
    error.set(null);
    lastSaved.set(null);
    TestBed.resetTestingModule();
  });

  it('debe cargar el catálogo al entrar', async () => {
    await setup();

    expect(catalog.load).toHaveBeenCalled();
  });

  it('debe mostrar productos y permitir editar al empresario', async () => {
    products.set([product]);
    total.set(1);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelectorAll('[data-testid="catalog-row"]')).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="catalog-row"]').textContent,
    ).toContain('Teclado Mecánico');

    fixture.componentInstance.openEdit(product);
    fixture.detectChanges();
    expect(fixture.componentInstance.productForm.getRawValue().sku).toBe('SKU-1');
    expect(
      (fixture.nativeElement.querySelector('[data-testid="catalog-sku"]') as HTMLInputElement)
        .disabled,
    ).toBe(true);
  });

  it('debe crear un producto con el formulario', async () => {
    const fixture = await setup();
    fixture.componentInstance.openCreate();
    fixture.detectChanges();

    fixture.componentInstance.productForm.setValue({
      sku: 'SKU-9',
      name: 'Nuevo Producto',
      description: 'Demo',
      category: 'Demo',
      basePrice: '100.00',
      stock: 5,
    });
    fixture.componentInstance.submit();

    expect(catalog.create).toHaveBeenCalledWith({
      sku: 'SKU-9',
      name: 'Nuevo Producto',
      description: 'Demo',
      category: 'Demo',
      basePrice: '100.00',
      stock: 5,
    });
  });

  it('debe actualizar un producto existente sin enviar el SKU', async () => {
    products.set([product]);
    const fixture = await setup();
    fixture.componentInstance.openEdit(product);
    fixture.componentInstance.productForm.controls.stock.setValue(8);
    fixture.componentInstance.submit();

    expect(catalog.update).toHaveBeenCalledWith({
      id: 'p-1',
      data: {
        name: 'Teclado Mecánico',
        description: 'Demo',
        category: 'Periféricos',
        basePrice: '1000.00',
        stock: 8,
      },
    });
  });

  it('debe aplicar filtros en una sola llamada', async () => {
    const fixture = await setup();
    fixture.componentInstance.filterQuery.set('teclado');
    fixture.componentInstance.filterCategory.set('Periféricos');
    fixture.componentInstance.onStatusChange({
      target: { value: 'disponible' },
    } as unknown as Event);
    fixture.componentInstance.applyFilters();

    expect(catalog.applyFilters).toHaveBeenCalledWith({
      query: 'teclado',
      status: 'disponible',
      category: 'Periféricos',
    });
  });

  it('no debe mostrar acciones de gestión a un vendedor', async () => {
    user.set({ id: 'u-2', name: 'Vera', email: 'vera@tienda.test', role: 'vendedor' });
    products.set([product]);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="new-catalog-product"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="edit-catalog-p-1"]')).toBeNull();
  });

  it('debe mostrar el estado de carga', async () => {
    loading.set(true);
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });

  it('debe mostrar el estado vacío', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('[data-testid="catalog-empty"]')).not.toBeNull();
  });

  it('debe mostrar el error de carga', async () => {
    error.set('No se pudo cargar el catálogo.');
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="catalog-error"]').textContent,
    ).toContain('No se pudo cargar el catálogo.');
  });
});

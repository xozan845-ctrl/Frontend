import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeoService } from '../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { CatalogProductsStore } from '../../../products/public-api';
import type { CatalogProduct } from '../../../products/models/catalog-product.model';
import { CompanyServicesStore } from '../../state/company-services/company-services.store';
import CompanyProductsComponent from './company-products.component';

describe('CompanyProductsComponent', () => {
  const user = signal({
    id: 'u-1',
    name: 'Eva',
    email: 'eva@empresa.test',
    role: 'empresario',
    tenantId: 'e-1',
  });
  const products = signal<CatalogProduct[]>([]);
  const catalogTotal = signal(0);
  const catalog = {
    products: products.asReadonly(),
    total: catalogTotal.asReadonly(),
    page: signal(1).asReadonly(),
    pages: signal(1).asReadonly(),
    loading: signal(false).asReadonly(),
    saving: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    lastSaved: signal<CatalogProduct | null>(null).asReadonly(),
    isFirstPage: () => true,
    isLastPage: () => true,
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
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyProductsComponent],
      providers: [
        provideRouter([]),
        CompanyServicesStore,
        { provide: CatalogProductsStore, useValue: catalog },
        { provide: AuthStore, useValue: { user: user.asReadonly() } },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompanyProductsComponent);
    fixture.detectChanges();
    return fixture;
  };

  const fillServiceForm = (
    fixture: Awaited<ReturnType<typeof setup>>,
    overrides: Partial<{
      code: string;
      name: string;
      description: string;
      category: string;
      price: string;
      durationMinutes: number;
      status: 'activo' | 'inactivo';
    }> = {},
  ) => {
    fixture.componentInstance.serviceForm.setValue({
      code: 'SRV-001',
      name: 'Mantenimiento',
      description: 'Revisión completa',
      category: 'Soporte',
      price: '1500.00',
      durationMinutes: 90,
      status: 'activo',
      ...overrides,
    });
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    products.set([]);
    catalogTotal.set(0);
    TestBed.resetTestingModule();
  });

  it('debe mostrar el catálogo de productos por defecto', async () => {
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="company-products-page"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-catalog-page')).not.toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="products-tab"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(catalog.load).toHaveBeenCalled();
  });

  it('debe cambiar a la pestaña de servicios y mostrar el estado vacío', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-catalog-page')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="services-empty"]')).not.toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="services-tab"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('debe crear un servicio desde el formulario', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="new-service"]').click();
    fixture.detectChanges();
    fillServiceForm(fixture);
    fixture.componentInstance.submitService();
    fixture.detectChanges();

    const services = fixture.componentInstance.services;
    expect(services.total()).toBe(1);
    expect(services.services()[0]).toMatchObject({
      code: 'SRV-001',
      name: 'Mantenimiento',
      price: 1500,
      durationMinutes: 90,
    });
    expect(fixture.nativeElement.querySelector('[data-testid="service-form"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="service-row"]')).not.toBeNull();
  });

  it('debe mostrar el error cuando el código está duplicado', async () => {
    const fixture = await setup();
    fixture.componentInstance.services.create({
      code: 'SRV-001',
      name: 'Existente',
      price: '100',
      durationMinutes: 30,
    });
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="new-service"]').click();
    fixture.detectChanges();

    fillServiceForm(fixture);
    fixture.componentInstance.submitService();
    fixture.detectChanges();

    expect(fixture.componentInstance.services.total()).toBe(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="service-form-error"]').textContent,
    ).toContain('código');
  });

  it('debe editar un servicio existente sin cambiar el código', async () => {
    const fixture = await setup();
    const created = fixture.componentInstance.services.create({
      code: 'SRV-001',
      name: 'Original',
      price: '100',
      durationMinutes: 30,
    }).service!;
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();

    fixture.componentInstance.openEditService(created);
    fixture.detectChanges();
    expect(fixture.componentInstance.serviceForm.controls.code.disabled).toBe(true);

    fixture.componentInstance.serviceForm.patchValue({ name: 'Actualizado', price: '250.00' });
    fixture.componentInstance.submitService();
    fixture.detectChanges();

    expect(fixture.componentInstance.services.services()[0]).toMatchObject({
      code: 'SRV-001',
      name: 'Actualizado',
      price: 250,
    });
  });

  it('debe eliminar un servicio con confirmación', async () => {
    const fixture = await setup();
    const created = fixture.componentInstance.services.create({
      code: 'SRV-001',
      name: 'Eliminar',
      price: '100',
      durationMinutes: 30,
    }).service!;
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();

    fixture.componentInstance.confirmDelete(created);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="service-delete-dialog"]'),
    ).not.toBeNull();

    fixture.nativeElement.querySelector('[data-testid="confirm-delete-service"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.services.total()).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="service-delete-dialog"]')).toBeNull();
  });

  it('debe filtrar los servicios desde los controles', async () => {
    const fixture = await setup();
    fixture.componentInstance.services.create({
      code: 'SRV-001',
      name: 'Instalación',
      category: 'Campo',
      price: '100',
      durationMinutes: 30,
    });
    fixture.componentInstance.services.create({
      code: 'SRV-002',
      name: 'Soporte',
      category: 'Remoto',
      price: '200',
      durationMinutes: 60,
    });
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector(
      '[data-testid="services-search"]',
    ) as HTMLInputElement;
    search.value = 'instalacion';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.services.filteredCount()).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="service-row"]')).toHaveLength(1);
  });

  it('no debe guardar un servicio con el formulario inválido', async () => {
    const fixture = await setup();
    fixture.nativeElement.querySelector('[data-testid="services-tab"]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="new-service"]').click();
    fixture.detectChanges();

    fixture.componentInstance.submitService();

    expect(fixture.componentInstance.services.total()).toBe(0);
    expect(fixture.componentInstance.serviceForm.controls.name.touched).toBe(true);
  });
});

import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import CreateStoreComponent from './create-store.component';
import { StoreWizardStore } from '../../state/store-wizard/store-wizard.store';
import { STORE_REPOSITORY, StoreRepository } from '../../repositories/store.repository';
import { CATALOG_REPOSITORY, CatalogRepository } from '../../repositories/catalog.repository';
import { COMPANY_REPOSITORY, CompanyRepository } from '../../../empresas/public-api';
import { CatalogProductOption } from '../../models/store-wizard.model';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { SeoService } from '../../../../core/services/seo/seo.service';
import type { User } from '../../../auth/public-api';

const createdStore = { id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: '' };

describe('CreateStoreComponent', () => {
  let repo: StoreRepository;
  let catalogRepo: CatalogRepository;
  let companyRepo: CompanyRepository;
  let currentUser: User | null;
  const authStore = {
    user: () => currentUser,
    isAuthenticated: () => currentUser !== null,
    isSeller: () => currentUser?.role === 'vendedor' || currentUser?.role === 'empresario',
    loading: () => false,
    error: () => null,
    register: vi.fn(),
    clearSession: vi.fn(),
    refreshTokenOnce: vi.fn().mockResolvedValue(true),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    repo = {
      createStore: vi.fn(() => of(createdStore)),
      getMyStore: vi.fn(() => of(null)),
      publishOffer: vi.fn(() => of(undefined)),
    };
    catalogRepo = {
      listCatalog: vi.fn(() => of([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }])),
    };
    companyRepo = {
      create: vi.fn(() =>
        of({
          id: 'c-1',
          name: 'Mi Empresa',
          logisticsMode: 'plataforma' as const,
          status: 'activa',
          createdBy: 'u-1',
          createdAt: '2026-10-21T00:00:00.000Z',
        }),
      ),
      getById: vi.fn(),
      updateLogistics: vi.fn(),
      createSeller: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [CreateStoreComponent],
      providers: [
        provideRouter([]),
        StoreWizardStore,
        { provide: STORE_REPOSITORY, useValue: repo },
        { provide: CATALOG_REPOSITORY, useValue: catalogRepo },
        { provide: COMPANY_REPOSITORY, useValue: companyRepo },
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CreateStoreComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = null;
    TestBed.resetTestingModule();
  });

  it('debe registrar la cuenta como vendedor con datos válidos', async () => {
    const fixture = await setup();
    fixture.componentInstance.accountForm.setValue({
      name: 'Ana Pérez',
      email: 'ana@tienda.test',
      password: 'secreto123',
    });

    fixture.componentInstance.register();

    expect(authStore.register).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      email: 'ana@tienda.test',
      password: 'secreto123',
      role: 'seller',
    });
  });

  it('no debe registrar con el formulario inválido', async () => {
    const fixture = await setup();
    fixture.componentInstance.accountForm.setValue({ name: '', email: 'x', password: '123' });

    fixture.componentInstance.register();

    expect(authStore.register).not.toHaveBeenCalled();
  });

  it('debe detectar una cuenta de comprador (no puede crear tienda)', async () => {
    currentUser = { id: 1, email: 'a@a.com', name: 'Ana', role: 'comprador' };
    const fixture = await setup();

    expect(fixture.componentInstance.isBuyer()).toBe(true);
    expect(fixture.componentInstance.isSeller()).toBe(false);
  });

  it('debe detectar una cuenta de empresario como vendedor (ADR-26)', async () => {
    currentUser = { id: 2, email: 'e@e.com', name: 'Eva', role: 'empresario' };
    const fixture = await setup();

    expect(fixture.componentInstance.isSeller()).toBe(true);
    expect(fixture.componentInstance.isBuyer()).toBe(false);
  });

  it('debe crear la empresa y la tienda cuando el empresario no tiene tenant', async () => {
    currentUser = { id: 2, email: 'e@e.com', name: 'Eva', role: 'empresario' };
    const fixture = await setup();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.step()).toBe(2));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="company-setup"]')).not.toBeNull();

    fixture.componentInstance.storeForm.setValue({
      companyName: 'Mi Empresa',
      logisticsMode: 'hibrida',
      name: 'Mi Tienda',
      description: 'Demo',
    });
    fixture.componentInstance.createStore();

    await vi.waitFor(() => expect(fixture.componentInstance.wizard.store()).toEqual(createdStore));
    expect(companyRepo.create).toHaveBeenCalledWith({
      name: 'Mi Empresa',
      logisticsMode: 'hibrida',
    });
    expect(repo.createStore).toHaveBeenCalledWith({
      name: 'Mi Tienda',
      description: 'Demo',
    });
    expect(fixture.componentInstance.wizard.step()).toBe(3);
  });

  it('debe usar el nombre de la tienda como empresa si se deja vacío', async () => {
    currentUser = { id: 2, email: 'e@e.com', name: 'Eva', role: 'empresario' };
    const fixture = await setup();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.step()).toBe(2));

    fixture.componentInstance.storeForm.setValue({
      companyName: '',
      logisticsMode: 'plataforma',
      name: 'Mi Tienda',
      description: '',
    });
    fixture.componentInstance.createStore();

    await vi.waitFor(() => expect(companyRepo.create).toHaveBeenCalled());
    expect(companyRepo.create).toHaveBeenCalledWith({
      name: 'Mi Tienda',
      logisticsMode: 'plataforma',
    });
  });

  it('no debe crear la tienda si el formulario es inválido', async () => {
    const fixture = await setup();

    fixture.componentInstance.createStore();

    expect(repo.createStore).not.toHaveBeenCalled();
  });

  // regression: 71 — al crear la tienda se entra al paso 3 y se carga el catálogo.
  it('debe cargar el catálogo cuando crea la tienda y avanza al paso de productos', async () => {
    const fixture = await setup();
    fixture.componentInstance.storeForm.setValue({
      companyName: '',
      logisticsMode: 'plataforma',
      name: 'Mi Tienda',
      description: 'Demo',
    });

    fixture.componentInstance.createStore();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.step()).toBe(3));

    expect(repo.createStore).toHaveBeenCalledWith({ name: 'Mi Tienda', description: 'Demo' });
    expect(catalogRepo.listCatalog).toHaveBeenCalled();
  });

  it('debe mostrar el estado de carga del catálogo mientras se cargan los productos', async () => {
    const pending = new Subject<CatalogProductOption[]>();
    const fixture = await setup();
    vi.mocked(catalogRepo.listCatalog).mockReturnValue(pending);
    fixture.componentInstance.wizard.goToProductsStep();
    fixture.detectChanges();

    const loading = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="catalog-loading"]',
    );
    expect(loading).not.toBeNull();
    expect(loading?.getAttribute('role')).toBe('status');

    pending.next([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }]);
    pending.complete();
  });

  it('debe navegar a la tienda en el paso final', async () => {
    const fixture = await setup();
    fixture.componentInstance.wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.store()).toEqual(createdStore));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToStore();

    expect(navigate).toHaveBeenCalledWith(['/tienda', 't-1', 'shop']);
  });

  it('debe poder omitir la publicación de productos', async () => {
    const fixture = await setup();
    fixture.componentInstance.wizard.goToProductsStep();

    fixture.componentInstance.skipProducts();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.step()).toBe(4));

    expect(repo.publishOffer).not.toHaveBeenCalled();
  });

  it('debe exponer hasSelection como derivado al seleccionar un producto', async () => {
    const fixture = await setup();
    fixture.componentInstance.wizard.goToProductsStep();
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.productRows.length).toBe(1));
    expect(fixture.componentInstance.hasSelection()).toBe(false);

    fixture.componentInstance.toggleRow(0);
    fixture.detectChanges();

    expect(fixture.componentInstance.hasSelection()).toBe(true);
  });

  it('exige cinco productos para habilitar la publicación inicial', async () => {
    const catalog = Array.from({ length: 5 }, (_, index) => ({
      id: `p-${index + 1}`,
      name: `Producto ${index + 1}`,
      sku: `SKU-${index + 1}`,
    }));
    const fixture = await setup();
    vi.mocked(catalogRepo.listCatalog).mockReturnValue(of(catalog));

    fixture.componentInstance.wizard.goToProductsStep();
    await vi.waitFor(() => expect(fixture.componentInstance.productRows.length).toBe(5));
    fixture.detectChanges();

    const publishButton = fixture.nativeElement.querySelector(
      '[data-testid="publish-products"]',
    ) as HTMLButtonElement;
    expect(publishButton.disabled).toBe(true);

    for (let index = 0; index < 5; index += 1) {
      fixture.componentInstance.toggleRow(index);
    }
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedProductCount()).toBe(5);
    expect(fixture.componentInstance.hasMinimumProducts()).toBe(true);
    expect(publishButton.disabled).toBe(false);
  });

  it('redirige al panel cuando un empresario termina el onboarding', async () => {
    currentUser = {
      id: 2,
      email: 'e@e.com',
      name: 'Eva',
      role: 'empresario',
      tenantId: 'c-1',
    };
    const fixture = await setup();
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.store()).toEqual(createdStore));
    fixture.componentInstance.skipProducts();

    await vi.waitFor(() => expect(navigateByUrl).toHaveBeenCalledWith('/empresa/inicio'));
  });

  it('debe mostrar el estado de error del catálogo con reintento', async () => {
    const fixture = await setup();
    vi.mocked(catalogRepo.listCatalog).mockReturnValue(throwError(() => new Error('boom')));
    fixture.componentInstance.wizard.goToProductsStep();
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.error()).toBe('boom'));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No pudimos cargar el catálogo',
    );

    vi.mocked(catalogRepo.listCatalog).mockClear();
    fixture.componentInstance.retryCatalog();
    expect(catalogRepo.listCatalog).toHaveBeenCalled();
  });

  it('debe mostrar el error al crear la tienda con reintento', async () => {
    const fixture = await setup();
    vi.mocked(repo.createStore).mockReturnValue(
      throwError(() => new Error('No se pudo crear la tienda.')),
    );
    fixture.componentInstance.wizard.goToStoreStep();
    fixture.componentInstance.storeForm.setValue({
      companyName: '',
      logisticsMode: 'plataforma',
      name: 'Mi Tienda',
      description: '',
    });
    fixture.detectChanges();

    fixture.componentInstance.createStore();
    await vi.waitFor(() => expect(fixture.componentInstance.wizard.error()).toBeDefined());
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No se pudo crear la tienda.',
    );
  });

  it('debe restaurar el SEO al destruirse', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });
});

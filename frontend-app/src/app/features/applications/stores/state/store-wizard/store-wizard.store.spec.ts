import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StoreWizardStore } from './store-wizard.store';
import { STORE_REPOSITORY, StoreRepository } from '../../repositories/store.repository';
import { CATALOG_REPOSITORY, CatalogRepository } from '../../repositories/catalog.repository';
import { COMPANY_REPOSITORY, CompanyRepository } from '../../../empresas/public-api';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { CATALOG_PRODUCT_REPOSITORY, Store } from '../../../products/public-api';

const store: Store = { id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: '' };
const company = {
  id: 'c-1',
  name: 'Mi Empresa',
  logisticsMode: 'plataforma' as const,
  status: 'activa',
  createdBy: 'u-1',
  createdAt: '2026-10-21T00:00:00.000Z',
};

describe('StoreWizardStore', () => {
  let repo: StoreRepository;
  let catalogRepo: CatalogRepository;
  let companyRepo: CompanyRepository;
  let catalogProductRepo: { create: ReturnType<typeof vi.fn> };
  let authStore: { user: ReturnType<typeof vi.fn>; refreshTokenOnce: ReturnType<typeof vi.fn> };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      createStore: vi.fn(() => of(store)),
      getMyStore: vi.fn(() => of(null)),
      publishOffer: vi.fn(() => of(undefined)),
    };
    catalogRepo = {
      listCatalog: vi.fn(() => of([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }])),
    };
    companyRepo = {
      create: vi.fn(() => of(company)),
      getById: vi.fn(() => of(company)),
      updateLogistics: vi.fn(() => of(company)),
      createSeller: vi.fn(() =>
        of({
          id: 's-1',
          name: 'Vera',
          email: 'vera@tienda.test',
          role: 'vendedor',
          participationPercentage: 10,
        }),
      ),
    };
    catalogProductRepo = {
      create: vi.fn((data) => of({ id: `created-${data.sku}`, name: data.name })),
    };
    authStore = {
      user: vi.fn(() => null),
      refreshTokenOnce: vi.fn().mockResolvedValue(true),
    };
    TestBed.configureTestingModule({
      providers: [
        StoreWizardStore,
        { provide: STORE_REPOSITORY, useValue: repo },
        { provide: CATALOG_REPOSITORY, useValue: catalogRepo },
        { provide: COMPANY_REPOSITORY, useValue: companyRepo },
        { provide: CATALOG_PRODUCT_REPOSITORY, useValue: catalogProductRepo },
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(StoreWizardStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar en el paso 1 de 4', () => {
    const wizard = setup();

    expect(wizard.step()).toBe(1);
    expect(wizard.totalSteps()).toBe(4);
    expect(wizard.store()).toBeNull();
  });

  it('debe navegar entre pasos y resetear', () => {
    const wizard = setup();

    wizard.goToStoreStep();
    expect(wizard.step()).toBe(2);
    wizard.goToProductsStep();
    expect(wizard.step()).toBe(3);
    wizard.goBack();
    expect(wizard.step()).toBe(2);
    wizard.reset();

    expect(wizard.step()).toBe(1);
    expect(wizard.store()).toBeNull();
  });

  it('debe avanzar al paso de tienda cuando hay sesión de vendedor', () => {
    const wizard = setup();

    wizard.startForSeller(true);

    expect(wizard.step()).toBe(2);
  });

  it('debe permanecer en el paso de cuenta cuando no es vendedor', () => {
    const wizard = setup();

    wizard.startForSeller(false);

    expect(wizard.step()).toBe(1);
  });

  it('debe quedarse en el paso 1 cuando retrocede en el primer paso', () => {
    const wizard = setup();

    wizard.goBack();

    expect(wizard.step()).toBe(1);
    expect(wizard.isFirstStep()).toBe(true);
  });

  // regression: 71 — el catálogo debe cargarse al entrar al paso de productos.
  it('debe cargar el catálogo cuando avanza al paso de productos', async () => {
    const wizard = setup();

    wizard.goToProductsStep();

    await vi.waitFor(() => expect(wizard.catalog()).toHaveLength(1));
    expect(catalogRepo.listCatalog).toHaveBeenCalledTimes(1);
  });

  it('debe reportar el último paso cuando está en "Listo"', async () => {
    const wizard = setup();

    wizard.publishOffers([]);
    await vi.waitFor(() => expect(wizard.step()).toBe(4));

    expect(wizard.isLastStep()).toBe(true);
    expect(wizard.isFirstStep()).toBe(false);
  });

  it('debe crear la tienda y avanzar al paso de productos', async () => {
    const wizard = setup();

    wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(wizard.step()).toBe(3));

    expect(repo.createStore).toHaveBeenCalledWith({ name: 'Mi Tienda', description: '' });
    expect(wizard.store()).toEqual(store);
    expect(notification.showSuccess).toHaveBeenCalled();
  });

  it('debe registrar el error al crear la tienda', async () => {
    const wizard = setup();
    vi.mocked(repo.createStore).mockReturnValue(throwError(() => new Error('boom')));
    wizard.goToStoreStep();

    wizard.createStore({ name: 'X', description: '' });
    await vi.waitFor(() => expect(wizard.error()).toBe('boom'));

    expect(wizard.step()).toBe(2);
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe crear la empresa y la tienda cuando el empresario no tiene tenant', async () => {
    const wizard = setup();
    authStore.user.mockReturnValue({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
    });

    wizard.createStore({
      name: 'Mi Tienda',
      description: 'Demo',
      company: { name: 'Mi Empresa', logisticsMode: 'hibrida' },
    });
    await vi.waitFor(() => expect(wizard.store()).toEqual(store));

    expect(companyRepo.create).toHaveBeenCalledWith({
      name: 'Mi Empresa',
      logisticsMode: 'hibrida',
    });
    expect(authStore.refreshTokenOnce).toHaveBeenCalled();
    expect(repo.createStore).toHaveBeenCalledWith({ name: 'Mi Tienda', description: 'Demo' });
  });

  it('no debe crear la tienda si falla el alta de la empresa', async () => {
    const wizard = setup();
    vi.mocked(companyRepo.create).mockReturnValue(throwError(() => new Error('empresa duplicada')));

    wizard.createStore({
      name: 'Mi Tienda',
      description: '',
      company: { name: 'Mi Empresa', logisticsMode: 'plataforma' },
    });
    await vi.waitFor(() => expect(wizard.error()).toBe('empresa duplicada'));

    expect(repo.createStore).not.toHaveBeenCalled();
    expect(wizard.step()).toBe(1);
  });

  it('no debe crear la tienda si la sesión no se renueva tras la empresa', async () => {
    const wizard = setup();
    authStore.refreshTokenOnce.mockResolvedValue(false);

    wizard.createStore({
      name: 'Mi Tienda',
      description: '',
      company: { name: 'Mi Empresa', logisticsMode: 'propia' },
    });
    await vi.waitFor(() => expect(wizard.error()).toContain('la sesión no se pudo renovar'));

    expect(repo.createStore).not.toHaveBeenCalled();
  });

  it('debe omitir la empresa cuando el JWT ya trae el tenant', async () => {
    const wizard = setup();
    authStore.user.mockReturnValue({
      id: 'u-1',
      name: 'Eva',
      email: 'eva@tienda.test',
      role: 'empresario',
      tenantId: 'c-1',
    });

    wizard.createStore({
      name: 'Mi Tienda',
      description: '',
      company: { name: 'Mi Empresa', logisticsMode: 'plataforma' },
    });
    await vi.waitFor(() => expect(wizard.store()).toEqual(store));

    expect(companyRepo.create).not.toHaveBeenCalled();
    expect(repo.createStore).toHaveBeenCalled();
  });

  it('no debe publicar ofertas si aún no hay tienda', async () => {
    const wizard = setup();

    wizard.publishOffers([{ productId: 'p-1', margin: 15 }]);
    await vi.waitFor(() => expect(wizard.error()).toBe('Primero crea tu tienda.'));

    expect(repo.publishOffer).not.toHaveBeenCalled();
  });

  it('debe cargar el catálogo y registrar su error', async () => {
    const wizard = setup();

    wizard.loadCatalog();
    await vi.waitFor(() => expect(wizard.catalog()).toHaveLength(1));
    expect(wizard.catalogLoading()).toBe(false);

    vi.mocked(catalogRepo.listCatalog).mockReturnValue(throwError(() => new Error('boom')));
    wizard.loadCatalog();
    await vi.waitFor(() => expect(wizard.error()).toBe('boom'));
  });

  it('debe publicar ofertas y avanzar a "Listo"', async () => {
    const wizard = setup();
    wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(wizard.store()).toEqual(store));

    wizard.publishOffers([{ productId: 'p-1', margin: 15 }]);
    await vi.waitFor(() => expect(wizard.step()).toBe(4));

    expect(repo.publishOffer).toHaveBeenCalledWith('t-1', { productId: 'p-1', margin: 15 });
    expect(wizard.publishedCount()).toBe(1);
  });

  it('debe crear y publicar productos iniciales', async () => {
    const wizard = setup();
    wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(wizard.store()).toEqual(store));

    wizard.createAndPublishProducts([
      {
        sku: 'SKU-1',
        name: 'Producto 1',
        description: 'Descripción',
        category: 'General',
        basePrice: '100.00',
        stock: 10,
        margin: 15,
      },
    ]);
    await vi.waitFor(() => expect(wizard.step()).toBe(4));

    expect(catalogProductRepo.create).toHaveBeenCalledWith({
      sku: 'SKU-1',
      name: 'Producto 1',
      description: 'Descripción',
      category: 'General',
      basePrice: '100.00',
      stock: 10,
    });
    expect(repo.publishOffer).toHaveBeenCalledWith('t-1', {
      productId: 'created-SKU-1',
      margin: 15,
    });
    expect(wizard.publishedCount()).toBe(1);
  });

  it('debe rechazar productos iniciales sin tienda o sin datos', async () => {
    const wizard = setup();
    const draft = {
      sku: 'SKU-1',
      name: 'Producto 1',
      description: '',
      category: '',
      basePrice: '100.00',
      stock: 1,
      margin: 15,
    };

    wizard.createAndPublishProducts([draft]);
    await vi.waitFor(() => expect(wizard.error()).toBe('Primero crea tu tienda.'));
    expect(catalogProductRepo.create).not.toHaveBeenCalled();

    wizard.createAndPublishProducts([]);
    await vi.waitFor(() => expect(wizard.error()).toBe('Agrega al menos un producto.'));
  });

  it('debe conservar el error si falla la creación de un producto inicial', async () => {
    const wizard = setup();
    wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(wizard.store()).toEqual(store));
    vi.mocked(catalogProductRepo.create).mockReturnValue(throwError(() => new Error('boom')));

    wizard.createAndPublishProducts([
      {
        sku: 'SKU-1',
        name: 'Producto 1',
        description: '',
        category: '',
        basePrice: '100.00',
        stock: 1,
        margin: 15,
      },
    ]);
    await vi.waitFor(() => expect(wizard.error()).toBe('boom'));
    expect(repo.publishOffer).not.toHaveBeenCalled();
  });

  it('debe conservar el error si falla la publicación de un producto inicial', async () => {
    const wizard = setup();
    wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(wizard.store()).toEqual(store));
    vi.mocked(repo.publishOffer).mockReturnValue(throwError(() => new Error('boom')));

    wizard.createAndPublishProducts([
      {
        sku: 'SKU-1',
        name: 'Producto 1',
        description: '',
        category: '',
        basePrice: '100.00',
        stock: 1,
        margin: 15,
      },
    ]);
    await vi.waitFor(() => expect(wizard.error()).toBe('boom'));
    expect(catalogProductRepo.create).toHaveBeenCalled();
  });

  it('sin ofertas solo avanza a "Listo"', async () => {
    const wizard = setup();

    wizard.publishOffers([]);
    await vi.waitFor(() => expect(wizard.step()).toBe(4));

    expect(repo.publishOffer).not.toHaveBeenCalled();
    expect(wizard.publishedCount()).toBe(0);
  });

  it('debe registrar el error al publicar ofertas', async () => {
    const wizard = setup();
    wizard.createStore({ name: 'Mi Tienda', description: '' });
    await vi.waitFor(() => expect(wizard.store()).toEqual(store));
    vi.mocked(repo.publishOffer).mockReturnValue(throwError(() => new Error('boom')));

    wizard.publishOffers([{ productId: 'p-1', margin: 15 }]);
    await vi.waitFor(() => expect(wizard.error()).toBe('boom'));

    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe reemplazar el catálogo cuando se recarga sin mutar el anterior', async () => {
    const wizard = setup();
    wizard.loadCatalog();
    await vi.waitFor(() => expect(wizard.catalog()).toHaveLength(1));
    const previous = wizard.catalog();

    vi.mocked(catalogRepo.listCatalog).mockReturnValue(of([{ id: 'p-2', name: 'Mouse', sku: '' }]));
    wizard.loadCatalog();
    await vi.waitFor(() => expect(wizard.catalog()[0]?.id).toBe('p-2'));

    expect(wizard.catalog()).not.toBe(previous);
    expect(previous[0]?.id).toBe('p-1');
  });

  it('debe usar el mensaje por defecto cuando crear la tienda falla sin mensaje', async () => {
    const wizard = setup();
    vi.mocked(repo.createStore).mockReturnValue(throwError(() => new Error('')));

    wizard.createStore({ name: 'X', description: '' });
    await vi.waitFor(() => expect(wizard.error()).toBe('No se pudo crear la tienda.'));
  });

  it('debe usar el mensaje por defecto cuando el catálogo falla sin mensaje', async () => {
    const wizard = setup();
    vi.mocked(catalogRepo.listCatalog).mockReturnValue(throwError(() => new Error('')));

    wizard.loadCatalog();
    await vi.waitFor(() => expect(wizard.error()).toBe('No se pudo cargar el catálogo.'));
  });
});

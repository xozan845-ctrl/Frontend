import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StoreWizardStore } from './store-wizard.store';
import { STORE_REPOSITORY, StoreRepository } from '../repositories/store.repository';
import { CATALOG_REPOSITORY, CatalogRepository } from '../repositories/catalog.repository';
import { NotificationService } from '../../../core/services/notification.service';
import { Store } from '../../products/public-api';

const store: Store = { id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: '' };

describe('StoreWizardStore', () => {
  let repo: StoreRepository;
  let catalogRepo: CatalogRepository;
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
    TestBed.configureTestingModule({
      providers: [
        StoreWizardStore,
        { provide: STORE_REPOSITORY, useValue: repo },
        { provide: CATALOG_REPOSITORY, useValue: catalogRepo },
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

    wizard.publishOffers([{ productId: 'p-1', margin: 15 }]);
    await vi.waitFor(() => expect(wizard.step()).toBe(4));

    expect(repo.publishOffer).toHaveBeenCalledWith({ productId: 'p-1', margin: 15 });
    expect(wizard.publishedCount()).toBe(1);
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
    vi.mocked(repo.publishOffer).mockReturnValue(throwError(() => new Error('boom')));

    wizard.publishOffers([{ productId: 'p-1', margin: 15 }]);
    await vi.waitFor(() => expect(wizard.error()).toBe('boom'));

    expect(notification.showError).toHaveBeenCalled();
  });
});

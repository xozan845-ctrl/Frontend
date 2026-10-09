import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StoreWizardStore } from './store-wizard.store';
import { STORE_REPOSITORY, StoreRepository } from '../repositories/store.repository';
import { NotificationService } from '../../../core/services/notification.service';
import { Store } from '../../products/public-api';

const store: Store = { id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: '' };

describe('StoreWizardStore', () => {
  let repo: StoreRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      createStore: vi.fn(() => of(store)),
      getMyStore: vi.fn(() => of(null)),
      listCatalog: vi.fn(() => of([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }])),
      publishOffer: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [
        StoreWizardStore,
        { provide: STORE_REPOSITORY, useValue: repo },
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

    wizard.next();
    expect(wizard.step()).toBe(2);
    wizard.back();
    expect(wizard.step()).toBe(1);
    wizard.setStep(3);
    wizard.reset();

    expect(wizard.step()).toBe(1);
    expect(wizard.store()).toBeNull();
  });

  it('debe crear la tienda y avanzar al paso de productos', async () => {
    const wizard = setup();

    const ok = await wizard.createStore({ name: 'Mi Tienda', description: '' });

    expect(ok).toBe(true);
    expect(repo.createStore).toHaveBeenCalledWith({ name: 'Mi Tienda', description: '' });
    expect(wizard.store()).toEqual(store);
    expect(wizard.step()).toBe(3);
    expect(notification.showSuccess).toHaveBeenCalled();
  });

  it('debe registrar el error al crear la tienda', async () => {
    const wizard = setup();
    vi.mocked(repo.createStore).mockReturnValue(throwError(() => new Error('boom')));

    const ok = await wizard.createStore({ name: 'X', description: '' });

    expect(ok).toBe(false);
    expect(wizard.error()).toBe('boom');
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe cargar el catálogo y registrar su error', () => {
    const wizard = setup();

    wizard.loadCatalog();
    expect(wizard.catalog()).toHaveLength(1);
    expect(wizard.catalogLoading()).toBe(false);

    vi.mocked(repo.listCatalog).mockReturnValue(throwError(() => new Error('boom')));
    wizard.loadCatalog();
    expect(wizard.error()).toBe('boom');
  });

  it('debe publicar ofertas y avanzar a "Listo"', async () => {
    const wizard = setup();

    const ok = await wizard.publishOffers([{ productId: 'p-1', margin: 15 }]);

    expect(ok).toBe(true);
    expect(repo.publishOffer).toHaveBeenCalledWith({ productId: 'p-1', margin: 15 });
    expect(wizard.step()).toBe(4);
    expect(wizard.publishedCount()).toBe(1);
  });

  it('sin ofertas solo avanza a "Listo"', async () => {
    const wizard = setup();

    const ok = await wizard.publishOffers([]);

    expect(ok).toBe(true);
    expect(repo.publishOffer).not.toHaveBeenCalled();
    expect(wizard.step()).toBe(4);
    expect(wizard.publishedCount()).toBe(0);
  });

  it('debe registrar el error al publicar ofertas', async () => {
    const wizard = setup();
    vi.mocked(repo.publishOffer).mockReturnValue(throwError(() => new Error('boom')));

    const ok = await wizard.publishOffers([{ productId: 'p-1', margin: 15 }]);

    expect(ok).toBe(false);
    expect(wizard.error()).toBe('boom');
    expect(notification.showError).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VendorStoreStore } from './vendor-store.store';
import { STORE_REPOSITORY, StoreRepository } from '../../../stores/public-api';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { Store } from '../../../products/public-api';

const store: Store = {
  id: 't-1',
  vendorId: 'u-1',
  name: 'Mi Tienda',
  description: 'Ropa y accesorios',
  companyId: 'e-1',
  ownerUserId: 'u-1',
  participationPercentage: 100,
  createdAt: '2026-10-21T20:57:47.870Z',
};

describe('VendorStoreStore', () => {
  let repo: StoreRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      createStore: vi.fn(),
      getMyStore: vi.fn(() => of(store)),
      publishOffer: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        VendorStoreStore,
        { provide: STORE_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(VendorStoreStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe iniciar sin tienda y sin carga', () => {
    const vendorStore = setup();

    expect(vendorStore.store()).toBeNull();
    expect(vendorStore.loaded()).toBe(false);
    expect(vendorStore.loading()).toBe(false);
  });

  it('debe cargar la ficha de la tienda', async () => {
    const vendorStore = setup();

    vendorStore.load();

    await vi.waitFor(() => expect(vendorStore.store()).toEqual(store));
    expect(vendorStore.loaded()).toBe(true);
    expect(vendorStore.loading()).toBe(false);
    expect(vendorStore.error()).toBeNull();
  });

  it('debe marcar loaded cuando no hay tienda (404 → null)', async () => {
    const vendorStore = setup();
    vi.mocked(repo.getMyStore).mockReturnValue(of(null));

    vendorStore.load();

    await vi.waitFor(() => expect(vendorStore.loaded()).toBe(true));
    expect(vendorStore.store()).toBeNull();
    expect(vendorStore.error()).toBeNull();
  });

  it('debe registrar el error de carga sin mensaje', async () => {
    const vendorStore = setup();
    vi.mocked(repo.getMyStore).mockReturnValue(throwError(() => new Error('')));

    vendorStore.load();

    await vi.waitFor(() => expect(vendorStore.error()).toBe('No se pudo cargar tu tienda.'));
    expect(vendorStore.loading()).toBe(false);
    expect(vendorStore.loaded()).toBe(true);
    expect(notification.showError).toHaveBeenCalled();
  });

  it('debe reintentar la carga y limpiar el estado', async () => {
    const vendorStore = setup();
    vendorStore.load();
    await vi.waitFor(() => expect(vendorStore.store()).toEqual(store));
    vi.mocked(repo.getMyStore).mockClear();

    vendorStore.refresh();
    await vi.waitFor(() => expect(repo.getMyStore).toHaveBeenCalledTimes(1));

    vendorStore.clearError();
    expect(vendorStore.error()).toBeNull();

    vendorStore.reset();
    expect(vendorStore.store()).toBeNull();
    expect(vendorStore.loaded()).toBe(false);
  });
});

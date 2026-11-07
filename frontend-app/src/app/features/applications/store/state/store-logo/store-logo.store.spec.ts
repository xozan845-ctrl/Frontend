import { signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { STORAGE_REPOSITORY, StorageRepository } from '../../../storage/public-api';
import { STORE_REPOSITORY, StoreRepository } from '../../../onboarding/public-api';
import type { Store } from '../../../shop/public-api';
import { VendorStoreStore } from '../vendor-store/vendor-store.store';
import { StoreLogoStore } from './store-logo.store';

const store: Store = {
  id: 't-1',
  vendorId: 'u-1',
  name: 'Mi Tienda',
  description: '',
};

describe('StoreLogoStore', () => {
  let storeRepo: StoreRepository;
  let storageRepo: StorageRepository;
  let vendorStore: {
    store: Signal<Store | null>;
    applyStoreUpdate: ReturnType<typeof vi.fn>;
  };
  let notification: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const setup = () => {
    storeRepo = {
      createStore: vi.fn(),
      getMyStore: vi.fn(),
      publishOffer: vi.fn(),
      updateLogo: vi.fn(() => of({ ...store, logoObjectId: 'l-1', logoUrl: '/logo.png' })),
    };
    storageRepo = {
      bucket: vi.fn(),
      objects: vi.fn(),
      requestUpload: vi.fn(() =>
        of({
          objectId: 'l-1',
          bucket: 'bucket',
          key: 'logo.png',
          uploadUrl: 'https://upload.test/logo.png',
          method: 'PUT',
          headers: {},
          expiresAt: '',
          maxBytes: 0,
        }),
      ),
      uploadToUrl: vi.fn(() => of(undefined)),
      confirm: vi.fn(() =>
        of({
          id: 'l-1',
          bucket: 'bucket',
          key: 'logo.png',
          name: 'logo.png',
          contentType: 'image/png',
          folder: 'tiendas',
          description: '',
          tags: {},
          sizeBytes: 4,
          status: 'activo' as const,
          uploadedBy: null,
          createdAt: '',
          confirmedAt: '',
          deletedAt: null,
        }),
      ),
      download: vi.fn(),
      delete: vi.fn(),
    };
    vendorStore = {
      store: signal<Store | null>(store).asReadonly(),
      applyStoreUpdate: vi.fn(),
    };
    notification = { showSuccess: vi.fn(), showError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        StoreLogoStore,
        { provide: STORE_REPOSITORY, useValue: storeRepo },
        { provide: STORAGE_REPOSITORY, useValue: storageRepo },
        { provide: VendorStoreStore, useValue: vendorStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(StoreLogoStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe subir y asociar el logo de la tienda', async () => {
    const storeLogo = setup();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    storeLogo.upload(file);

    await vi.waitFor(() => expect(storeLogo.uploading()).toBe(false));
    expect(storageRepo.requestUpload).toHaveBeenCalledWith({
      name: 'logo.png',
      contentType: 'image/png',
      sizeBytes: file.size,
      folder: 'tiendas',
      isPublic: true,
      description: 'Logo de Mi Tienda',
    });
    expect(storeRepo.updateLogo).toHaveBeenCalledWith('t-1', 'l-1');
    expect(vendorStore.applyStoreUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ logoObjectId: 'l-1' }),
    );
  });

  it('debe quitar el logo de la tienda', async () => {
    const storeLogo = setup();
    vi.mocked(storeRepo.updateLogo).mockReturnValue(of({ ...store, logoObjectId: undefined }));

    storeLogo.remove('t-1');

    await vi.waitFor(() => expect(storeLogo.uploading()).toBe(false));
    expect(storeRepo.updateLogo).toHaveBeenCalledWith('t-1', null);
    expect(notification.showSuccess).toHaveBeenCalledWith('Logo de la tienda eliminado.');
  });

  it('debe rechazar archivos que no son imagen', async () => {
    const storeLogo = setup();

    storeLogo.upload(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));

    await vi.waitFor(() => expect(storeLogo.error()).toBe('El logo debe ser una imagen.'));
    expect(storageRepo.requestUpload).not.toHaveBeenCalled();
  });

  it('debe registrar el error de asociación', async () => {
    const storeLogo = setup();
    vi.mocked(storeRepo.updateLogo).mockReturnValue(throwError(() => new Error('')));

    storeLogo.upload(new File(['logo'], 'logo.png', { type: 'image/png' }));

    await vi.waitFor(() =>
      expect(storeLogo.error()).toBe('No se pudo actualizar el logo de la tienda.'),
    );
  });
});

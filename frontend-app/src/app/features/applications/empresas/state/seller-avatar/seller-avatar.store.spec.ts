import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { STORAGE_REPOSITORY, StorageRepository } from '../../../storage/public-api';
import { COMPANY_REPOSITORY, CompanyRepository } from '../../repositories/company.repository';
import { CompanyInvitationsStore } from '../company-invitations/company-invitations.store';
import { SellerAvatarStore } from './seller-avatar.store';

describe('SellerAvatarStore', () => {
  let companyRepo: CompanyRepository;
  let storageRepo: StorageRepository;
  let invitations: { applySellerAvatar: ReturnType<typeof vi.fn> };
  let notification: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const setup = () => {
    companyRepo = {
      create: vi.fn(),
      getById: vi.fn(),
      updateProfile: vi.fn(),
      updateSlug: vi.fn(),
      updateType: vi.fn(),
      updateLogistics: vi.fn(),
      createSeller: vi.fn(),
      updateSellerAvatar: vi.fn(() => of({ avatarObjectId: 'a-1', avatarUrl: '/avatar.png' })),
    };
    storageRepo = {
      bucket: vi.fn(),
      objects: vi.fn(),
      requestUpload: vi.fn(() =>
        of({
          objectId: 'a-1',
          bucket: 'bucket',
          key: 'avatar.png',
          uploadUrl: 'https://upload.test/avatar.png',
          method: 'PUT',
          headers: {},
          expiresAt: '',
          maxBytes: 0,
        }),
      ),
      uploadToUrl: vi.fn(() => of(undefined)),
      confirm: vi.fn(() =>
        of({
          id: 'a-1',
          bucket: 'bucket',
          key: 'avatar.png',
          name: 'avatar.png',
          contentType: 'image/png',
          folder: 'avatares',
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
    invitations = { applySellerAvatar: vi.fn() };
    notification = { showSuccess: vi.fn(), showError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SellerAvatarStore,
        { provide: COMPANY_REPOSITORY, useValue: companyRepo },
        { provide: STORAGE_REPOSITORY, useValue: storageRepo },
        { provide: CompanyInvitationsStore, useValue: invitations },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(SellerAvatarStore);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe subir y asociar el avatar del vendedor', async () => {
    const store = setup();
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    store.upload({ sellerId: 's-1', file });

    await vi.waitFor(() => expect(store.uploadingSellerId()).toBeNull());
    expect(storageRepo.requestUpload).toHaveBeenCalledWith({
      name: 'avatar.png',
      contentType: 'image/png',
      sizeBytes: file.size,
      folder: 'avatares',
      isPublic: true,
      description: 'Avatar del vendedor',
    });
    expect(companyRepo.updateSellerAvatar).toHaveBeenCalledWith('s-1', 'a-1');
    expect(invitations.applySellerAvatar).toHaveBeenCalledWith('s-1', {
      avatarObjectId: 'a-1',
      avatarUrl: '/avatar.png',
    });
    expect(notification.showSuccess).toHaveBeenCalledWith('Avatar actualizado.');
  });

  it('debe quitar el avatar del vendedor', async () => {
    const store = setup();
    vi.mocked(companyRepo.updateSellerAvatar).mockReturnValue(
      of({ avatarObjectId: null, avatarUrl: null }),
    );

    store.remove('s-1');

    await vi.waitFor(() => expect(store.uploadingSellerId()).toBeNull());
    expect(companyRepo.updateSellerAvatar).toHaveBeenCalledWith('s-1', null);
    expect(notification.showSuccess).toHaveBeenCalledWith('Avatar eliminado.');
  });

  it('debe rechazar archivos que no son imagen', async () => {
    const store = setup();

    store.upload({
      sellerId: 's-1',
      file: new File(['x'], 'doc.pdf', { type: 'application/pdf' }),
    });

    await vi.waitFor(() => expect(store.error()).toBe('El avatar debe ser una imagen.'));
    expect(storageRepo.requestUpload).not.toHaveBeenCalled();
  });

  it('debe registrar el error de asociación', async () => {
    const store = setup();
    vi.mocked(companyRepo.updateSellerAvatar).mockReturnValue(throwError(() => new Error('')));

    store.upload({
      sellerId: 's-1',
      file: new File(['avatar'], 'avatar.png', { type: 'image/png' }),
    });

    await vi.waitFor(() => expect(store.error()).toBe('No se pudo actualizar el avatar.'));
    expect(notification.showError).toHaveBeenCalled();
  });
});
